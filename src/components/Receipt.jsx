import { useLocale } from '../i18n/useLocale';
import { formatAddress, formatName } from '../region/address';
import { methodName } from '../payments/methods';
import { getNode } from '../distributed/cluster';

// The country's sales document (factura electrónica, NFC-e, receipt, facture, 適格請求書): its
// name, seller ID and tax lines come from the RegionProfile. The issue time is stored in UTC and
// shown in the country's time zone.
const Row = ({ label, value, muted = false, strong = false }) => (
  <div className={`flex justify-between gap-4 ${strong ? 'border-t border-ink/15 pt-2 text-base font-semibold' : ''}`}>
    <dt className={muted ? 'text-ink/60' : 'text-ink/75'}>{label}</dt>
    <dd className={muted ? 'text-ink/60' : 'font-medium'}>{value}</dd>
  </div>
);

const Receipt = ({ order, customer, lines, totals, payment, fulfillment, issuedAt }) => {
  const { t, localize, formatPrice, formatPercent, formatDate, formatTime, profile } = useLocale();
  const taxLabel = (entry) => `${entry.name} ${formatPercent(entry.rate)}`;

  return (
    <section aria-labelledby="receipt-title" data-testid="receipt" className="mb-6 rounded-2xl bg-white p-5 font-mono text-sm text-ink shadow-sm ring-1 ring-ink/10">
      <h2 id="receipt-title" className="text-center font-sans text-lg font-semibold">{profile.receipt.type}</h2>
      <p className="mb-4 text-center text-xs text-ink/60">nutriFlow · {profile.receipt.merchantId} · {profile.receipt.authority}</p>
      <dl className="mb-4 space-y-1">
        <Row label={t('receipt.number')} value={order.id} />
        <Row label={t('receipt.issued')} value={<time dateTime={issuedAt} data-testid="receipt-issued">{`${formatDate(Date.parse(issuedAt))} ${formatTime(Date.parse(issuedAt))} (${profile.timeZone})`}</time>} />
        <Row label={t('receipt.customer')} value={formatName(customer, profile)} />
        <Row label={fulfillment === 'delivery' ? t('receipt.deliverTo') : t('receipt.pickup')} value={fulfillment === 'delivery' ? formatAddress(customer, profile) : getNode(order.nodeId).name} />
      </dl>
      <ul className="mb-4 space-y-1 border-y border-dashed border-ink/25 py-3">
        {lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-4">
            <span>{line.quantity} × {localize(line.name)}</span>
            <span>{formatPrice(line.price * line.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-1">
        <Row label={t('summary.subtotal')} value={formatPrice(totals.subtotal)} />
        {totals.delivery > 0 && <Row label={t('summary.delivery')} value={formatPrice(totals.delivery)} />}
        {totals.taxes.map((entry) => (
          <Row
            key={entry.name + entry.rate}
            label={totals.taxIncluded ? t('summary.taxIncluded', { tax: taxLabel(entry) }) : taxLabel(entry)}
            value={formatPrice(entry.amount)}
            muted={totals.taxIncluded}
          />
        ))}
        {totals.tip > 0 && <Row label={t('summary.tip')} value={formatPrice(totals.tip)} />}
        <Row label={t('summary.total')} value={<span data-testid="receipt-total">{formatPrice(totals.total)}</span>} strong />
        <Row label={t('receipt.payment')} value={payment.card ? t('payment.cardLabel', { last4: payment.card.number.slice(-4) }) : methodName(payment.method, t)} />
      </dl>
      <p className="mt-4 font-sans text-xs text-ink/60">
        {t('receipt.dataLaw', { law: profile.dataProtection.law, region: profile.dataProtection.residency })} {t('receipt.demo')}
      </p>
    </section>
  );
};

export default Receipt;
