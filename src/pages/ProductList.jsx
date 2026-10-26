import { Link } from 'react-router';
import { Flame } from 'lucide-react';
import products from '../data/products';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import { calorieChip, pageHeading, primaryButton } from '../ui/classes';

const ProductList = () => {
  const { t, localize, formatPrice } = useLocale();

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto">
        <h1 className={`${pageHeading} mb-8 text-center sm:mb-12`}>{t('products.title')}</h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {products.map((product) => (
            <Glass
              key={product.id}
              className="group flex flex-col rounded-3xl p-3 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-glass-raised motion-reduce:hover:translate-y-0"
            >
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={product.image}
                  alt={localize(product.name)}
                  width="300"
                  height="200"
                  loading="lazy"
                  className="aspect-[3/2] w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                />
              </div>
              <div className="flex flex-1 flex-col p-3 pt-4">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <h2 className="text-xl font-semibold tracking-tight text-ink">{localize(product.name)}</h2>
                  <span className="text-lg font-semibold whitespace-nowrap text-ink tabular-nums">{formatPrice(product.price)}</span>
                </div>
                <p className="mb-5 text-ink/75">{localize(product.description)}</p>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <span className={calorieChip}>
                    <Flame aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
                    {t('common.calories', { count: product.calories })}
                  </span>
                  <Link
                    to={`/product/${product.id}`}
                    className={`${primaryButton} min-h-11 px-4 py-2 text-sm`}
                    aria-label={t('common.viewDetailsFor', { name: localize(product.name) })}
                  >
                    {t('common.viewDetails')}
                  </Link>
                </div>
              </div>
            </Glass>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
