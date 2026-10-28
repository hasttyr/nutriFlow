import { Link, useNavigate } from 'react-router';
import { useLocale } from '../i18n/useLocale';
import AuthLayout from '../components/AuthLayout';
import { Field, Notice, PasswordField } from '../ui/Field';
import { primaryButton, textLink } from '../ui/classes';

// Demo screen: any email and password "log in" and open the demo profile.
const Login = () => {
  const { t } = useLocale();
  const navigate = useNavigate();

  const submit = (event) => {
    event.preventDefault();
    navigate('/profile');
  };

  return (
    <AuthLayout
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <>
          {t('login.noAccount')} <Link to="/register" className={textLink}>{t('login.toRegister')}</Link>
        </>
      }
    >
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <Field id="email" label={t('auth.email')} type="email" autoComplete="email" placeholder="laura.gomez@example.com" required />
        <PasswordField id="password" label={t('auth.password')} toggleLabel={t('auth.showPassword')} autoComplete="current-password" required />
        <div className="flex flex-wrap items-center justify-between gap-x-4 text-sm">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-ink/80">
            <input type="checkbox" name="remember" defaultChecked className="size-5 cursor-pointer accent-citrus-600" />
            {t('auth.remember')}
          </label>
          <button type="button" className={`min-h-11 cursor-pointer ${textLink}`}>{t('auth.forgot')}</button>
        </div>
        <Notice>{t('auth.demo')}</Notice>
        <button type="submit" className={`${primaryButton} w-full`}>{t('login.submit')}</button>
      </form>
    </AuthLayout>
  );
};

export default Login;
