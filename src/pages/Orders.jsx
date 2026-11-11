import { Link } from 'react-router';
import { ChevronRight, PackageOpen } from 'lucide-react';
import { useLive } from '../live/store';
import { useLocale } from '../i18n/useLocale';
import { createTranslator } from '../i18n/i18n';
import { profileFor } from '../region/profiles';
import { PageTitle, StatusChip } from '../components/LiveUi';
import Glass from '../ui/Glass';
import { primaryButton } from '../ui/classes';

// The customer's orders on this device, newest first; each opens its live tracking.
const Orders = () => {
  const { t, locale, formatDate, formatTime } = useLocale();
  const { orders } = useLive();

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto max-w-3xl">
        <PageTitle title={t('orders.title')} />
        {orders.length === 0 ? (
          <Glass tone="solid" className="rounded-3xl p-10 text-center">
            <PackageOpen aria-hidden="true" className="mx-auto mb-4 size-10 text-ink/50" strokeWidth={1.5} />
            <p className="mb-2 text-lg text-ink">{t('orders.empty')}</p>
            <p className="mb-6 text-ink/70">{t('orders.emptyHint')}</p>
            <Link to="/products" className={primaryButton}>{t('common.continueShopping')}</Link>
          </Glass>
        ) : (
          <ul className="grid gap-3">
            {orders.map((order) => {
              const created = Date.parse(order.createdAt);
              return (
                <li key={order.id}>
                  <Link
                    to={`/orders/${order.id}`}
                    className="flex items-center gap-4 rounded-3xl border border-white/70 bg-white/60 p-4 shadow-glass-sm backdrop-blur-xl transition hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-citrus-500 sm:p-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-semibold text-ink">{order.id}</span>
                        <StatusChip status={order.status} />
                      </p>
                      <p className="mt-1 text-sm text-ink/70">
                        {order.storeName} · {formatDate(created)} {formatTime(created)}
                      </p>
                    </div>
                    <span className="font-semibold text-ink tabular-nums">{createTranslator(locale, profileFor(order.country)).formatPrice(order.totals.total)}</span>
                    <ChevronRight aria-hidden="true" className="size-5 text-ink/50" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Orders;
