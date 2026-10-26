import { Link } from 'react-router';
import { ArrowRight, Flame, Minus, PackageOpen, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../cart/useCart';
import { MAX_QUANTITY, MIN_QUANTITY, TAX_RATE } from '../cart/cart';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import { calorieChip, pageHeading, primaryButton, sectionHeading } from '../ui/classes';

const stepButton = 'flex size-11 cursor-pointer items-center justify-center rounded-full text-ink transition duration-200 ease-out hover:bg-white/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500';

const Cart = () => {
  const { items, totalCalories, subtotal, tax, total, updateQuantity, removeItem } = useCart();
  const { t, localize, formatPrice } = useLocale();

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto">
        <h1 className={`${pageHeading} mb-8 text-center sm:mb-12`}>{t('cart.title')}</h1>

        {items.length === 0 ? (
          <Glass tone="solid" className="mx-auto max-w-xl rounded-3xl p-10 text-center">
            <PackageOpen aria-hidden="true" className="mx-auto mb-4 size-10 text-ink/50" strokeWidth={1.5} />
            <p className="mb-6 text-lg text-ink/75">{t('cart.empty')}</p>
            <Link to="/products" className={primaryButton}>
              {t('common.continueShopping')}
            </Link>
          </Glass>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Glass as="ul" tone="solid" className="divide-y divide-white/70 overflow-hidden rounded-3xl">
                {items.map((item) => {
                  const name = localize(item.name);
                  return (
                    <li key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold tracking-tight text-ink">
                          <Link
                            to={`/product/${item.id}`}
                            className="rounded-md transition hover:text-citrus-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500"
                          >
                            {name}
                          </Link>
                        </h2>
                        <p className="font-medium text-ink/80 tabular-nums">{formatPrice(item.price)}</p>
                        <span className={`${calorieChip} mt-2`}>
                          <Flame aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
                          {t('common.calories', { count: item.calories })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-start">
                        <div className="flex items-center rounded-full border border-white/80 bg-white/55 p-0.5 shadow-glass-sm">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= MIN_QUANTITY}
                            aria-label={t('cart.decreaseFor', { name })}
                            className={stepButton}
                          >
                            <Minus aria-hidden="true" className="size-4" />
                          </button>
                          <span className="min-w-8 text-center font-semibold tabular-nums" aria-label={t('cart.quantityOf', { name })}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= MAX_QUANTITY}
                            aria-label={t('cart.increaseFor', { name })}
                            className={stepButton}
                          >
                            <Plus aria-hidden="true" className="size-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label={t('cart.removeFor', { name })}
                          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500"
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                          {t('cart.remove')}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </Glass>
            </div>

            <div>
              <Glass tone="solid" className="rounded-3xl p-6 lg:sticky lg:top-28">
                <h2 className={`${sectionHeading} mb-6`}>{t('summary.title')}</h2>

                <dl className="mb-6 space-y-3 tabular-nums">
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
                    <dd className="text-lg font-semibold" data-testid="cart-total">{formatPrice(total)}</dd>
                  </div>
                </dl>

                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-semibold text-ink/80">{t('summary.totalCalories')}</h3>
                  <div
                    className="flex items-center justify-center gap-2 rounded-2xl bg-citrus-100/80 px-4 py-3 text-lg font-semibold text-citrus-800 tabular-nums ring-1 ring-citrus-300/70 ring-inset"
                    data-testid="cart-calories"
                  >
                    <Flame aria-hidden="true" className="size-5" />
                    {t('common.calories', { count: totalCalories })}
                  </div>
                </div>

                <Link to="/checkout" className={`${primaryButton} w-full`}>
                  {t('cart.checkout')}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Glass>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
