import { useId } from 'react';
import { Link } from 'react-router';
import { Briefcase, ChevronDown, House, LogOut, Pencil, Plus, RotateCcw } from 'lucide-react';
import profile from '../data/profile';
import { NODES, getNode, onlineCount, setActiveNode } from '../distributed/cluster';
import { useCluster } from '../distributed/hooks';
import { LOCALES, LOCALE_NAMES } from '../i18n/i18n';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import GlassSelect from '../ui/GlassSelect';
import StatusDot from '../ui/StatusDot';
import { Notice } from '../ui/Field';
import { fieldLabel, glassButton, pageHeading, sectionHeading, smallButton } from '../ui/classes';

const statusChip = {
  delivered: 'bg-leaf-100 text-leaf-700 ring-leaf-300',
  pickedUp: 'bg-citrus-100 text-citrus-800 ring-citrus-200',
  cancelled: 'bg-rose-100 text-rose-700 ring-rose-200'
};

const addressIcon = { home: House, work: Briefcase };

const inset = 'rounded-2xl bg-white/55 ring-1 ring-white/80 ring-inset';

const selectTrigger = 'relative flex min-h-11 w-full items-center rounded-2xl border border-white/80 bg-white/60 py-2.5 pr-10 pl-4 text-ink shadow-[inset_0_1px_3px_rgb(19_32_26/0.1)] transition hover:bg-white/75 aria-expanded:bg-white/85';

const initials = (name) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');

const Section = ({ title, action, children }) => {
  const id = useId();
  return (
    <Glass as="section" tone="solid" aria-labelledby={id} className="rounded-3xl p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={id} className={sectionHeading}>{title}</h2>
        {action}
      </div>
      {children}
    </Glass>
  );
};

// Uncontrolled: the demo only has to look and feel like a setting.
const Switch = ({ label, defaultChecked }) => (
  <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 text-ink/85">
    {label}
    <input type="checkbox" role="switch" defaultChecked={defaultChecked} className="peer sr-only" />
    <span
      aria-hidden="true"
      className="relative h-7 w-12 shrink-0 rounded-full bg-ink/15 shadow-[inset_0_1px_3px_rgb(19_32_26/0.2)] transition-colors duration-200 peer-checked:bg-leaf-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-citrus-500 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow-glass-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-5 motion-reduce:after:transition-none"
    />
  </label>
);

const Profile = () => {
  const { t, locale, setLocale, formatDate, formatPrice } = useLocale();
  const cluster = useCluster();
  const languageLabel = useId();
  const branchLabel = useId();
  const online = onlineCount(cluster);

  const languageOptions = LOCALES.map((code) => ({ value: code, label: LOCALE_NAMES[code], lang: code }));
  const branchOptions = NODES.map((node) => ({ value: node.id, label: node.name }));

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto">
        <h1 className={`${pageHeading} mb-6 sm:mb-8`}>{t('profile.title')}</h1>

        <div className="grid items-start gap-6 lg:grid-cols-[20rem_1fr]">
          <Glass tone="solid" className="rounded-3xl p-6 text-center lg:sticky lg:top-28">
            <span
              aria-hidden="true"
              className="mx-auto flex size-20 items-center justify-center rounded-full bg-citrus-500 text-2xl font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_10px_24px_-10px_rgb(216_90_6/0.8)]"
            >
              {initials(profile.name)}
            </span>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink">{profile.name}</h2>
            <p className="text-sm break-all text-ink/70">{profile.email}</p>
            <p className="mt-1 text-sm text-ink/65">{t('profile.memberSince', { date: formatDate(profile.memberSince) })}</p>

            <dl className="mt-6 grid grid-cols-2 gap-2 text-left">
              <div className={`${inset} px-3 py-3`}>
                <dt className="text-xs text-ink/65">{t('profile.stats.orders')}</dt>
                <dd className="text-lg font-semibold text-ink tabular-nums">{profile.stats.orders}</dd>
              </div>
              <div className={`${inset} px-3 py-3`}>
                <dt className="text-xs text-ink/65">{t('profile.stats.saved')}</dt>
                <dd className="text-lg font-semibold text-ink tabular-nums">{formatPrice(profile.stats.saved)}</dd>
              </div>
            </dl>

            <Link to="/login" className={`${glassButton} mt-6 w-full`}>
              <LogOut aria-hidden="true" className="size-4" />
              {t('profile.logout')}
            </Link>
          </Glass>

          <div className="grid gap-6">
            <Section
              title={t('profile.personal')}
              action={
                <button type="button" className={smallButton}>
                  <Pencil aria-hidden="true" className="size-4" />
                  {t('profile.edit')}
                </button>
              }
            >
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  [t('checkout.name'), profile.name],
                  [t('auth.email'), profile.email],
                  [t('checkout.phone'), profile.phone],
                  [t('language.label'), LOCALE_NAMES[locale]]
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sm text-ink/65">{label}</dt>
                    <dd className="font-medium break-all text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </Section>

            <Section title={t('profile.orders')}>
              <ul className="grid gap-3">
                {profile.orders.map((order) => (
                  <li key={order.id} className={`${inset} flex flex-wrap items-center gap-x-4 gap-y-3 p-4`}>
                    <div className="min-w-0 flex-1 basis-52">
                      <p className="font-mono text-sm font-semibold text-ink">{order.id}</p>
                      <p className="text-sm text-ink/70">
                        {formatDate(order.date)} · {getNode(order.nodeId).name} · {t('products.count', { count: order.items })}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusChip[order.status]}`}>
                      {t(`profile.status.${order.status}`)}
                    </span>
                    <span className="font-semibold text-ink tabular-nums">{formatPrice(order.total)}</span>
                    <Link to="/products" aria-label={t('profile.reorderFor', { id: order.id })} className={smallButton}>
                      <RotateCcw aria-hidden="true" className="size-4" />
                      {t('profile.reorder')}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={t('profile.addresses')}>
              <ul className="grid gap-3 sm:grid-cols-2">
                {profile.addresses.map((address) => {
                  const Icon = addressIcon[address.id];
                  return (
                    <li key={address.id} className={`${inset} flex gap-3 p-4`}>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-citrus-700 shadow-glass-sm">
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                          {t(`profile.address.${address.id}`)}
                          {address.isDefault && (
                            <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-xs font-semibold text-leaf-700 ring-1 ring-leaf-300 ring-inset">
                              {t('profile.default')}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-ink/75">{address.line}</p>
                        <p className="text-sm text-ink/65">{address.neighborhood}</p>
                      </div>
                    </li>
                  );
                })}
                <li>
                  <button
                    type="button"
                    className="flex size-full min-h-24 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 font-semibold text-ink/70 transition hover:border-citrus-500/60 hover:bg-white/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500"
                  >
                    <Plus aria-hidden="true" className="size-5" />
                    {t('profile.addAddress')}
                  </button>
                </li>
              </ul>
            </Section>

            <Section title={t('profile.preferences')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p id={languageLabel} className={fieldLabel}>{t('language.label')}</p>
                  <GlassSelect value={locale} options={languageOptions} onChange={setLocale} labelledBy={languageLabel} className={selectTrigger}>
                    {LOCALE_NAMES[locale]}
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink/70 transition-transform duration-200 in-aria-expanded:rotate-180" />
                  </GlassSelect>
                </div>
                <div>
                  <p id={branchLabel} className={fieldLabel}>{t('profile.preferredBranch')}</p>
                  <GlassSelect value={cluster.activeNodeId} options={branchOptions} onChange={setActiveNode} labelledBy={branchLabel} className={selectTrigger}>
                    {getNode(cluster.activeNodeId).name}
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink/70 transition-transform duration-200 in-aria-expanded:rotate-180" />
                  </GlassSelect>
                </div>
              </div>
              <div className="mt-4 divide-y divide-ink/8">
                <Switch label={t('profile.notifyOrders')} defaultChecked />
                <Switch label={t('profile.notifyOffers')} />
              </div>
            </Section>

            <Section title={t('profile.session')}>
              <p className="text-pretty text-ink/80">{t('profile.sessionText', { online, total: NODES.length })}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {NODES.map((node) => (
                  <li key={node.id} className="flex items-center gap-2 rounded-full bg-white/55 px-3 py-1.5 text-sm font-medium text-ink ring-1 ring-white/80 ring-inset">
                    <StatusDot status={cluster.nodes[node.id].status} />
                    {node.name}
                    <span className="font-mono text-xs text-ink/60">{node.code}</span>
                  </li>
                ))}
              </ul>
              <Notice className="mt-5">{t('profile.demo')}</Notice>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
