import { Link, useLocation } from 'react-router';
import { Network } from 'lucide-react';
import { NODES } from '../distributed/cluster';
import { useLocale } from '../i18n/useLocale';
import ErrorView from '../components/ErrorView';
import { glassButton, primaryButton } from '../ui/classes';

const NotFound = () => {
  const { t } = useLocale();
  const { pathname } = useLocation();

  return (
    <ErrorView
      code="404"
      title={t('notFound.title')}
      text={t('notFound.text')}
      details={
        <>
          <p className="text-ink/65">{t('notFound.requested')}</p>
          <p className="font-mono font-semibold break-all text-ink" data-testid="requested-path">{pathname}</p>
          <p className="mt-3 flex items-start gap-2 text-ink/75">
            <Network aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-citrus-700" />
            {t('notFound.hint', { total: NODES.length })}
          </p>
        </>
      }
      actions={
        <>
          <Link to="/" className={primaryButton}>{t('common.goHome')}</Link>
          <Link to="/products" className={glassButton}>{t('notFound.products')}</Link>
        </>
      }
    />
  );
};

export default NotFound;
