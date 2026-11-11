import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Bike, CircleX, Clock, Store } from 'lucide-react';
import { getProductById } from '../data/products';
import { useLive } from '../live/store';
import { CANCELLABLE, TRIP_MS, cancelOrder, courierPosition, fleet, rateOrder, tripProgress } from '../live/orders';
import { METHODS } from '../payments/methods';
import { useLocale } from '../i18n/useLocale';
import { LocaleContext } from '../i18n/LocaleContext';
import { createTranslator } from '../i18n/i18n';
import { profileFor } from '../region/profiles';
import Receipt from '../components/Receipt';
import { PageTitle, Panel, StatusChip, Stars } from '../components/LiveUi';
import { Notice } from '../ui/Field';
import { fieldInput, glassButton, primaryButton, smallButton } from '../ui/classes';

const TrackingMap = lazy(() => import('../components/TrackingMap'));

// Re-renders every second while something moves on screen.
const useNow = (active) => {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
};

const RateForm = ({ order }) => {
  const { t } = useLocale();
  const [store, setStore] = useState(0);
  const [courier, setCourier] = useState(0);
  const [comment, setComment] = useState('');
  const delivery = order.fulfillment === 'delivery';
  const submit = (event) => {
    event.preventDefault();
    rateOrder(order.id, { store, courier: delivery ? courier : null, comment: comment.trim() });
  };
  return (
    <form onSubmit={submit} className="grid gap-4">
      <Stars label={t('rate.store')} value={store} onChange={setStore} />
      {delivery && <Stars label={t('rate.courier', { name: order.courierName })} value={courier} onChange={setCourier} />}
      <label className="grid gap-1.5 text-sm font-medium text-ink/80">
        {t('rate.comment')}
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} maxLength={280} className={fieldInput} />
      </label>
      <button type="submit" disabled={!store || (delivery && !courier)} className={`${primaryButton} justify-self-start disabled:opacity-50`}>{t('rate.submit')}</button>
    </form>
  );
};

const OrderTracking = () => {
  const { id } = useParams();
  const locale = useLocale();
  const { t, localize, formatDate, formatTime } = locale;
  const live = useLive();
  const order = live.orders.find((entry) => entry.id === id);
  const now = useNow(order?.status === 'onTheWay');
  const [confirming, setConfirming] = useState(false);

  if (!order) {
    return (
      <div className="px-4 py-12">
        <Panel className="container mx-auto max-w-xl text-center">
          <p className="mb-6 text-lg text-ink">{t('orders.notFound')}</p>
          <Link to="/orders" className={primaryButton}>{t('orders.title')}</Link>
        </Panel>
      </div>
    );
  }

  const courier = fleet(order.country, live).find((entry) => entry.id === order.courierId);
  const progress = tripProgress(order, now);
  const minutesLeft = Math.max(1, Math.ceil(((1 - progress) * TRIP_MS) / 60000));
  const showCourier = order.status === 'assigned' || order.status === 'onTheWay';
  const lines = order.lines.map((line) => ({ ...getProductById(line.id), ...line }));
  const payment = { method: METHODS[order.payment.id] ?? METHODS.card, card: order.payment.last4 ? { number: order.payment.last4 } : null };
  // Money and the receipt follow the order's country, whatever country the viewer has picked.
  const orderLocale = { ...createTranslator(locale.locale, profileFor(order.country)), setLocale: locale.setLocale };
  const time = (iso) => `${formatDate(Date.parse(iso))} ${formatTime(Date.parse(iso))}`;

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto max-w-5xl">
        <PageTitle title={t('order.id', { id: order.id })} subtitle={order.storeName}>
          <StatusChip status={order.status} />
        </PageTitle>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid content-start gap-6">
            {order.fulfillment === 'delivery' && order.status !== 'cancelled' && (
              <Panel>
                <Suspense fallback={<div className="h-72 rounded-2xl bg-white/50 sm:h-96" />}>
                  <TrackingMap
                    store={order.storePosition}
                    home={order.destination}
                    courier={showCourier ? courierPosition(order, courier, now) : null}
                  />
                </Suspense>
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-ink" aria-live="polite">
                  {showCourier ? (
                    <p className="flex items-center gap-2 font-medium" data-testid="courier-line">
                      <Bike aria-hidden="true" className="size-5 text-citrus-700" />
                      {t('orders.courier', { name: order.courierName })}
                    </p>
                  ) : order.status === 'ready' ? (
                    <p className="flex items-center gap-2 text-ink/75"><Clock aria-hidden="true" className="size-5" />{t('orders.waitingCourier')}</p>
                  ) : null}
                  {order.status === 'onTheWay' && <p className="text-ink/75">{t('orders.eta', { count: minutesLeft })}</p>}
                </div>
                {order.status === 'onTheWay' && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-label={t('order.status.onTheWay')} aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-citrus-500 transition-[width] duration-1000 ease-linear" style={{ width: `${progress * 100}%` }} />
                  </div>
                )}
              </Panel>
            )}

            {order.status === 'cancelled' && (
              <Panel>
                <p role="status" className="flex items-center gap-2 text-lg font-semibold text-ink">
                  <CircleX aria-hidden="true" className="size-6 text-rose-600" />
                  {t(order.reason === 'rejected' ? 'orders.rejected' : 'orders.cancelled')}
                </p>
                <p className="mt-2 text-ink/75" data-testid="refund-line">
                  {order.refund ? t('orders.refunded', { amount: orderLocale.formatPrice(order.refund.amount) }) : t('orders.notCharged')}
                </p>
              </Panel>
            )}

            {order.status === 'delivered' && (
              <Panel title={order.rating ? t('rate.thanks') : t('rate.title')}>
                {order.rating ? (
                  <div className="grid gap-2 text-ink">
                    <p className="flex items-center gap-2">{t('rate.store')} <Stars value={order.rating.store} /></p>
                    {order.rating.courier && <p className="flex items-center gap-2">{t('rate.courier', { name: order.courierName })} <Stars value={order.rating.courier} /></p>}
                    {order.rating.comment && <p className="text-ink/75">“{order.rating.comment}”</p>}
                  </div>
                ) : (
                  <RateForm order={order} />
                )}
              </Panel>
            )}

            <LocaleContext value={orderLocale}>
              <Receipt order={order} customer={order.customer} lines={lines} totals={order.totals} payment={payment} fulfillment={order.fulfillment} issuedAt={order.createdAt} />
            </LocaleContext>
          </div>

          <div className="grid content-start gap-6">
            <Panel title={t('orders.timeline')}>
              <ol className="grid gap-3">
                {order.history.map((entry) => (
                  <li key={entry.status + entry.at} className="flex items-start gap-3">
                    <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full bg-citrus-500" />
                    <span>
                      <span className="block font-medium text-ink">{t(`order.status.${entry.status}`)}</span>
                      <time dateTime={entry.at} className="text-sm text-ink/65 tabular-nums">{time(entry.at)}</time>
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel>
              <p className="mb-3 flex items-center gap-2 font-semibold text-ink"><Store aria-hidden="true" className="size-5" />{order.storeName}</p>
              <ul className="mb-4 grid gap-1 text-sm text-ink/80">
                {lines.map((line) => (
                  <li key={line.id} className="flex justify-between gap-3"><span>{line.quantity} × {localize(line.name)}</span></li>
                ))}
              </ul>
              {CANCELLABLE.includes(order.status) &&
                (confirming ? (
                  <div className="grid gap-2">
                    <p className="text-sm text-ink/80">{t('orders.cancelConfirm')}</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => cancelOrder(order.id)} className={`${smallButton} text-rose-700`}>{t('orders.cancelYes')}</button>
                      <button type="button" onClick={() => setConfirming(false)} className={smallButton}>{t('orders.keep')}</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirming(true)} className={`${glassButton} w-full text-rose-700`}>{t('orders.cancel')}</button>
                ))}
            </Panel>
            <Notice>{t('orders.liveHint')}</Notice>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
