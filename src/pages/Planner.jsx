import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bot, CalendarDays, ListPlus, LoaderCircle, ShoppingBag, Sparkles, Wand2 } from 'lucide-react';
import { getProductById } from '../data/products';
import { getNode, setActiveNode } from '../distributed/cluster';
import { useCluster } from '../distributed/hooks';
import { priceAt } from '../distributed/inventory';
import { useRegion } from '../geo/region';
import { MEALS, loadPlan, makePlan, priceBasket, savePlan } from '../planner/planner';
import { useCart } from '../cart/useCart';
import { useList } from '../list/useList';
import { useLocale } from '../i18n/useLocale';
import RegionBar from '../components/RegionBar';
import ShareDialog from '../components/ShareDialog';
import Glass from '../ui/Glass';
import ProductIcon from '../ui/ProductIcon';
import StatusDot from '../ui/StatusDot';
import { fieldInput, glassButton, pageHeading, primaryButton, sectionHeading } from '../ui/classes';

const EXAMPLES = ['planner.example1', 'planner.example2', 'planner.example3'];

// Monday-first weekday names in the interface language.
const weekdays = (locale) => {
  const format = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  return Array.from({ length: 7 }, (_, index) => format.format(new Date(2026, 10, 2 + index)));
};

const Basket = ({ plan }) => {
  const { t, localize, formatPrice } = useLocale();
  const { members, nodes } = useCluster();
  const [result, setResult] = useState(null);
  const { addItem } = useCart();
  const list = useList();
  const navigate = useNavigate();
  const nodeKey = Object.keys(nodes).join();

  useEffect(() => {
    let cancelled = false;
    priceBasket(plan.items).then((value) => !cancelled && setResult({ key: `${nodeKey}`, value }));
    return () => {
      cancelled = true;
    };
  }, [plan, members, nodeKey]);

  const quote = result?.key === nodeKey ? result.value : null;
  const best = quote?.best;
  const pricingNode = best?.nodeId;

  const buyAtBest = () => {
    setActiveNode(best.nodeId);
    plan.items.forEach((item) => addItem(item.id, item.quantity));
    navigate('/cart');
  };

  const toList = () => {
    plan.items.forEach((item) => list.addItem(item.id, item.quantity));
    navigate('/list');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Glass as="section" tone="solid" className="min-w-0 rounded-3xl p-5 sm:p-6" aria-labelledby="shopping-title">
        <h2 id="shopping-title" className={`${sectionHeading} mb-4`}>{t('planner.shopping', { count: plan.items.length })}</h2>
        <ul className="divide-y divide-white/70" data-testid="planner-items">
          {plan.items.map((item) => {
            const product = getProductById(item.id);
            const missing = best?.missing?.includes(item.id);
            return (
              <li key={item.id} className="flex items-center gap-3 py-2.5">
                <ProductIcon product={product} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{localize(product.name)}</span>
                  <span className="block text-sm text-ink/65 tabular-nums">{item.quantity} × {localize(product.unit)}</span>
                </span>
                {pricingNode && (
                  <span className={`text-sm tabular-nums ${missing ? 'text-amber-800' : 'font-medium text-ink'}`}>
                    {missing ? t('planner.notThere') : formatPrice(priceAt(pricingNode, product) * item.quantity)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Glass>

      <Glass as="section" tone="solid" className="min-w-0 rounded-3xl p-5 sm:p-6" aria-labelledby="budget-title">
        <h2 id="budget-title" className={`${sectionHeading} mb-1`}>{t('planner.budget')}</h2>
        <p className="mb-4 text-sm text-ink/70">{t('planner.budgetHint')}</p>
        {!quote ? (
          <p className="flex items-center gap-2 text-ink/70"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />{t('planner.quoting')}</p>
        ) : (
          <>
            {best && (
              <div className="mb-4 rounded-2xl bg-leaf-100/80 p-4 ring-1 ring-leaf-300/70 ring-inset" data-testid="planner-best">
                <p className="text-sm font-medium text-leaf-700">{quote.complete ? t('planner.bestStore') : t('planner.bestPartial', { count: best.missing.length })}</p>
                <p className="text-xl font-semibold text-ink">{getNode(best.nodeId).name}</p>
                <p className="text-2xl font-semibold text-ink tabular-nums">{formatPrice(best.total)}</p>
              </div>
            )}
            {quote.split.stores > 1 && (
              <p className="mb-4 rounded-2xl bg-white/55 p-3 text-sm text-ink ring-1 ring-white/80 ring-inset" data-testid="planner-split">
                {t('planner.split', { count: quote.split.stores, total: formatPrice(quote.split.total) })}
                {quote.split.missing > 0 && <span className="text-amber-800"> · {t('checkout.missing', { count: quote.split.missing })}</span>}
              </p>
            )}
            <ul className="mb-5 space-y-1.5">
              {[...quote.quotes]
                .sort((a, b) => (a.error ? 1 : 0) - (b.error ? 1 : 0) || (a.missing?.length ?? 0) - (b.missing?.length ?? 0) || (a.total ?? 0) - (b.total ?? 0))
                .map((entry) => (
                  <li key={entry.nodeId} className="flex items-center gap-3 rounded-xl bg-white/50 px-3 py-2 text-sm tabular-nums">
                    <StatusDot status={nodes[entry.nodeId]?.status ?? 'offline'} />
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink">{getNode(entry.nodeId).name}</span>
                    {entry.error ? (
                      <span className="text-rose-700">{t('detail.noResponse')}</span>
                    ) : (
                      <>
                        {entry.missing.length > 0 && <span className="text-amber-800">{t('checkout.missing', { count: entry.missing.length })}</span>}
                        <span className="font-medium text-ink">{formatPrice(entry.total)}</span>
                        <span className="text-ink/55">{entry.ms} ms</span>
                      </>
                    )}
                  </li>
                ))}
            </ul>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {best && (
                <button type="button" onClick={buyAtBest} className={primaryButton}>
                  <ShoppingBag aria-hidden="true" className="size-5" />
                  {t('planner.buyAt', { branch: getNode(best.nodeId).name })}
                </button>
              )}
              <button type="button" onClick={toList} className={glassButton}>
                <ListPlus aria-hidden="true" className="size-5" />
                {t('planner.toList')}
              </button>
              <ShareDialog items={plan.items} plan={plan} />
            </div>
          </>
        )}
      </Glass>
    </div>
  );
};

const Planner = () => {
  const { t, locale, localize } = useLocale();
  const region = useRegion();
  const [text, setText] = useState('');
  const [people, setPeople] = useState(1);
  const [plan, setPlan] = useState(loadPlan);
  const [busy, setBusy] = useState(false);
  const controller = useRef(null);
  const days = weekdays(locale);

  const generate = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    controller.current?.abort();
    controller.current = new AbortController();
    setBusy(true);
    try {
      const next = await makePlan({ text, locale, country: region.country, people, localize, signal: controller.current.signal });
      const stamped = { ...next, request: text, people };
      setPlan(stamped);
      savePlan(stamped);
    } catch {
      // Cancelled by the shopper.
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    controller.current?.abort();
    setBusy(false);
  };

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto">
        <h1 className={`${pageHeading} mb-2`}>{t('planner.title')}</h1>
        <p className="mb-6 max-w-3xl text-ink/75">{t('planner.subtitle')}</p>

        <RegionBar />

        <Glass as="form" tone="solid" onSubmit={generate} className="mb-8 rounded-3xl p-5 sm:p-6">
          <label htmlFor="planner-text" className="mb-2 block font-semibold text-ink">{t('planner.prompt')}</label>
          <textarea
            id="planner-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            maxLength={800}
            placeholder={t('planner.placeholder')}
            className={`${fieldInput} mb-3 resize-y`}
          />
          <div className="mb-4 flex flex-wrap gap-2">
            {EXAMPLES.map((key) => (
              <button key={key} type="button" onClick={() => setText(t(key))} className="min-h-9 cursor-pointer rounded-full border border-white/70 bg-white/45 px-3 text-sm text-ink/80 hover:bg-white/80">
                {t(key)}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
              {t('planner.people')}
              <select value={people} onChange={(event) => setPeople(Number(event.target.value))} className="min-h-11 rounded-full border border-white/80 bg-white/70 px-3 text-ink">
                {[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}</option>)}
              </select>
            </label>
            <div className="flex gap-2 sm:ml-auto">
              {busy && <button type="button" onClick={cancel} className={glassButton}>{t('planner.cancel')}</button>}
              <button type="submit" disabled={busy || !text.trim()} className={primaryButton}>
                {busy ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : <Wand2 aria-hidden="true" className="size-5" />}
                {busy ? t('planner.thinking') : t('planner.generate')}
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink/60">{t('planner.disclaimer')}</p>
        </Glass>

        {plan && (
          <div className="space-y-6" data-testid="planner-result">
            <Glass className="flex flex-wrap items-start gap-3 rounded-3xl p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-citrus-700">
                {plan.source === 'ai' ? <Sparkles aria-hidden="true" className="size-5" /> : <Bot aria-hidden="true" className="size-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{plan.source === 'ai' ? t('planner.byAi') : t('planner.byRules')}</p>
                {plan.aiError && <p className="text-sm text-amber-800">{t('planner.aiFallback')}</p>}
                {plan.summary && <p className="text-ink/80">{plan.summary}</p>}
                {plan.request && <p className="mt-1 text-sm text-ink/60">“{plan.request}”</p>}
              </div>
            </Glass>

            <section aria-labelledby="menu-title">
              <h2 id="menu-title" className={`${sectionHeading} mb-4 flex items-center gap-2`}>
                <CalendarDays aria-hidden="true" className="size-6 text-citrus-700" />
                {t('planner.menu')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {plan.days.map((day, index) => (
                  <Glass key={index} tone="regular" className="rounded-3xl p-4">
                    <h3 className="mb-2 font-semibold text-ink capitalize">{days[index]}</h3>
                    <dl className="space-y-1.5 text-sm">
                      {MEALS.map((meal) => (
                        <div key={meal}>
                          <dt className="text-xs font-semibold tracking-wide text-ink/55 uppercase">{t(`planner.meal.${meal}`)}</dt>
                          <dd className="text-ink">{day[meal] || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                  </Glass>
                ))}
              </div>
            </section>

            <Basket plan={plan} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Planner;
