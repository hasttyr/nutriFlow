import { useState } from 'react';
import { Link } from 'react-router';
import { CircleCheck, Flame, Info, Lock, PackageOpen } from 'lucide-react';
import { useCart } from '../cart/useCart';
import { TAX_RATE } from '../cart/cart';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import { fieldInput, fieldLabel, pageHeading, primaryButton, sectionHeading } from '../ui/classes';

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  city: '',
  zipCode: '',
  cardNumber: '',
  expiryDate: '',
  cvv: ''
};

const Field = ({ id, label, className = '', ...inputProps }) => (
  <div className={className}>
    <label htmlFor={id} className={fieldLabel}>{label}</label>
    <input id={id} name={id} className={fieldInput} required {...inputProps} />
  </div>
);

const Checkout = () => {
  const { items, totalCalories, subtotal, tax, total, clearCart } = useCart();
  const { t, localize, formatPrice } = useLocale();
  const [formData, setFormData] = useState(initialFormData);
  const [placedOrder, setPlacedOrder] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Demo only: in a real app this would go to a payment provider; card data is never stored.
    setPlacedOrder({ email: formData.email, total, totalCalories });
    setFormData(initialFormData);
    clearCart();
  };

  const fieldProps = (id) => ({ id, value: formData[id], onChange: handleInputChange, label: t(`checkout.${id}`) });

  if (placedOrder) {
    return (
      <div className="px-4 py-10 sm:py-16">
        <Glass role="status" tone="solid" className="container mx-auto max-w-xl rounded-3xl p-10 text-center">
          <CircleCheck aria-hidden="true" className="mx-auto mb-4 size-12 text-leaf-600" strokeWidth={1.75} />
          <h1 className="mb-4 text-3xl font-semibold tracking-tight text-ink">{t('checkout.successTitle')}</h1>
          <p className="mb-2 text-ink/75">
            {t('checkout.successFor')} <span className="font-semibold text-ink">{placedOrder.email}</span>
          </p>
          <p className="mb-2 text-ink/75 tabular-nums">
            {t('checkout.successTotal')} <span className="font-semibold text-ink">{formatPrice(placedOrder.total)}</span>
            {' · '}
            <span className="font-semibold text-citrus-800">{t('common.calories', { count: placedOrder.totalCalories })}</span>
          </p>
          <p className="mb-8 text-sm text-ink/65">{t('checkout.successDemo')}</p>
          <Link to="/products" className={primaryButton}>
            {t('common.continueShopping')}
          </Link>
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
          <Link to="/products" className={primaryButton}>
            {t('common.continueShopping')}
          </Link>
        </Glass>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto max-w-6xl">
        <h1 className={`${pageHeading} mb-8 text-center sm:mb-12`}>{t('checkout.title')}</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="space-y-8 lg:col-span-2">
            <Glass as="fieldset" tone="solid" className="rounded-3xl p-6">
              <legend className={`${sectionHeading} float-left mb-6 w-full`}>{t('checkout.shipping')}</legend>
              <div className="clear-both grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field {...fieldProps('firstName')} type="text" autoComplete="given-name" />
                <Field {...fieldProps('lastName')} type="text" autoComplete="family-name" />
                <Field {...fieldProps('email')} type="email" autoComplete="email" className="sm:col-span-2" />
                <Field {...fieldProps('address')} type="text" autoComplete="street-address" className="sm:col-span-2" />
                <Field {...fieldProps('city')} type="text" autoComplete="address-level2" />
                <Field {...fieldProps('zipCode')} type="text" autoComplete="postal-code" />
              </div>
            </Glass>

            <Glass as="fieldset" tone="solid" className="rounded-3xl p-6">
              <legend className={`${sectionHeading} float-left mb-6 flex w-full items-center gap-2`}>
                <Lock aria-hidden="true" className="size-5 text-ink/60" />
                {t('checkout.payment')}
              </legend>
              <div className="clear-both grid grid-cols-2 gap-4">
                <Field
                  {...fieldProps('cardNumber')}
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  pattern="[0-9 ]{13,23}"
                  title={t('checkout.cardNumberHint')}
                  placeholder="1234 5678 9012 3456"
                  className="col-span-2"
                />
                <Field
                  {...fieldProps('expiryDate')}
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                  title={t('checkout.expiryHint')}
                  placeholder={t('checkout.expiryHint')}
                />
                <Field
                  {...fieldProps('cvv')}
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  pattern="[0-9]{3,4}"
                  title={t('checkout.cvvHint')}
                  placeholder="123"
                />
              </div>

              <p className="mt-6 flex items-start gap-2 rounded-2xl bg-white/60 px-4 py-3 text-sm text-ink/80 ring-1 ring-white/80 ring-inset">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-citrus-700" />
                {t('checkout.demoNotice')}
              </p>

              <p className="mt-6 flex items-baseline justify-between gap-3 text-ink tabular-nums lg:hidden" data-testid="mobile-total">
                <span className="font-semibold">{t('summary.total')}</span>
                <span>
                  <span className="text-lg font-semibold">{formatPrice(total)}</span>
                  <span className="text-ink/70"> · {t('common.calories', { count: totalCalories })}</span>
                </span>
              </p>

              <button type="submit" className={`${primaryButton} mt-4 w-full lg:mt-6`}>
                {t('checkout.placeOrder')}
              </button>
            </Glass>
          </form>

          <aside>
            <Glass tone="solid" className="rounded-3xl p-6 lg:sticky lg:top-28">
              <h2 className={`${sectionHeading} mb-6`}>{t('summary.title')}</h2>

              <ul className="mb-6 space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-ink">{localize(item.name)}</p>
                      <p className="text-sm text-ink/70 tabular-nums">{t('checkout.qty', { count: item.quantity })}</p>
                    </div>
                    <p className="font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                  </li>
                ))}
              </ul>

              <dl className="mb-6 space-y-3 border-t border-ink/10 pt-4 tabular-nums">
                <div className="flex justify-between">
                  <dt className="text-ink/75">{t('summary.subtotal')}</dt>
                  <dd className="font-medium">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/75">{t('summary.shipping')}</dt>
                  <dd className="font-medium">{formatPrice(0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/75">{t('summary.tax', { rate: Math.round(TAX_RATE * 100) })}</dt>
                  <dd className="font-medium">{formatPrice(tax)}</dd>
                </div>
                <div className="flex justify-between border-t border-ink/10 pt-3">
                  <dt className="text-lg font-semibold">{t('summary.total')}</dt>
                  <dd className="text-lg font-semibold">{formatPrice(total)}</dd>
                </div>
              </dl>

              <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-ink/80">{t('summary.totalCalories')}</h3>
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-citrus-100/80 px-4 py-3 text-lg font-semibold text-citrus-800 tabular-nums ring-1 ring-citrus-300/70 ring-inset">
                  <Flame aria-hidden="true" className="size-5" />
                  {t('common.calories', { count: totalCalories })}
                </div>
              </div>

              <div className="rounded-2xl bg-white/55 p-4 ring-1 ring-white/80 ring-inset">
                <h3 className="mb-1 text-sm font-semibold text-ink">{t('checkout.notesTitle')}</h3>
                <p className="text-sm text-ink/75">{t('checkout.notes', { count: totalCalories })}</p>
              </div>
            </Glass>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
