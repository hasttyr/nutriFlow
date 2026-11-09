import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Download, LoaderCircle } from 'lucide-react';
import { getProductById } from '../data/products';
import { decodeShare } from '../share/share';
import { savePlan } from '../planner/planner';
import { useList } from '../list/useList';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import ProductIcon from '../ui/ProductIcon';
import { glassButton, pageHeading, primaryButton, sectionHeading } from '../ui/classes';

// Opens a list/plan shared from another device (the data travels in the URL fragment).
const SharedImport = () => {
  const { t, localize } = useLocale();
  const { hash } = useLocation();
  const list = useList();
  const navigate = useNavigate();
  const [result, setResult] = useState({ hash: null });

  useEffect(() => {
    let cancelled = false;
    const code = hash.slice(1);
    decodeShare(code).then(
      (value) => !cancelled && setResult({ hash, value }),
      () => !cancelled && setResult({ hash, error: true })
    );
    return () => {
      cancelled = true;
    };
  }, [hash]);

  const current = result.hash === hash ? result : {};

  const importAll = () => {
    current.value.items.forEach((item) => list.addItem(item.id, item.quantity));
    if (current.value.plan) {
      savePlan({ ...current.value.plan, source: current.value.plan.source ?? 'rules' });
      navigate('/planner');
    } else {
      navigate('/list');
    }
  };

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto max-w-3xl">
        <h1 className={`${pageHeading} mb-6`}>{t('share.importTitle')}</h1>
        {!current.value && !current.error && (
          <p className="flex items-center gap-2 text-ink/70"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" />{t('share.preparing')}</p>
        )}
        {current.error && (
          <Glass tone="solid" className="rounded-3xl p-6">
            <p className="mb-4 text-rose-700">{t('share.invalid')}</p>
            <Link to="/" className={glassButton}>{t('common.goHome')}</Link>
          </Glass>
        )}
        {current.value && (
          <Glass tone="solid" className="rounded-3xl p-5 sm:p-6">
            <h2 className={`${sectionHeading} mb-1`}>{t('share.received', { count: current.value.items.length })}</h2>
            {current.value.plan && <p className="mb-3 text-sm text-ink/70">{t('share.withPlan')}</p>}
            <ul className="mb-5 divide-y divide-white/70">
              {current.value.items.map((item) => {
                const product = getProductById(item.id);
                return (
                  <li key={item.id} className="flex items-center gap-3 py-2">
                    <ProductIcon product={product} size="sm" />
                    <span className="flex-1 font-semibold text-ink">{localize(product.name)}</span>
                    <span className="text-sm text-ink/70 tabular-nums">{item.quantity} × {localize(product.unit)}</span>
                  </li>
                );
              })}
            </ul>
            <button type="button" onClick={importAll} className={primaryButton}>
              <Download aria-hidden="true" className="size-5" />
              {t('share.import')}
            </button>
          </Glass>
        )}
      </div>
    </div>
  );
};

export default SharedImport;
