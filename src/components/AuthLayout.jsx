import { ListChecks, MapPin, RotateCcw } from 'lucide-react';
import { NODES } from '../distributed/cluster';
import { useCluster } from '../distributed/hooks';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import StatusDot from '../ui/StatusDot';
import { sectionHeading } from '../ui/classes';

const perks = [
  { icon: ListChecks, key: 'auth.perk1' },
  { icon: RotateCcw, key: 'auth.perk2' },
  { icon: MapPin, key: 'auth.perk3' }
];

// Login and register: the form first (on phones too), with what an account brings beside it.
const AuthLayout = ({ title, subtitle, footer, children }) => {
  const { t } = useLocale();
  const { nodes } = useCluster();

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Glass tone="solid" className="rounded-3xl p-6 sm:p-8 lg:order-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">{title}</h1>
          <p className="mt-2 text-pretty text-ink/75">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-ink/75">{footer}</p>
        </Glass>

        <Glass className="flex flex-col rounded-3xl p-6 sm:p-8 lg:order-1">
          <h2 className={sectionHeading}>{t('auth.perksTitle')}</h2>
          <ul className="mt-6 space-y-4">
            {perks.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-citrus-700 shadow-glass-sm">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="text-pretty text-ink/85">{t(key)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/55 px-4 py-3 text-sm text-ink/75 ring-1 ring-white/80 ring-inset lg:mt-auto">
            <span className="flex shrink-0 gap-1.5">
              {NODES.map((node) => <StatusDot key={node.id} status={nodes[node.id].status} />)}
            </span>
            {t('auth.replicated', { total: NODES.length })}
          </div>
        </Glass>
      </div>
    </div>
  );
};

export default AuthLayout;
