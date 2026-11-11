import { useEffect, useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronDown } from 'lucide-react';
import { onlineCount, NODES } from '../distributed/cluster';
import { useCluster } from '../distributed/hooks';
import { useLive, updateLive } from '../live/store';
import { REMOTE, call } from '../live/remote';
import { ACTIVE, averageRating, fleet, setAutopilot } from '../live/orders';
import { useLocale } from '../i18n/useLocale';
import { createTranslator } from '../i18n/i18n';
import { COUNTRIES, PROFILES, countryName, profileFor } from '../region/profiles';
import { loadRates, REFERENCE_RATES, toUsd } from '../region/exchange';
import { PageTitle, Panel, RoleGate } from '../components/LiveUi';
import { useNoteText } from '../live/useNoteText';
import GlassSelect from '../ui/GlassSelect';
import { fieldInput, fieldLabel, primaryButton, smallButton, textLink } from '../ui/classes';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const selectTrigger = 'relative flex min-h-11 w-full items-center gap-2 rounded-2xl border border-white/80 bg-white/60 py-2.5 pr-10 pl-4 text-ink shadow-[inset_0_1px_3px_rgb(19_32_26/0.1)] transition hover:bg-white/75';

const Kpi = ({ label, value }) => (
  <div className="rounded-3xl border border-white/70 bg-white/60 p-5 shadow-glass-sm backdrop-blur-xl">
    <dt className="text-sm text-ink/65">{label}</dt>
    <dd className="mt-1 text-3xl font-semibold tracking-tight text-ink tabular-nums">{value}</dd>
  </div>
);

// Sales per country in local money and, with dated rates, consolidated in US dollars.
const Operation = ({ rates }) => {
  const { t, locale, formatNumber } = useLocale();
  const live = useLive();
  const rows = COUNTRIES.map((country) => {
    const profile = profileFor(country);
    const orders = live.orders.filter((order) => order.country === country);
    const sold = orders.filter((order) => order.status !== 'cancelled');
    const gmv = sold.reduce((sum, order) => sum + order.totals.total, 0);
    const commission = sold.reduce((sum, order) => sum + Math.round((order.totals.subtotal * profile.revenue.commission) / profile.tax.rateScale + order.totals.delivery), 0);
    const rating = averageRating(orders, 'store', () => true);
    return { country, profile, count: orders.length, active: orders.filter((order) => ACTIVE.includes(order.status)).length, gmv, gmvUsd: toUsd(gmv, profile, rates), revenueUsd: toUsd(commission, profile, rates), rating };
  });
  const total = (field) => rows.reduce((sum, row) => sum + row[field], 0);

  return (
    <div className="grid grid-cols-1 gap-6">
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={t('admin.kpi.orders')} value={formatNumber(total('count'))} />
        <Kpi label={t('admin.kpi.active')} value={formatNumber(total('active'))} />
        <Kpi label={t('admin.kpi.gmv')} value={usd.format(total('gmvUsd'))} />
        <Kpi label={t('admin.kpi.revenue')} value={usd.format(total('revenueUsd'))} />
      </dl>
      <Panel title={t('admin.byCountry')}>
        <div className="-mx-2 overflow-x-auto px-2">
          <table className="w-full min-w-[40rem] text-left text-sm tabular-nums" data-testid="admin-table">
            <thead className="text-ink/65">
              <tr>
                {['country', 'orders', 'active', 'gmv', 'usd', 'revenue', 'rating'].map((column) => (
                  <th key={column} scope="col" className="pb-2 font-medium">{t(`admin.col.${column}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {rows.map((row) => (
                <tr key={row.country}>
                  <th scope="row" className="py-2 font-medium text-ink">{countryName(locale, row.country)} <span className="text-ink/55">{row.profile.currency}</span></th>
                  <td>{formatNumber(row.count)}</td>
                  <td>{formatNumber(row.active)}</td>
                  <td>{createTranslator(locale, row.profile).formatPrice(row.gmv)}</td>
                  <td>{usd.format(row.gmvUsd)}</td>
                  <td>{usd.format(row.revenueUsd)}</td>
                  <td>{row.rating.count ? formatNumber(Math.round(row.rating.value * 10) / 10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-ink/65" data-testid="fx-source">{t('admin.fx', { source: rates.source, date: rates.date })}</p>
        <p className="mt-1 text-sm text-ink/65">{t('admin.revenueHint')}</p>
      </Panel>
    </div>
  );
};

// Edits a country's rates, fees, tip and commission. Saved overrides apply at once in every tab;
// the profile file stays as the default.
const ProfileEditor = () => {
  const { t, locale } = useLocale();
  const live = useLive();
  const labelId = useId();
  const [country, setCountry] = useState('CO');
  const [saved, setSaved] = useState(false);
  const profile = profileFor(country);
  const base = PROFILES[country];
  const percent = (value) => (value * 100) / profile.tax.rateScale;
  const major = (minor) => minor / 10 ** profile.minorUnits;

  const save = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rate = (name) => Math.round((Number(form.get(name)) * profile.tax.rateScale) / 100);
    const minor = (name) => Math.round(Number(form.get(name)) * 10 ** profile.minorUnits);
    const override = {
      tax: { rates: { standard: rate('standard'), reduced: rate('reduced'), prepared: rate('prepared') } },
      delivery: { fee: minor('fee'), freeFrom: minor('freeFrom') },
      tip: { mode: form.get('tipMode'), defaultPercent: Number(form.get('tipDefault')) },
      revenue: { commission: rate('commission') }
    };
    // Live mode: the country's region stores it and every app hears it; local mode: this browser.
    const done = REMOTE
      ? call(country, '/overrides', { method: 'PUT', body: override, role: 'admin' })
      : updateLive((state) => ({ overrides: { ...state.overrides, [country]: override } }));
    done.then(() => setSaved(true));
  };
  const reset = () => {
    if (REMOTE) {
      call(country, '/overrides', { method: 'DELETE', role: 'admin' }).then(() => setSaved(false));
      return;
    }
    updateLive((state) => {
      const { [country]: removed, ...rest } = state.overrides;
      return removed ? { overrides: rest } : {};
    });
    setSaved(false);
  };
  const number = (name, label, value, step) => (
    <label className="grid gap-1.5">
      <span className={fieldLabel}>{label}</span>
      <input name={name} type="number" min="0" step={step} defaultValue={value} required className={fieldInput} />
    </label>
  );
  const moneyStep = 1 / 10 ** profile.minorUnits;

  return (
    <Panel title={t('admin.tab.profiles')}>
      <div className="mb-5 max-w-xs">
        <p id={labelId} className={fieldLabel}>{t('admin.profile.country')}</p>
        <GlassSelect
          value={country}
          options={COUNTRIES.map((code) => ({ value: code, label: `${countryName(locale, code)} · ${PROFILES[code].currency}` }))}
          onChange={(value) => {
            setCountry(value);
            setSaved(false);
          }}
          labelledBy={labelId}
          className={selectTrigger}
        >
          {countryName(locale, country)} · {profile.currency}
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink/70" />
        </GlassSelect>
      </div>
      {/* Keyed by country and override, so the fields show the values in force. */}
      <form key={`${country}-${JSON.stringify(live.overrides[country] ?? null)}`} onSubmit={save} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={t('admin.tab.profiles')}>
        {number('standard', `${t('admin.profile.standard')} · ${profile.tax.name}`, percent(profile.tax.rates.standard), 0.001)}
        {number('reduced', t('admin.profile.reduced'), percent(profile.tax.rates.reduced), 0.001)}
        {number('prepared', t('admin.profile.prepared'), percent(profile.tax.rates.prepared), 0.001)}
        {number('fee', `${t('admin.profile.fee')} (${profile.currency})`, major(profile.delivery.fee), moneyStep)}
        {number('freeFrom', `${t('admin.profile.freeFrom')} (${profile.currency})`, major(profile.delivery.freeFrom), moneyStep)}
        {number('commission', t('admin.profile.commission'), percent(profile.revenue.commission), 0.001)}
        <label className="grid gap-1.5">
          <span className={fieldLabel}>{t('admin.profile.tipMode')}</span>
          <select name="tipMode" defaultValue={profile.tip.mode} className={fieldInput}>
            {['suggested', 'optional', 'none'].map((mode) => <option key={mode} value={mode}>{t(`admin.tip.${mode}`)}</option>)}
          </select>
        </label>
        {number('tipDefault', t('admin.profile.tipDefault'), profile.tip.defaultPercent, 1)}
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
          <button type="submit" className={primaryButton}>{t('admin.profile.save')}</button>
          {profile !== base && <button type="button" onClick={reset} className={smallButton}>{t('admin.profile.reset')}</button>}
        </div>
      </form>
      <p className="mt-4 text-sm text-ink/65" role="status">{saved ? t('admin.profile.saved') : t('admin.profile.hint')}</p>
    </Panel>
  );
};

const Monitor = () => {
  const { t, formatNumber } = useLocale();
  const cluster = useCluster();
  const live = useLive();
  const noteText = useNoteText();
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Panel title={t('admin.monitor.system')}>
        <p className="mb-2 text-ink">{t('admin.monitor.nodes', { online: onlineCount(cluster), total: NODES.length })}</p>
        <ul className="mb-4 grid gap-1 text-sm text-ink/80">
          {COUNTRIES.map((country) => {
            const couriers = fleet(country, live);
            return (
              <li key={country}>
                {t('admin.monitor.couriers', { country, available: formatNumber(couriers.filter((courier) => courier.status === 'available').length), total: couriers.length, busy: formatNumber(couriers.filter((courier) => courier.load > 0).length) })}
              </li>
            );
          })}
        </ul>
        {Object.keys(live.health).length > 0 && (
          <ul className="mb-4 grid gap-1 text-sm" data-testid="services">
            {Object.entries(live.health).sort().map(([name, health]) => (
              <li key={name} className="flex items-center gap-2">
                <span aria-hidden="true" className={`size-2.5 rounded-full ${health.status === 'online' ? 'bg-leaf-600' : 'bg-rose-600'}`} />
                <span className="font-mono">{name}</span>
                <span className="text-ink/60">{t(`admin.monitor.${health.status === 'online' ? 'online' : 'offline'}`)}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/status" className={textLink}>{t('admin.monitor.open')}</Link>
      </Panel>
      <Panel title={t('admin.monitor.events')}>
        {live.notifications.length === 0 ? (
          <p className="text-sm text-ink/65">{t('notify.empty')}</p>
        ) : (
          <ul className="grid gap-2 text-sm">
            {live.notifications.slice(0, 12).map((note) => {
              const { text, when } = noteText(note);
              return (
                <li key={note.id}>
                  <span className="text-ink">{text}</span> <span className="text-ink/55">· {t(`role.${note.to.role}`)} · {when}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
};

const AdminConsole = () => {
  const { t } = useLocale();
  const live = useLive();
  const [params] = useSearchParams();
  const tab = params.get('tab') ?? 'operation';
  const [rates, setRates] = useState(REFERENCE_RATES);
  useEffect(() => {
    let active = true;
    loadRates().then((next) => active && setRates(next));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto">
        <PageTitle title={t('admin.title')} subtitle={t('admin.subtitle')}>
          <label className="flex min-h-11 max-w-sm cursor-pointer items-center gap-3 rounded-2xl bg-white/60 px-4 py-2 text-sm text-ink ring-1 ring-white/80">
            <input type="checkbox" role="switch" checked={live.autopilot} onChange={(event) => setAutopilot(event.target.checked)} className="size-5 accent-citrus-600" />
            <span>
              <span className="block font-semibold">{t('admin.autopilot')}</span>
              <span className="text-ink/65">{t('admin.autopilotHint')}</span>
            </span>
          </label>
        </PageTitle>
        {tab === 'operation' && <Operation rates={rates} />}
        {tab === 'profiles' && <ProfileEditor />}
        {tab === 'monitor' && <Monitor />}
      </div>
    </div>
  );
};

const Admin = () => (
  <RoleGate role="admin">
    <AdminConsole />
  </RoleGate>
);

export default Admin;
