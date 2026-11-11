import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import CountryPicker from '../components/CountryPicker';
import { RolePicker } from '../components/LiveUi';
import { HOME, signIn } from '../live/session';
import { LOCALE_NAMES } from '../i18n/i18n';
import { useLocale } from '../i18n/useLocale';
import AuthLayout from '../components/AuthLayout';
import { Field, Notice, PasswordField } from '../ui/Field';
import { primaryButton, textLink } from '../ui/classes';

// Demo sign-up: validates like a real form, records the role and the regional profile (country,
// hence language, currency and time zone) and asks consent under that country's data law.
const Register = () => {
  const { t, profile } = useLocale();
  const navigate = useNavigate();
  const [role, setRole] = useState('customer');

  const submit = (event) => {
    event.preventDefault();
    signIn({ role, name: new FormData(event.currentTarget).get('name') });
    navigate(HOME[role]);
  };

  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footer={
        <>
          {t('register.hasAccount')} <Link to="/login" className={textLink}>{t('register.toLogin')}</Link>
        </>
      }
    >
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <RolePicker value={role} onChange={setRole} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
          <span id="register-country" className="text-sm font-medium text-ink/80">{t('auth.country')}</span>
          <CountryPicker labelledBy="register-country" />
          <p className="w-full text-sm text-ink/65" data-testid="register-profile">
            {t('auth.profileSummary', { language: LOCALE_NAMES[profile.language], currency: profile.currency, zone: profile.timeZone })}
          </p>
        </div>
        <Field id="name" label={t('checkout.name')} type="text" autoComplete="name" className="sm:col-span-2" required />
        <Field id="email" label={t('auth.email')} type="email" autoComplete="email" placeholder="laura.gomez@example.com" required />
        <Field
          id="phone"
          label={t('checkout.phone')}
          hint={t('checkout.phoneHint', { example: profile.phone.example })}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          pattern={profile.phone.pattern}
          placeholder={profile.phone.example}
          required
        />
        <PasswordField
          id="password"
          label={t('auth.password')}
          hint={t('register.passwordHint')}
          toggleLabel={t('auth.showPassword')}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <PasswordField
          id="confirm-password"
          label={t('register.confirmPassword')}
          toggleLabel={t('auth.showPassword')}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink/80 sm:col-span-2">
          <input type="checkbox" name="terms" required className="size-5 shrink-0 cursor-pointer accent-citrus-600" />
          {t('register.terms')}
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink/80 sm:col-span-2">
          <input type="checkbox" name="consent" required className="size-5 shrink-0 cursor-pointer accent-citrus-600" />
          {t('auth.consent', { law: profile.dataProtection.law })}
        </label>
        <Notice className="sm:col-span-2">{t('auth.demo')}</Notice>
        <button type="submit" className={`${primaryButton} w-full sm:col-span-2`}>{t('register.submit')}</button>
      </form>
    </AuthLayout>
  );
};

export default Register;
