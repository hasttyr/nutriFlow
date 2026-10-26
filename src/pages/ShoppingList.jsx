import { Link, useNavigate } from 'react-router';
import { ListChecks, ShoppingCart, Trash2 } from 'lucide-react';
import { getProductById } from '../data/products';
import { getNode } from '../distributed/cluster';
import { priceAt } from '../distributed/inventory';
import { useCluster } from '../distributed/hooks';
import { useCart } from '../cart/useCart';
import { useList } from '../list/useList';
import { useLocale } from '../i18n/useLocale';
import BranchBar from '../components/BranchBar';
import Glass from '../ui/Glass';
import ProductIcon from '../ui/ProductIcon';
import { glassButton, pageHeading, primaryButton } from '../ui/classes';

const ShoppingList = () => {
  const { t, localize, formatPrice } = useLocale();
  const { activeNodeId } = useCluster();
  const { addItem } = useCart();
  const list = useList();
  const navigate = useNavigate();

  const done = list.entries.length - list.pending.length;
  const estimate = list.pending.reduce((total, entry) => total + priceAt(activeNodeId, getProductById(entry.id)) * entry.quantity, 0);

  const moveToCart = () => {
    list.pending.forEach((entry) => addItem(entry.id, entry.quantity));
    list.checkItems(list.pending.map((entry) => entry.id));
    navigate('/cart');
  };

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto max-w-3xl">
        <h1 className={`${pageHeading} mb-2`}>{t('list.title')}</h1>
        {list.entries.length > 0 && (
          <p className="mb-6 text-ink/70 tabular-nums" data-testid="list-progress">{t('list.progress', { done, total: list.entries.length })}</p>
        )}

        {list.entries.length === 0 ? (
          <Glass tone="solid" className="mt-6 rounded-3xl p-10 text-center">
            <ListChecks aria-hidden="true" className="mx-auto mb-4 size-10 text-ink/50" strokeWidth={1.5} />
            <p className="mb-1 text-lg font-semibold text-ink">{t('list.empty')}</p>
            <p className="mb-6 text-ink/70">{t('list.emptyHint')}</p>
            <Link to="/products" className={primaryButton}>{t('list.addProducts')}</Link>
          </Glass>
        ) : (
          <>
            <BranchBar />
            <Glass as="ul" tone="solid" className="divide-y divide-white/70 overflow-hidden rounded-3xl">
              {list.entries.map((entry) => {
                const product = getProductById(entry.id);
                const name = localize(product.name);
                return (
                  <li key={entry.id} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
                    <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 sm:gap-4">
                      <input
                        type="checkbox"
                        checked={entry.checked}
                        onChange={() => list.toggleItem(entry.id)}
                        aria-label={t('list.haveIt', { name })}
                        className="size-6 shrink-0 cursor-pointer accent-citrus-600"
                      />
                      <ProductIcon product={product} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className={`block font-semibold ${entry.checked ? 'text-ink/50 line-through' : 'text-ink'}`}>{name}</span>
                        <span className="block text-sm text-ink/65 tabular-nums">
                          {entry.quantity} × {localize(product.unit)} · {formatPrice(priceAt(activeNodeId, product))}
                        </span>
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => list.removeItem(entry.id)}
                      aria-label={t('list.removeFor', { name })}
                      className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-rose-700 transition hover:bg-rose-50/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500"
                    >
                      <Trash2 aria-hidden="true" className="size-5" />
                    </button>
                  </li>
                );
              })}
            </Glass>

            <Glass className="mt-6 flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-ink/70">{t('list.estimate', { branch: getNode(activeNodeId).name })}</p>
                <p className="text-2xl font-semibold text-ink tabular-nums" data-testid="list-estimate">{formatPrice(estimate)}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {done > 0 && (
                  <button type="button" onClick={list.clearChecked} className={glassButton}>{t('list.clearChecked')}</button>
                )}
                <button type="button" onClick={moveToCart} disabled={list.pending.length === 0} className={primaryButton}>
                  <ShoppingCart aria-hidden="true" className="size-5" />
                  {t('list.moveToCart', { count: list.pending.length })}
                </button>
              </div>
            </Glass>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;
