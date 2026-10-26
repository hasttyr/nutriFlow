import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ListPlus, Plus, Search } from 'lucide-react';
import { categories } from '../data/products';
import { fetchCatalog } from '../distributed/inventory';
import { useCluster, useRemote } from '../distributed/hooks';
import { useCart } from '../cart/useCart';
import { useList } from '../list/useList';
import { useLocale } from '../i18n/useLocale';
import BranchBar from '../components/BranchBar';
import Glass from '../ui/Glass';
import ProductIcon from '../ui/ProductIcon';
import StockBadge from '../ui/StockBadge';
import { fieldInput, iconButton, pageHeading, primaryButton } from '../ui/classes';

// Case- and accent-insensitive matching ("cafe" finds "Café").
const fold = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const chipClass = (active) =>
  `min-h-11 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold whitespace-nowrap transition duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500 ${
    active ? 'bg-ink/90 text-white shadow-ink' : 'border border-white/70 bg-white/45 text-ink/80 shadow-glass-sm backdrop-blur-xl hover:bg-white/70'
  }`;

const ProductList = () => {
  const { t, localize, formatPrice } = useLocale();
  const { activeNodeId } = useCluster();
  const { addItem } = useCart();
  const list = useList();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const category = categories.includes(searchParams.get('category')) ? searchParams.get('category') : 'all';
  const catalog = useRemote(activeNodeId, () => fetchCatalog(activeNodeId));

  const offers = (catalog.value?.value ?? []).filter(({ product }) => {
    const inCategory = category === 'all' || product.category === category;
    const matches = !query.trim() || fold(`${product.name.es} ${product.name.en}`).includes(fold(query.trim()));
    return inCategory && matches;
  });

  const selectCategory = (value) => setSearchParams(value === 'all' ? {} : { category: value }, { replace: true });

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto">
        <h1 className={`${pageHeading} mb-6 sm:mb-8`}>{t('products.title')}</h1>

        <BranchBar source={catalog.value} />

        <div className="mb-6 flex flex-col gap-4">
          <div className="relative">
            <label htmlFor="product-search" className="sr-only">{t('products.search')}</label>
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink/60" />
            <input
              id="product-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('products.searchPlaceholder')}
              className={`${fieldInput} min-h-12 rounded-full pl-12`}
            />
          </div>
          <div role="group" aria-label={t('products.categories')} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {['all', ...categories].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={category === value}
                onClick={() => selectCategory(value)}
                className={chipClass(category === value)}
              >
                {t(`category.${value}`)}
              </button>
            ))}
          </div>
        </div>

        {catalog.loading && (
          <div role="status" className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            <span className="sr-only">{t('products.loading')}</span>
            {Array.from({ length: 6 }, (_, index) => (
              <Glass key={index} tone="clear" className="h-44 animate-pulse rounded-3xl motion-reduce:animate-none" />
            ))}
          </div>
        )}

        {catalog.error && (
          <Glass tone="solid" className="mx-auto max-w-xl rounded-3xl p-8 text-center">
            <p className="mb-6 text-lg text-ink/80">{t('products.error')}</p>
            <button type="button" onClick={catalog.retry} className={primaryButton}>{t('common.retry')}</button>
          </Glass>
        )}

        {catalog.value && (
          <>
            <p className="mb-4 text-sm text-ink/70" aria-live="polite">{t('products.count', { count: offers.length })}</p>
            {offers.length === 0 ? (
              <Glass tone="solid" className="rounded-3xl p-8 text-center text-ink/80">{t('products.empty', { query })}</Glass>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {offers.map(({ product, price, stock }) => {
                  const name = localize(product.name);
                  const inList = list.entries.some((entry) => entry.id === product.id && !entry.checked);
                  return (
                    <Glass as="article" key={product.id} className="flex flex-col gap-4 rounded-3xl p-4">
                      <div className="flex items-start gap-4">
                        <ProductIcon product={product} />
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg leading-tight font-semibold tracking-tight text-ink">
                            <Link
                              to={`/product/${product.id}`}
                              className="rounded-md transition hover:text-citrus-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500"
                            >
                              {name}
                            </Link>
                          </h2>
                          <p className="mt-0.5 text-sm text-ink/70">{localize(product.unit)} · {t(`category.${product.category}`)}</p>
                        </div>
                      </div>
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
                        <div className="flex flex-col items-start gap-1">
                          <p className="text-xl font-semibold text-ink tabular-nums">{formatPrice(price)}</p>
                          <StockBadge stock={stock} />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => list.addItem(product.id)}
                            aria-label={t('common.toListFor', { name })}
                            className={`${iconButton} ${inList ? 'bg-citrus-100/90 text-citrus-800' : ''}`}
                          >
                            <ListPlus aria-hidden="true" className="size-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => addItem(product.id)}
                            disabled={stock === 0}
                            aria-label={t('common.addFor', { name })}
                            className={`${primaryButton} min-h-11 px-4 py-2 text-sm`}
                          >
                            <Plus aria-hidden="true" className="size-4" />
                            {t('common.add')}
                          </button>
                        </div>
                      </div>
                    </Glass>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductList;
