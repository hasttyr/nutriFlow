import { useId } from 'react';
import { ChevronDown, Store, Truck } from 'lucide-react';
import { getProductById } from '../data/products';
import { useCluster } from '../distributed/hooks';
import { NODES } from '../distributed/cluster';
import { useLive } from '../live/store';
import { acceptOrder, averageRating, deliver, markReady, rejectOrder } from '../live/orders';
import { signIn, useSession } from '../live/session';
import { useLocale } from '../i18n/useLocale';
import { createTranslator } from '../i18n/i18n';
import { profileFor } from '../region/profiles';
import { PageTitle, Panel, RoleGate, StatusChip, Stars } from '../components/LiveUi';
import GlassSelect from '../ui/GlassSelect';
import { smallButton } from '../ui/classes';

const selectTrigger = 'relative flex min-h-11 min-w-56 items-center gap-2 rounded-full border border-white/80 bg-white/70 py-2 pr-10 pl-4 text-ink shadow-glass-sm transition hover:bg-white/85';

// One order as the store sees it, with the action its stage allows.
const OrderCard = ({ order }) => {
  const { t, locale, localize, formatTime } = useLocale();
  const money = createTranslator(locale, profileFor(order.country)).formatPrice;
  const action = {
    placed: (
      <>
        <button type="button" onClick={() => acceptOrder(order.id)} className={`${smallButton} bg-leaf-600! text-white!`}>{t('merchant.accept')}</button>
        <button type="button" onClick={() => rejectOrder(order.id)} className={`${smallButton} text-rose-700`}>{t('merchant.reject')}</button>
      </>
    ),
    accepted: <button type="button" onClick={() => markReady(order.id)} className={smallButton}>{t('merchant.markReady')}</button>,
    ready: order.fulfillment === 'pickup' && <button type="button" onClick={() => deliver(order.id)} className={smallButton}>{t('merchant.handOver')}</button>
  }[order.status];

  return (
    <li className="rounded-2xl bg-white/70 p-4 ring-1 ring-white/80" data-testid={`merchant-order-${order.id}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-sm font-semibold text-ink">{order.id}</span>
        <StatusChip status={order.status} />
      </div>
      <p className="mb-2 flex items-center gap-1.5 text-sm text-ink/70">
        {order.fulfillment === 'delivery' ? <Truck aria-hidden="true" className="size-4" /> : <Store aria-hidden="true" className="size-4" />}
        {t(order.fulfillment === 'delivery' ? 'checkout.delivery' : 'checkout.pickup')} · {formatTime(Date.parse(order.createdAt))}
      </p>
      <ul className="mb-3 text-sm text-ink">
        {order.lines.map((line) => (
          <li key={line.id}>{line.quantity} × {localize(getProductById(line.id).name)}</li>
        ))}
      </ul>
      <p className="mb-3 font-semibold text-ink tabular-nums">{money(order.totals.total)}</p>
      {order.courierName && <p className="mb-3 text-sm text-ink/75">{t('merchant.courierComing', { name: order.courierName })}</p>}
      {order.status === 'ready' && order.fulfillment === 'delivery' && <p className="mb-3 text-sm text-amber-800">{t('orders.waitingCourier')}</p>}
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </li>
  );
};

const COLUMNS = [
  ['new', ['placed']],
  ['preparing', ['accepted']],
  ['ready', ['ready', 'assigned', 'onTheWay']],
  ['done', ['delivered', 'cancelled']]
];

const MerchantConsole = () => {
  const { t, formatNumber } = useLocale();
  const { activeNodeId } = useCluster();
  const live = useLive();
  const session = useSession();
  const labelId = useId();
  const storeId = NODES.some((node) => node.id === session.storeId) ? session.storeId : activeNodeId;
  const mine = live.orders.filter((order) => order.nodeId === storeId);
  const rating = averageRating(live.orders, 'store', (order) => order.nodeId === storeId);
  const storeName = NODES.find((node) => node.id === storeId)?.name;

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto">
        <PageTitle title={t('merchant.title')} subtitle={t('merchant.subtitle')}>
          <div className="grid gap-1">
            <span id={labelId} className="text-sm font-medium text-ink/70">{t('merchant.store')}</span>
            <GlassSelect
              value={storeId}
              options={NODES.map((node) => ({ value: node.id, label: node.name }))}
              onChange={(value) => signIn({ ...session, storeId: value })}
              labelledBy={labelId}
              className={selectTrigger}
            >
              <Store aria-hidden="true" className="size-4 text-ink/70" />
              <span className="truncate">{storeName}</span>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink/70" />
            </GlassSelect>
          </div>
        </PageTitle>
        <p className="mb-6 flex items-center gap-2 text-ink/80" data-testid="store-rating">
          {rating.count ? (
            <>
              <Stars value={rating.value} /> {t('merchant.rating', { value: formatNumber(Math.round(rating.value * 10) / 10), count: rating.count })}
            </>
          ) : (
            t('merchant.noRating')
          )}
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map(([column, statuses]) => {
            const orders = mine.filter((order) => statuses.includes(order.status)).slice(0, column === 'done' ? 8 : undefined);
            return (
              <Panel key={column} title={`${t(`merchant.column.${column}`)} · ${orders.length}`}>
                {orders.length === 0 ? (
                  <p className="text-sm text-ink/60">{t('merchant.empty')}</p>
                ) : (
                  <ul className="grid gap-3">{orders.map((order) => <OrderCard key={order.id} order={order} />)}</ul>
                )}
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Merchant = () => (
  <RoleGate role="merchant">
    <MerchantConsole />
  </RoleGate>
);

export default Merchant;
