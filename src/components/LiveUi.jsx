import { useId } from 'react';
import { LogIn, Star } from 'lucide-react';
import { useLocale } from '../i18n/useLocale';
import { signIn, useSession } from '../live/session';
import Glass from '../ui/Glass';
import { pageHeading, primaryButton, sectionHeading } from '../ui/classes';

// Small pieces shared by the customer, store, courier and admin screens.

export const Panel = ({ title, action, children, className = '' }) => {
  const id = useId();
  return (
    <Glass as="section" tone="solid" aria-labelledby={title ? id : undefined} className={`rounded-3xl p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 id={id} className={sectionHeading}>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </Glass>
  );
};

export const PageTitle = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
    <div>
      <h1 className={pageHeading}>{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-ink/70">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const chip = {
  placed: 'bg-sky-100 text-sky-800 ring-sky-300',
  accepted: 'bg-violet-100 text-violet-800 ring-violet-300',
  ready: 'bg-amber-100 text-amber-900 ring-amber-300',
  assigned: 'bg-citrus-100 text-citrus-800 ring-citrus-300',
  onTheWay: 'bg-citrus-200 text-citrus-800 ring-citrus-400',
  delivered: 'bg-leaf-100 text-leaf-700 ring-leaf-300',
  cancelled: 'bg-rose-100 text-rose-700 ring-rose-200'
};

export const StatusChip = ({ status }) => {
  const { t } = useLocale();
  return (
    <span data-testid="order-status" className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${chip[status]}`}>
      {t(`order.status.${status}`)}
    </span>
  );
};

// Read-only stars, or a 1–5 radio group when `onChange` is given.
export const Stars = ({ value, onChange, label }) => {
  const { t } = useLocale();
  const name = useId();
  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={t('rate.stars', { count: Math.round(value) })}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} aria-hidden="true" className="size-4" fill={star <= Math.round(value) ? 'currentColor' : 'none'} />
        ))}
      </span>
    );
  }
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink/80">{label}</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} className="cursor-pointer rounded-full p-1 text-amber-500 has-focus-visible:outline-2 has-focus-visible:outline-citrus-600">
            <input type="radio" name={name} value={star} checked={value === star} onChange={() => onChange(star)} className="sr-only" aria-label={t('rate.stars', { count: star })} />
            <Star aria-hidden="true" className="size-8" fill={star <= value ? 'currentColor' : 'none'} />
          </label>
        ))}
      </div>
    </fieldset>
  );
};

// Consoles are for one role. In the demo, entering as that role is one tap.
export const RoleGate = ({ role, children }) => {
  const { t } = useLocale();
  const session = useSession();
  if (session.role === role) return children;
  const roleName = t(`role.${role}`);
  return (
    <div className="px-4 py-12 sm:py-20">
      <Glass tone="solid" className="container mx-auto max-w-xl rounded-3xl p-6 text-center sm:p-10">
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-ink">{t('gate.title', { role: roleName })}</h1>
        <p className="mb-6 text-ink/75">{t('gate.text', { role: roleName })}</p>
        <button type="button" onClick={() => signIn({ role, name: roleName })} className={primaryButton}>
          <LogIn aria-hidden="true" className="size-5" />
          {t('gate.enter', { role: roleName })}
        </button>
      </Glass>
    </div>
  );
};

// The four actors of the platform as a radio group (sign-in and sign-up).
export const RolePicker = ({ value, onChange }) => {
  const { t } = useLocale();
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink/80">{t('auth.role')}</legend>
      <div className="grid grid-cols-2 gap-2">
        {['customer', 'merchant', 'courier', 'admin'].map((role) => (
          <label key={role} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl bg-white/50 px-3 py-2 text-sm font-medium text-ink ring-1 ring-white/80 ring-inset has-checked:bg-white/90 has-checked:ring-2 has-checked:ring-citrus-500">
            <input type="radio" name="role" value={role} checked={value === role} onChange={() => onChange(role)} className="size-4 accent-citrus-600" />
            {t(`role.${role}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );
};
