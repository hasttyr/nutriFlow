import { Link, useNavigate } from 'react-router';
import { useLocale } from '../i18n/useLocale';
import AuthLayout from '../components/AuthLayout';
import { Field, Notice, PasswordField } from '../ui/Field';
import { primaryButton, textLink } from '../ui/classes';

// Demo screen: the form validates like a real one, then opens the demo profile.
const Register = () => {
  const { t } = useLocale();
  const navigate = useNavigate();

  const submit = (event) => {
    event.preventDefault();
    navigate('/profile');
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
        <Field id="name" label={t('checkout.name')} type="text" autoComplete="name" className="sm:col-span-2" required />
        <Field id="email" label={t('auth.email')} type="email" autoComplete="email" placeholder="laura.gomez@example.com" required />
        <Field
          id="phone"
          label={t('checkout.phone')}
          hint={t('checkout.phoneHint')}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          pattern="[0-9]{10}"
          placeholder="3001234567"
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
        <Notice className="sm:col-span-2">{t('auth.demo')}</Notice>
        <button type="submit" className={`${primaryButton} w-full sm:col-span-2`}>{t('register.submit')}</button>
      </form>
    </AuthLayout>
  );
};

export default Register;
