import { useState } from 'react';
import { Link } from 'react-router';
import { CircleCheck, CircleX, PackageOpen, Store, Truck } from 'lucide-react';
import { useCart } from '../cart/useCart';
import { deliveryFee } from '../cart/cart';
import { NODES, getNode } from '../distributed/cluster';
import { missingAt, priceAt } from '../distributed/inventory';
import { QUORUM, placeOrder } from '../distributed/orders';
import { useCluster } from '../distributed/hooks';
import { useLocale } from '../i18n/useLocale';
import TraceList from '../components/TraceList';
import Glass from '../ui/Glass';
import StatusDot from '../ui/StatusDot';
import { fieldLabel, pageHeading, primaryButton, sectionHeading } from '../ui/classes';
import { Field, Notice } from '../ui/Field';

const initialForm = { name: '', phone: '', address: '', neighborhood: '', notes: '' };

const optionCard = 'flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/80 transition ring-inset hover:bg-white/70 has-checked:bg-white/85 has-checked:ring-2 has-checked:ring-citrus-500';

const Checkout = () => {
  const { items, clearCart } = useCart();
  const { activeNodeId, nodes } = useCluster();
  const { t, localize, formatPrice } = useLocale();
  const [fulfillment, setFulfillment] = useState('delivery');
  const [pickupNodeId, setPickupNodeId] = useState(activeNodeId);
  const [payment, setPayment] = useState('cash');
  const [form, setForm] = useState(initialForm);
  const [phase, setPhase] = useState('form');
  const [trace, setTrace] = useState([]);
  const [outcome, setOutcome] = useState(null);

  // Prices belong to the branch that will serve the order.
  const pricingNodeId = fulfillment === 'pickup' ? pickupNodeId : activeNodeId;
  const lines = items.map((item) => ({ ...item, price: priceAt(pricingNodeId, item) }));
  const subtotal = lines.reduce((total, line) => total + line.price * line.quantity, 0);
  const fee = deliveryFee(subtotal, fulfillment);
  const orderItems = items.map(({ id, quantity }) => ({ id, quantity }));

  const fieldProps = (id) => ({
    id,
    value: form[id],
    onChange: (event) => setForm((current) => ({ ...current, [id]: event.target.value })),
    label: t(`checkout.${id}`)
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTrace([]);
    setPhase('processing');
    try {
      const order = await placeOrder({ items: orderItems, fulfillment, nodeId: pricingNodeId }, setTrace);
      // The total is recomputed at the branch that actually took the order (it may have failed over).
      const orderSubtotal = items.reduce((total, item) => total + priceAt(order.nodeId, item) * item.quantity, 0);
      setOutcome({ order, requestedNodeId: pricingNodeId, total: orderSubtotal + deliveryFee(orderSubtotal, fulfillment) });
      clearCart();
      setPhase('done');
    } catch (error) {
      setOutcome({ error });
      setPhase('error');
    }
  };

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
    const { order, requestedNodeId, total } = outcome;
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
              {t('order.replicated', { copies: order.copies, total: NODES.length, quorum: QUORUM })}
            </p>
            <p className="mt-1 text-sm text-ink/70">{t(`order.eta.${fulfillment}`)}</p>
          </div>
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
          </div>
          <TraceList trace={trace} />
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
                <Field {...fieldProps('name')} type="text" autoComplete="name" required />
                <Field
                  {...fieldProps('phone')}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  pattern="[0-9]{10}"
                  title={t('checkout.phoneHint')}
                  placeholder="3001234567"
                  required
                />
                {fulfillment === 'delivery' && (
                  <>
                    <Field {...fieldProps('address')} type="text" autoComplete="street-address" className="sm:col-span-2" required />
                    <Field {...fieldProps('neighborhood')} type="text" autoComplete="address-level3" required />
                    <Field {...fieldProps('notes')} type="text" />
                  </>
                )}
              </div>
            </Glass>

            <Glass as="fieldset" tone="solid" className="rounded-3xl p-5 sm:p-6">
              <legend className={`${sectionHeading} float-left mb-4 w-full`}>{t('checkout.payment')}</legend>
              <div className="clear-both grid gap-3 sm:grid-cols-2">
                {['cash', 'cardTerminal'].map((method) => (
                  <label key={method} className={`${optionCard} items-center`}>
                    <input type="radio" name="payment" value={method} checked={payment === method} onChange={() => setPayment(method)} className="size-5 accent-citrus-600" />
                    <span className="font-semibold text-ink">{t(`checkout.${method}`)}</span>
                  </label>
                ))}
              </div>
              <Notice className="mt-5">{t('checkout.demoNotice')}</Notice>

              <p className="mt-6 flex items-baseline justify-between gap-3 text-ink tabular-nums lg:hidden" data-testid="mobile-total">
                <span className="font-semibold">{t('summary.total')}</span>
                <span className="text-lg font-semibold">{formatPrice(subtotal + fee)}</span>
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
                  <dd className="font-medium">{formatPrice(subtotal)}</dd>
                </div>
                {fulfillment === 'delivery' && (
                  <div className="flex justify-between">
                    <dt className="text-ink/75">{t('summary.delivery')}</dt>
                    <dd className="font-medium">{fee === 0 ? t('summary.free') : formatPrice(fee)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-ink/10 pt-3">
                  <dt className="text-lg font-semibold">{t('summary.total')}</dt>
                  <dd className="text-lg font-semibold" data-testid="checkout-total">{formatPrice(subtotal + fee)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-ink/65">{t('summary.vat')}</p>
            </Glass>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
