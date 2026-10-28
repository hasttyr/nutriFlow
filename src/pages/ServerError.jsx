import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, RotateCw } from 'lucide-react';
import { getNode } from '../distributed/cluster';
import { useCluster } from '../distributed/hooks';
import { useLocale } from '../i18n/useLocale';
import ErrorView from '../components/ErrorView';
import { glassButton, primaryButton, textLink } from '../ui/classes';

const newRequestId = () => `req_${Math.random().toString(36).slice(2, 10)}`;

// 500 view, reachable at /500 and shown by the error boundary when a screen crashes.
// Retry re-renders the failed screen when there is one, otherwise reloads the page.
const ServerError = ({ onRetry = () => window.location.reload() }) => {
  const { t, formatTime } = useLocale();
  const { activeNodeId } = useCluster();
  const node = getNode(activeNodeId);
  const [incident] = useState(() => ({ id: newRequestId(), time: Date.now() }));

  const rows = [
    [t('serverError.requestId'), incident.id],
    [t('serverError.node'), `${node.name} (${node.code})`],
    [t('serverError.time'), formatTime(incident.time)]
  ];

  return (
    <ErrorView
      code="500"
      title={t('serverError.title')}
      text={t('serverError.text')}
      details={
        <>
          <p className="mb-2 font-semibold text-ink">{t('serverError.details')}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-ink/65">{label}</dt>
                <dd className="font-mono break-all text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <Link to="/status" className={`mt-3 inline-flex min-h-11 items-center gap-1 ${textLink}`}>
            {t('home.viewStatus')}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </>
      }
      actions={
        <>
          <button type="button" onClick={onRetry} className={primaryButton}>
            <RotateCw aria-hidden="true" className="size-4" />
            {t('common.retry')}
          </button>
          <Link to="/" className={glassButton}>{t('common.goHome')}</Link>
        </>
      }
    />
  );
};

export default ServerError;
