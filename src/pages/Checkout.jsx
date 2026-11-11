import { useState } from 'react';
import { Link } from 'react-router';
import { Banknote, ChevronDown, CircleCheck, CircleX, Clock, PackageOpen, Store, Truck } from 'lucide-react';
import { useCart } from '../cart/useCart';
import { NODES, getNode } from '../distributed/cluster';
import { missingAt, priceAt } from '../distributed/inventory';
import { QUORUM, placeOrder, replicationFactor } from '../distributed/orders';
import { useCluster } from '../distributed/hooks';
import { useLocale } from '../i18n/useLocale';
import Receipt from '../components/Receipt';
import TraceList from '../components/TraceList';
import Glass from '../ui/Glass';
import StatusDot from '../ui/StatusDot';
import { fieldInput, fieldLabel, pageHeading, primaryButton, sectionHeading } from '../ui/classes';
import { Field, Notice } from '../ui/Field';
import GlassSelect from '../ui/GlassSelect';
import { useRegion } from '../geo/region';
import { countryName } from '../region/profiles';
import { quote, toMajor } from '../region/money';
import { nameFields } from '../region/address';
import BrandMark from '../payments/BrandMark';
import CountryPicker from '../components/CountryPicker';
import PaymentStep from '../payments/PaymentStep';
import {
  cardBrand, digitsOf, expiryValid, formatCardNumber, formatExpiry, luhnValid, methodName, methodsFor, paymentCode
} from '../payments/methods';

const initialForm = {};
const autoComplete = {
  givenName: 'given-name', familyName: 'family-name', street: 'address-line1', apartment: 'address-line2', building: 'address-line2',
  complement: 'address-line2', neighborhood: 'address-level3', city: 'address-level2', state: 'address-level1', prefecture: 'address-level1',
  postalCode: 'postal-code'
};
const initialCard = { number: '', name: '', expiry: '', cvc: '' };

const selectTrigger = 'relative flex min-h-11 w-full items-center rounded-2xl border border-white/80 bg-white/60 py-2.5 pr-10 pl-4 text-ink shadow-[inset_0_1px_3px_rgb(19_32_26/0.1)] transition hover:bg-white/75 aria-expanded:bg-white/85';

const methodHint = (method) => method.hint ?? (method.kind === 'instant' && !method.qr ? 'payment.hint.transfer' : `payment.hint.${method.kind}`);

// Bars drawn from the reference digits, so each voucher gets its own "barcode".
const Barcode = ({ code }) => {
  const digits = [...code.replace(/\D/g, '')];
  const step = 200 / Math.max(digits.length, 1);
  return (
    <svg viewBox="0 0 200 40" aria-hidden="true" className="mt-3 h-10 w-full" preserveAspectRatio="none">
      {digits.map((digit, index) => (
        <rect key={index} x={index * step} y="0" width={1 + (Number(digit) % 3)} height="40" fill="#13201a" />
      ))}
    </svg>
  );
};

const optionCard = 'flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/80 transition ring-inset hover:bg-white/70 has-checked:bg-white/85 has-checked:ring-2 has-checked:ring-citrus-500';

const Checkout = () => {
  const { items, clearCart } = useCart();
  const { activeNodeId, nodes } = useCluster();
  const { t, locale, localize, formatPercent, formatPrice, profile } = useLocale();
  const region = useRegion();
  const [fulfillment, setFulfillment] = useState('delivery');
  const [pickupNodeId, setPickupNodeId] = useState(activeNodeId);
  const [paymentId, setPaymentId] = useState(null);
  const [card, setCard] = useState(initialCard);
  const [cardError, setCardError] = useState(null);
  const [bankChoice, setBankChoice] = useState(null);
  const [pending, setPending] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [phase, setPhase] = useState('form');
  const [trace, setTrace] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [tipChoice, setTipChoice] = useState(null);

  // Prices belong to the branch that will serve the order.
  const pricingNodeId = fulfillment === 'pickup' ? pickupNodeId : activeNodeId;
  const lines = items.map((item) => ({ ...item, price: priceAt(pricingNodeId, item) }));
  // A tip picked in another country only holds if this country offers the same option.
  const tipOptions = profile.tip.mode === 'none' ? [] : [0, ...profile.tip.suggestedPercents];
  const tipPercent = tipOptions.includes(tipChoice) ? tipChoice : profile.tip.defaultPercent;
  const totals = quote(lines, { fulfillment, tipPercent }, profile);
  const taxLabel = (entry) => `${entry.name} ${formatPercent(entry.rate)}`;
  const orderItems = items.map(({ id, quantity }) => ({ id, quantity }));

  // The country's profile lists its methods, most used first.
  const methods = methodsFor(profile);
  const method = methods.find((option) => option.id === paymentId) ?? methods[0];
  const bank = method.banks?.includes(bankChoice) ? bankChoice : method.banks?.[0];
  const place = countryName(locale, region.country);
  const brand = cardBrand(card.number);

  const fieldProps = (id, label = `checkout.${id}`) => ({
    id,
    value: form[id] ?? '',
    onChange: (event) => setForm((current) => ({ ...current, [id]: event.target.value })),
    label: t(label),
    autoComplete: autoComplete[id]
  });

  const setCardField = (id, value) => {
    setCardError(null);
    setCard((current) => ({ ...current, [id]: value }));
  };

  const submitOrder = async (payment, paid) => {
    setTrace([]);
    setPhase('processing');
    try {
      const order = await placeOrder({ items: orderItems, fulfillment, nodeId: pricingNodeId }, setTrace);
      // The total is recomputed at the branch that actually took the order (it may have failed over).
      const orderLines = items.map((item) => ({ ...item, price: priceAt(order.nodeId, item) }));
      const orderTotals = quote(orderLines, { fulfillment, tipPercent }, profile);
      // The issue time is stored in UTC (ISO 8601) and shown in the country's time zone.
      setOutcome({ order, payment, requestedNodeId: pricingNodeId, lines: orderLines, totals: orderTotals, total: orderTotals.total, customer: form, issuedAt: new Date().toISOString() });
      clearCart();
      setPhase('done');
    } catch (error) {
      setOutcome({ error, refunded: paid });
      setPhase('error');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (method.kind === 'card') {
      if (!luhnValid(card.number)) return setCardError({ field: 'cardNumber', message: t('payment.cardInvalid') });
      if (!expiryValid(card.expiry)) return setCardError({ field: 'cardExpiry', message: t('payment.expiryInvalid') });
    }
    const { total } = totals;
    const payment = {
      method,
      amount: formatPrice(total),
      phone: form.phone,
      bank,
      card: method.kind === 'card' ? { number: digitsOf(card.number), brand } : null,
      code: paymentCode(method, toMajor(total, profile))
    };
    // A voucher is paid later and cash on delivery, so those orders go straight to the stores;
    // everything else pays first.
    if (method.kind === 'voucher' || method.kind === 'cash') return submitOrder(payment, false);
    setPending(payment);
    setPhase('paying');
  };

  const handlePaid = ({ approved }) => {
    if (approved) return submitOrder(pending, true);
    setOutcome({ error: { reason: 'paymentDeclined' } });
    setPhase('error');
  };

  if (phase === 'paying') {
    return <PaymentStep method={pending.method} payment={pending} amount={pending.amount} onDone={handlePaid} />;
  }

  if (phase === 'processing') {
    return (
      <div className="px-4 py-10 sm:py-16">
        <Glass tone="solid" className="container mx-auto max-w-xl rounded-3xl p-6 sm:p-8">
          <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink" role="status">{t('checkout.processing')}</h1>
          <TraceList trace={trace} />
        </Glass>
      </div>
    );
  }

  if (phase === 'done') {
    const { order, payment, requestedNodeId, total } = outcome;
    return (
      <div className="px-4 py-10 sm:py-16">
        <Glass tone="solid" className="container mx-auto max-w-xl rounded-3xl p-6 sm:p-8">
          <div role="status" className="mb-6 text-center">
            <CircleCheck aria-hidden="true" className="mx-auto mb-4 size-12 text-leaf-600" strokeWidth={1.75} />
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-ink">{t('order.successTitle')}</h1>
            <p className="font-mono text-lg font-semibold text-ink">{t('order.id', { id: order.id })}</p>
            <p className="mt-2 text-ink/75 tabular-nums">
              {t('order.servedBy', { branch: getNode(order.nodeId).name })} · {formatPrice(total)}
            </p>
            {order.failover && (
              <p className="mt-1 text-sm text-amber-800">
                {t('order.failover', { branch: getNode(requestedNodeId).name, other: getNode(order.nodeId).name })}
              </p>
            )}
            <p className="mt-1 text-sm text-ink/70" data-testid="order-replication">
              {t('order.replicated', { copies: order.copies, total: replicationFactor(), quorum: QUORUM })}
            </p>
            <p className="mt-1 text-sm text-ink/70">{t(`order.eta.${fulfillment}`)}</p>
            {payment.method.kind !== 'voucher' && payment.method.kind !== 'cash' && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/70 py-1 pr-4 pl-1 text-sm font-medium text-ink ring-1 ring-white/80" data-testid="order-payment">
                <BrandMark id={payment.card?.brand ?? payment.method.id} />
                {t('payment.paidWith', { method: payment.card ? t('payment.cardLabel', { last4: payment.card.number.slice(-4) }) : payment.method.name })}
              </p>
            )}
          </div>
          {payment.method.kind === 'cash' && (
            <div className="mb-6 rounded-2xl bg-white/80 p-4 ring-1 ring-white/80" data-testid="order-cash">
              <p className="mb-1 flex items-center gap-2 font-semibold text-ink">
                <Banknote aria-hidden="true" className="size-5 text-leaf-700" />
                {t('payment.cashTitle')}
              </p>
              <p className="text-sm text-ink/75">{t('payment.cashText', { amount: formatPrice(total) })}</p>
            </div>
          )}
          {payment.method.kind === 'voucher' && (
            <div className="mb-6 rounded-2xl bg-white/80 p-4 ring-1 ring-amber-300/70" data-testid="order-voucher">
              <p className="mb-2 flex flex-wrap items-center gap-3 font-semibold text-ink">
                <BrandMark id={payment.method.id} />
                <span className="flex items-center gap-1.5">
                  <Clock aria-hidden="true" className="size-4 text-amber-700" />
                  {t('payment.voucherTitle', { method: methodName(payment.method, t) })}
                </span>
              </p>
              <p className="mb-3 text-sm text-ink/75">{t('payment.voucherText', { amount: formatPrice(total) })}</p>
              <p className="text-xs font-medium tracking-wide text-ink/60 uppercase">{t('payment.reference')}</p>
              <p className="font-mono text-base font-semibold break-all text-ink">{payment.code}</p>
              <Barcode code={payment.code} />
            </div>
          )}
          <Receipt order={order} customer={outcome.customer} lines={outcome.lines} totals={outcome.totals} payment={payment} fulfillment={fulfillment} issuedAt={outcome.issuedAt} />
          <h2 className="mb-3 text-lg font-semibold text-ink">{t('order.trace')}</h2>
          <TraceList trace={order.trace} />
          <div className="mt-8 text-center">
            <Link to="/products" className={primaryButton}>{t('common.continueShopping')}</Link>
          </div>
        </Glass>
      </div>
    );
  }

  if (phase === 'error') {
    const { error } = outcome;
    return (
      <div className="px-4 py-10 sm:py-16">
        <Glass tone="solid" className="container mx-auto max-w-xl rounded-3xl p-6 sm:p-8">
          <div role="alert" className="mb-6 text-center">
            <CircleX aria-hidden="true" className="mx-auto mb-4 size-12 text-rose-600" strokeWidth={1.75} />
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink">{t('order.errorTitle')}</h1>
            <p className="text-ink/80">{t(`order.error.${error.reason ?? 'unknown'}`, { branch: getNode(error.nodeId ?? pricingNodeId).name })}</p>
            {outcome.refunded && <p className="mt-2 text-sm text-ink/70">{t('payment.refunded')}</p>}
          </div>
          {error.reason !== 'paymentDeclined' && <TraceList trace={trace} />}
          <div className="mt-8 text-center">
            <button type="button" onClick={() => setPhase('form')} className={primaryButton}>{t('common.retry')}</button>
          </div>
        </Glass>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-10 sm:py-16">
        <Glass tone="solid" className="container mx-auto max-w-xl rounded-3xl p-10 text-center">
          <h1 className="mb-4 text-3xl font-semibold tracking-tight text-ink">{t('checkout.title')}</h1>
          <PackageOpen aria-hidden="true" className="mx-auto mb-4 size-10 text-ink/50" strokeWidth={1.5} />
          <p className="mb-6 text-lg text-ink/75">{t('cart.empty')}</p>
          <Link to="/products" className={primaryButton}>{t('common.continueShopping')}</Link>
        </Glass>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto max-w-6xl">
        <h1 className={`${pageHeading} mb-6 sm:mb-8`}>{t('checkout.title')}</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
            <Glass as="fieldset" tone="solid" className="rounded-3xl p-5 sm:p-6">
              <legend className={`${sectionHeading} float-left mb-4 w-full`}>{t('checkout.fulfillment')}</legend>
              <div className="clear-both grid gap-3 sm:grid-cols-2">
                <label className={optionCard}>
                  <input type="radio" name="fulfillment" value="delivery" checked={fulfillment === 'delivery'} onChange={() => setFulfillment('delivery')} className="mt-1 size-5 accent-citrus-600" />
                  <span>
                    <span className="flex items-center gap-2 font-semibold text-ink"><Truck aria-hidden="true" className="size-5" />{t('checkout.delivery')}</span>
                    <span className="mt-1 block text-sm text-ink/70">{t('checkout.deliveryHint', { branch: getNode(activeNodeId).name })}</span>
                  </span>
                </label>
                <label className={optionCard}>
                  <input type="radio" name="fulfillment" value="pickup" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} className="mt-1 size-5 accent-citrus-600" />
                  <span>
                    <span className="flex items-center gap-2 font-semibold text-ink"><Store aria-hidden="true" className="size-5" />{t('checkout.pickup')}</span>
                    <span className="mt-1 block text-sm text-ink/70">{t('checkout.pickupHint')}</span>
                  </span>
                </label>
              </div>

              {fulfillment === 'pickup' && (
                <div role="radiogroup" aria-label={t('checkout.pickupBranch')} className="mt-5 space-y-2">
                  <p className={fieldLabel}>{t('checkout.pickupBranch')}</p>
                  {NODES.map((node) => {
                    const missing = missingAt(node.id, orderItems).length;
                    const status = nodes[node.id].status;
                    return (
                      <label key={node.id} className={optionCard}>
                        <input type="radio" name="pickupNode" value={node.id} checked={pickupNodeId === node.id} onChange={() => setPickupNodeId(node.id)} className="mt-1 size-5 accent-citrus-600" />
                        <span className="flex flex-1 flex-wrap items-center justify-between gap-2">
                          <span>
                            <span className="block font-semibold text-ink">{node.name}</span>
                            <span className="block text-sm text-ink/65">{localize(node.zone)}</span>
                          </span>
                          <span className="flex items-center gap-2 text-sm">
                            <StatusDot status={status} />
                            {status === 'offline' ? (
                              <span className="text-rose-700">{t('branch.status.offline')}</span>
                            ) : missing === 0 ? (
                              <span className="text-leaf-700">{t('checkout.hasAll')}</span>
                            ) : (
                              <span className="text-amber-800">{t('checkout.missing', { count: missing })}</span>
                            )}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </Glass>

            <Glass as="fieldset" tone="solid" className="rounded-3xl p-5 sm:p-6">
              <legend className={`${sectionHeading} float-left mb-4 w-full`}>{t('checkout.contact')}</legend>
              <div className="clear-both grid grid-cols-1 gap-4 sm:grid-cols-2">
                {nameFields(profile).map((id) => (
                  <Field key={id} {...fieldProps(id)} type="text" required />
                ))}
                <Field
                  {...fieldProps('phone')}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  pattern={profile.phone.pattern}
                  title={t('checkout.phoneHint', { example: profile.phone.example })}
                  placeholder={profile.phone.example}
                  required
                />
                {fulfillment === 'delivery' && (
                  <>
                    {profile.address.fields.map((id) =>
                      id === 'postalCode' ? (
                        <Field key={id} {...fieldProps(id, 'address.postalCode')} type="text" pattern={profile.postalCode.pattern} placeholder={profile.postalCode.example} required={!profile.address.optional.includes(id)} />
                      ) : (
                        <Field key={id} {...fieldProps(id, `address.${id}`)} type="text" placeholder={profile.address.example[id]} required={!profile.address.optional.includes(id)} />
                      )
                    )}
                    <Field {...fieldProps('notes')} type="text" className="sm:col-span-2" />
                  </>
                )}
              </div>
            </Glass>

            {tipOptions.length > 0 && (
              <Glass as="fieldset" tone="solid" className="rounded-3xl p-5 sm:p-6">
                <legend className={`${sectionHeading} float-left mb-2 w-full`}>{t('summary.tip')}</legend>
                <p className="clear-both mb-4 text-sm text-ink/70">{t('summary.tipHint')}</p>
                <div className="flex flex-wrap gap-2">
                  {tipOptions.map((percent) => (
                    <label key={percent} className={`${optionCard} min-w-24 items-center justify-center py-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-citrus-600`}>
                      <input type="radio" name="tip" value={percent} checked={tipPercent === percent} onChange={() => setTipChoice(percent)} className="sr-only" />
                      <span className="font-semibold text-ink tabular-nums">{percent === 0 ? t('summary.noTip') : formatPercent(percent / 100)}</span>
                    </label>
                  ))}
                </div>
              </Glass>
            )}

            <Glass as="fieldset" tone="solid" className="rounded-3xl p-5 sm:p-6">
              <legend className={`${sectionHeading} float-left mb-4 w-full`}>{t('checkout.payment')}</legend>
              <div className="clear-both mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink/70" data-testid="payment-country">
                  {t('payment.localFor', { country: place })}
                </p>
                <span id="payment-country-label" className="sr-only">{t('payment.country')}</span>
                <CountryPicker labelledBy="payment-country-label" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {methods.map((option) => (
                  <label key={option.id} className={`${optionCard} items-center`}>
                    <input type="radio" name="payment" value={option.id} checked={method.id === option.id} onChange={() => setPaymentId(option.id)} className="size-5 shrink-0 accent-citrus-600" />
                    <BrandMark id={option.id} />
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{methodName(option, t)}</span>
                      <span className="block text-sm text-ink/70">{t(methodHint(option))}</span>
                    </span>
                  </label>
                ))}
              </div>

              {method.kind === 'card' && (
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="cardNumber" className={fieldLabel}>{t('payment.cardNumber')}</label>
                    <div className="relative">
                      <input
                        id="cardNumber"
                        name="cardNumber"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="4242 4242 4242 4242"
                        value={card.number}
                        onChange={(event) => setCardField('number', formatCardNumber(event.target.value))}
                        aria-invalid={cardError?.field === 'cardNumber' || undefined}
                        aria-describedby="card-test"
                        required
                        className={`${fieldInput} pr-20 font-mono tabular-nums`}
                      />
                      {brand && (
                        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
                          <BrandMark id={brand} />
                        </span>
                      )}
                    </div>
                  </div>
                  <Field
                    id="cardName"
                    label={t('payment.cardName')}
                    value={card.name}
                    onChange={(event) => setCardField('name', event.target.value)}
                    autoComplete="cc-name"
                    className="col-span-2"
                    required
                  />
                  <Field
                    id="cardExpiry"
                    label={t('payment.cardExpiry')}
                    value={card.expiry}
                    onChange={(event) => setCardField('expiry', formatExpiry(event.target.value))}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="12/29"
                    aria-invalid={cardError?.field === 'cardExpiry' || undefined}
                    required
                  />
                  <Field
                    id="cardCvc"
                    label={t('payment.cardCvc')}
                    value={card.cvc}
                    onChange={(event) => setCardField('cvc', digitsOf(event.target.value).slice(0, 4))}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    pattern="[0-9]{3,4}"
                    placeholder="123"
                    required
                  />
                  {cardError && <p role="alert" className="col-span-2 text-sm font-medium text-rose-700">{cardError.message}</p>}
                  <p id="card-test" className="col-span-2 text-sm text-ink/65">{t('payment.cardTest')}</p>
                </div>
              )}

              {method.banks && (
                <div className="mt-5">
                  <p id="bank-label" className={fieldLabel}>{t('payment.bank')}</p>
                  <GlassSelect
                    value={bank}
                    options={method.banks.map((name) => ({ value: name, label: name }))}
                    onChange={setBankChoice}
                    labelledBy="bank-label"
                    className={selectTrigger}
                  >
                    {bank}
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink/70 transition-transform duration-200 in-aria-expanded:rotate-180" />
                  </GlassSelect>
                </div>
              )}

              <Notice className="mt-5">{t('checkout.demoNotice')}</Notice>

              <p className="mt-6 flex items-baseline justify-between gap-3 text-ink tabular-nums lg:hidden" data-testid="mobile-total">
                <span className="font-semibold">{t('summary.total')}</span>
                <span className="text-lg font-semibold">{formatPrice(totals.total)}</span>
              </p>
              <button type="submit" className={`${primaryButton} mt-4 w-full lg:mt-6`}>
                {t('checkout.placeOrder')}
              </button>
            </Glass>
          </form>

          <aside>
            <Glass tone="solid" className="rounded-3xl p-6 lg:sticky lg:top-28">
              <h2 className={`${sectionHeading} mb-4`}>{t('summary.title')}</h2>
              <p className="mb-4 flex items-center gap-2 text-sm text-ink/70">
                <StatusDot status={nodes[pricingNodeId].status} />
                {getNode(pricingNodeId).name}
              </p>
              <ul className="mb-6 space-y-3">
                {lines.map((line) => (
                  <li key={line.id} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-ink">{localize(line.name)}</p>
                      <p className="text-sm text-ink/70 tabular-nums">{t('checkout.qty', { count: line.quantity })}</p>
                    </div>
                    <p className="font-medium tabular-nums">{formatPrice(line.price * line.quantity)}</p>
                  </li>
                ))}
              </ul>
              <dl className="space-y-3 border-t border-ink/10 pt-4 tabular-nums">
                <div className="flex justify-between">
                  <dt className="text-ink/75">{t('summary.subtotal')}</dt>
                  <dd className="font-medium">{formatPrice(totals.subtotal)}</dd>
                </div>
                {fulfillment === 'delivery' && (
                  <div className="flex justify-between">
                    <dt className="text-ink/75">{t('summary.delivery')}</dt>
                    <dd className="font-medium">{totals.delivery === 0 ? t('summary.free') : formatPrice(totals.delivery)}</dd>
                  </div>
                )}
                {totals.taxes.map((entry) => (
                  <div key={entry.name + entry.rate} className="flex justify-between gap-4" data-testid="checkout-tax">
                    <dt className="text-ink/75">{totals.taxIncluded ? t('summary.taxIncluded', { tax: taxLabel(entry) }) : taxLabel(entry)}</dt>
                    <dd className={totals.taxIncluded ? 'text-ink/70' : 'font-medium'}>{formatPrice(entry.amount)}</dd>
                  </div>
                ))}
                {tipOptions.length > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink/75">{t('summary.tip')}</dt>
                    <dd className="font-medium" data-testid="checkout-tip">{formatPrice(totals.tip)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-ink/10 pt-3">
                  <dt className="text-lg font-semibold">{t('summary.total')}</dt>
                  <dd className="text-lg font-semibold" data-testid="checkout-total">{formatPrice(totals.total)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-ink/65">
                {totals.taxIncluded ? t('summary.taxNote.included') : t('summary.taxNote.excluded', { tax: profile.tax.name })}
              </p>
            </Glass>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
