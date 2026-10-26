import { Link } from 'react-router';
import { ArrowRight, ChartColumn, Flame, ShoppingBag, ShoppingCart, TrendingUp } from 'lucide-react';
import { featuredProducts } from '../data/products';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import { calorieChip, glassButton, primaryButton, sectionHeading } from '../ui/classes';

const features = [
  { id: 'feature1', Icon: ChartColumn },
  { id: 'feature2', Icon: TrendingUp },
  { id: 'feature3', Icon: ShoppingCart }
];

const HomePage = () => {
  const { t, localize } = useLocale();

  return (
    <div className="px-4 pb-20">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-28">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-[2.625rem] leading-[1.05] font-semibold tracking-tight text-balance text-ink sm:text-6xl sm:leading-tight">
            {t('home.titleLead')}{' '}
            <span className="text-citrus-700">{t('home.titleAccent')}</span>
          </h1>
          <p className="mx-auto mt-5 mb-8 max-w-2xl text-lg text-pretty text-ink/75 sm:mt-6 sm:mb-10 sm:text-xl">
            {t('home.subtitle')}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link to="/products" className={`${primaryButton} px-8 text-lg`}>
              <ShoppingBag aria-hidden="true" className="size-5" />
              {t('home.shopNow')}
            </Link>
            <Link to="/cart" className={`${glassButton} px-8 text-lg`}>
              {t('home.viewCart')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <div className="container mx-auto">
          <h2 className={`${sectionHeading} mb-6 text-center text-3xl sm:mb-10`}>{t('home.whyTitle')}</h2>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {features.map(({ id, Icon }) => (
              <Glass key={id} tone="clear" className="rounded-3xl p-6">
                <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/70 text-citrus-700 shadow-glass-sm">
                  <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
                </span>
                <h3 className="mb-2 text-xl font-semibold tracking-tight text-ink">{t(`home.${id}.title`)}</h3>
                <p className="text-ink/75">{t(`home.${id}.text`)}</p>
              </Glass>
            ))}
          </div>
        </div>
      </section>

      {/* Products Preview */}
      <section className="py-12">
        <div className="container mx-auto">
          <h2 className={`${sectionHeading} mb-6 text-center text-3xl sm:mb-10`}>{t('home.featured')}</h2>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {featuredProducts.map((product) => (
              <Glass key={product.id} className="flex flex-col rounded-3xl p-3">
                <img
                  src={product.image}
                  alt=""
                  width="300"
                  height="200"
                  className="aspect-[3/2] w-full rounded-2xl object-cover"
                />
                <div className="flex flex-1 flex-col gap-4 p-3 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-semibold tracking-tight text-ink">{localize(product.name)}</h3>
                    <span className={calorieChip}>
                      <Flame aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
                      {t('common.calories', { count: product.calories })}
                    </span>
                  </div>
                  <Link
                    to={`/product/${product.id}`}
                    className="mt-auto inline-flex min-h-11 items-center gap-1.5 self-start rounded-full font-semibold text-citrus-800 transition hover:gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500"
                    aria-label={t('common.viewDetailsFor', { name: localize(product.name) })}
                  >
                    {t('common.viewDetails')}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </Glass>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
