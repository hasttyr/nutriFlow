import { Link } from 'react-router';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import { primaryButton } from '../ui/classes';

const NotFound = () => {
  const { t } = useLocale();

  return (
    <div className="px-4 py-10 sm:py-16">
      <Glass tone="solid" className="container mx-auto max-w-xl rounded-3xl p-8 text-center">
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-ink">{t('notFound.title')}</h1>
        <p className="mb-6 text-ink/75">{t('notFound.text')}</p>
        <Link to="/" className={primaryButton}>
          {t('notFound.home')}
        </Link>
      </Glass>
    </div>
  );
};

export default NotFound;
