import { useId } from 'react';
import { Bike, ChevronDown, MapPin, Store } from 'lucide-react';
import { distanceMeters } from '../geo/location';
import { useRegion } from '../geo/region';
import { useLive } from '../live/store';
import { averageRating, declineDelivery, deliver, fleet, pickUp, setCourierStatus } from '../live/orders';
import { signIn, useSession } from '../live/session';
import { useLocale } from '../i18n/useLocale';
import { formatAddress } from '../region/address';
import { profileFor } from '../region/profiles';
import { PageTitle, Panel, RoleGate, StatusChip, Stars } from '../components/LiveUi';
import GlassSelect from '../ui/GlassSelect';
import { glassButton, primaryButton, smallButton } from '../ui/classes';

const selectTrigger = 'relative flex min-h-11 min-w-56 items-center gap-2 rounded-full border border-white/80 bg-white/70 py-2 pr-10 pl-4 text-ink shadow-glass-sm transition hover:bg-white/85';

const Job = ({ order }) => {
  const { t, formatNumber } = useLocale();
  const km = formatNumber(Math.round(distanceMeters(order.storePosition, order.destination) / 100) / 10);
  return (
    <li className="rounded-2xl bg-white/70 p-4 ring-1 ring-white/80" data-testid={`job-${order.id}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-sm font-semibold text-ink">{order.id}</span>
        <StatusChip status={order.status} />
      </div>
      <p className="mb-1 flex items-start gap-2 text-ink"><Store aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{t('courier.from', { store: order.storeName })}</p>
      <p className="mb-1 flex items-start gap-2 text-ink"><MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{t('courier.to', { address: formatAddress(order.customer, profileFor(order.country)) })}</p>
      <p className="mb-4 text-sm text-ink/65">{t('courier.distance', { km })}</p>
      <div className="flex flex-wrap gap-2">
        {order.status === 'assigned' && (
          <>
            <button type="button" onClick={() => pickUp(order.id)} className={primaryButton}>{t('courier.pickUp')}</button>
            <button type="button" onClick={() => declineDelivery(order.id)} className={smallButton}>{t('courier.decline')}</button>
          </>
        )}
        {order.status === 'onTheWay' && <button type="button" onClick={() => deliver(order.id)} className={primaryButton}>{t('courier.deliver')}</button>}
      </div>
    </li>
  );
};

const CourierApp = () => {
  const { t, formatNumber } = useLocale();
  const { country } = useRegion();
  const live = useLive();
  const session = useSession();
  const labelId = useId();
  const couriers = fleet(country, live);
  const me = couriers.find((courier) => courier.id === session.courierId) ?? couriers[0];
  const jobs = live.orders.filter((order) => order.courierId === me.id && (order.status === 'assigned' || order.status === 'onTheWay'));
  const done = live.orders.filter((order) => order.courierId === me.id && order.status === 'delivered').length;
  const rating = averageRating(live.orders, 'courier', (order) => order.courierId === me.id);
  const available = me.status === 'available';

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto max-w-5xl">
        <PageTitle title={t('courier.title')} subtitle={t('courier.subtitle')}>
          <div className="grid gap-1">
            <span id={labelId} className="text-sm font-medium text-ink/70">{t('courier.who')}</span>
            <GlassSelect
              value={me.id}
              options={couriers.map((courier) => ({ value: courier.id, label: courier.name }))}
              onChange={(value) => signIn({ ...session, courierId: value })}
              labelledBy={labelId}
              className={selectTrigger}
            >
              <Bike aria-hidden="true" className="size-4 text-ink/70" />
              <span className="truncate">{me.name}</span>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink/70" />
            </GlassSelect>
          </div>
        </PageTitle>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Panel title={t('courier.jobs')}>
            {jobs.length === 0 ? (
              <p className="text-ink/65">{t(available ? 'courier.empty' : 'courier.offlineHint')}</p>
            ) : (
              <ul className="grid gap-3">{jobs.map((order) => <Job key={order.id} order={order} />)}</ul>
            )}
          </Panel>

          <div className="grid content-start gap-6">
            <Panel>
              <p className="mb-3 flex items-center gap-2 font-semibold text-ink">
                <span aria-hidden="true" className={`size-3 rounded-full ${available ? 'bg-leaf-600' : 'bg-ink/30'}`} />
                <span data-testid="courier-status">{t(`courier.status.${me.status}`)}</span>
              </p>
              <button
                type="button"
                onClick={() => setCourierStatus(me.id, available ? 'offline' : 'available', country)}
                className={`${available ? glassButton : primaryButton} w-full`}
              >
                {t(available ? 'courier.goOffline' : 'courier.goOnline')}
              </button>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-white/60 p-3"><dt className="text-xs text-ink/65">{t('courier.delivered')}</dt><dd className="text-xl font-semibold tabular-nums">{formatNumber(done)}</dd></div>
                <div className="rounded-2xl bg-white/60 p-3">
                  <dt className="text-xs text-ink/65">{t('courier.rating')}</dt>
                  <dd className="text-xl font-semibold tabular-nums">{rating.count ? formatNumber(Math.round(rating.value * 10) / 10) : '—'}</dd>
                </div>
              </dl>
            </Panel>

            <Panel title={t('courier.fleet')}>
              <p className="mb-3 text-sm text-ink/65">{t('courier.fleetHint')}</p>
              <ul className="grid gap-2 text-sm">
                {couriers.map((courier) => (
                  <li key={courier.id} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className={`size-2.5 rounded-full ${courier.status === 'available' ? 'bg-leaf-600' : 'bg-ink/30'}`} />
                      {courier.name}
                    </span>
                    <span className="text-ink/65 tabular-nums">{t('courier.load', { count: courier.load })}</span>
                  </li>
                ))}
              </ul>
              {rating.count > 0 && <p className="mt-4 flex items-center gap-2 text-sm text-ink/75"><Stars value={rating.value} /> {me.name}</p>}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
};

const Courier = () => (
  <RoleGate role="courier">
    <CourierApp />
  </RoleGate>
);

export default Courier;
