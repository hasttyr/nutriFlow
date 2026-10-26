import { Link } from 'react-router';
import { ArrowRight, ListChecks, ShoppingBag, Store, Truck } from 'lucide-react';
import products, { categories } from '../data/products';
import { NODES } from '../distributed/cluster';
import { useCluster } from '../distributed/hooks';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import ProductIcon from '../ui/ProductIcon';
import StatusDot from '../ui/StatusDot';
import { glassButton, primaryButton, sectionHeading } from '../ui/classes';

const features = [
  { id: 'feature1', Icon: ListChecks },
  { id: 'feature2', Icon: Store },
  { id: 'feature3', Icon: Truck }
];

const HomePage = () => {
  const { t } = useLocale();
  const cluster = useCluster();

  return (
    <div className="px-4 pb-20">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-24">
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
              {t('home.start')}
            </Link>
            <Link to="/list" className={`${glassButton} px-8 text-lg`}>
              <ListChecks aria-hidden="true" className="size-5" />
              {t('home.buildList')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto grid gap-4 sm:gap-6 md:grid-cols-3">
          {features.map(({ id, Icon }) => (
            <Glass key={id} tone="clear" className="rounded-3xl p-6">
              <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/70 text-citrus-700 shadow-glass-sm">
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
              </span>
              <h2 className="mb-2 text-xl font-semibold tracking-tight text-ink">{t(`home.${id}.title`)}</h2>
              <p className="text-ink/75">{t(`home.${id}.text`)}</p>
            </Glass>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto">
          <h2 className={`${sectionHeading} mb-6 text-center text-3xl sm:mb-10`}>{t('home.categories')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {categories.map((category) => {
              const sample = products.find((product) => product.category === category);
              return (
                <Link
                  key={category}
                  to={`/products?category=${category}`}
                  className="group rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500"
                >
                  <Glass tone="clear" className="flex h-full flex-col items-center gap-3 rounded-3xl p-5 text-center transition duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-glass-raised motion-reduce:group-hover:translate-y-0">
                    <ProductIcon product={sample} />
                    <span className="font-semibold text-ink">{t(`category.${category}`)}</span>
                  </Glass>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Branch network */}
      <section className="py-8 sm:py-12">
        <Glass className="container mx-auto flex flex-col gap-6 rounded-3xl p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className={`${sectionHeading} mb-2`}>{t('home.network')}</h2>
            <p className="text-ink/75">{t('home.networkText')}</p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-3 lg:min-w-[28rem]">
            {NODES.map((node) => {
              const state = cluster.nodes[node.id];
              return (
                <li key={node.id} className="flex items-center gap-3 rounded-2xl bg-white/55 px-4 py-3 ring-1 ring-white/80 ring-inset">
                  <StatusDot status={state.status} />
                  <div>
                    <p className="font-semibold text-ink">{node.name}</p>
                    <p className="text-sm text-ink/70 tabular-nums">
                      {t(`branch.status.${state.status}`)} · {state.latency} ms
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link to="/status" className={`${glassButton} shrink-0`}>
            {t('home.viewStatus')}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Glass>
      </section>
    </div>
  );
};

export default HomePage;
