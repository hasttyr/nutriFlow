import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, ListPlus, LoaderCircle, Minus, Plus, ShoppingBag } from 'lucide-react';
import { getProductById } from '../data/products';
import { NODES, setActiveNode } from '../distributed/cluster';
import { fetchOffers, priceAt, stockAt } from '../distributed/inventory';
import { useCluster } from '../distributed/hooks';
import { useCart } from '../cart/useCart';
import { useList } from '../list/useList';
import { MAX_QUANTITY, MIN_QUANTITY } from '../cart/cart';
import { useLocale } from '../i18n/useLocale';
import BranchBar from '../components/BranchBar';
import Glass from '../ui/Glass';
import ProductIcon from '../ui/ProductIcon';
import StatusDot from '../ui/StatusDot';
import StockBadge from '../ui/StockBadge';
import { glassButton, iconButton, pageHeading, primaryButton, sectionHeading } from '../ui/classes';

// Every branch is asked for its own offer; rows fill in as each node answers.
const BranchComparison = ({ product }) => {
  const { t, formatPrice } = useLocale();
  const { activeNodeId, nodes } = useCluster();
  const [offers, setOffers] = useState({});

  useEffect(() => {
    let cancelled = false;
    fetchOffers(product, (nodeId, offer) => {
      if (!cancelled) setOffers((current) => ({ ...current, [nodeId]: offer }));
    });
    return () => {
      cancelled = true;
    };
  }, [product]);

  const prices = Object.values(offers).filter((offer) => !offer.error && offer.stock > 0).map((offer) => offer.price);
  const best = prices.length ? Math.min(...prices) : null;

  return (
    <Glass as="section" tone="solid" className="rounded-3xl p-5 sm:p-6 md:col-span-2" aria-labelledby="compare-title">
      <h2 id="compare-title" className={sectionHeading}>{t('detail.compareTitle')}</h2>
      <p className="mb-4 text-sm text-ink/70">{t('detail.compareHint')}</p>
      <ul className="space-y-2" data-testid="branch-offers">
        {NODES.map((node) => {
          const offer = offers[node.id];
          const isActive = node.id === activeNodeId;
          return (
            <li key={node.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white/55 px-4 py-3 ring-1 ring-white/80 ring-inset">
              <div className="flex min-w-36 flex-1 items-center gap-3">
                <StatusDot status={nodes[node.id].status} />
                <div>
                  <p className="font-semibold text-ink">{node.name}</p>
                  <p className="text-xs text-ink/65">{t(`branch.status.${nodes[node.id].status}`)}</p>
                </div>
              </div>
              {!offer && (
                <p className="flex items-center gap-2 text-sm text-ink/70">
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
                  {t('detail.waiting')}
                </p>
              )}
              {offer?.error && <p className="text-sm font-medium text-rose-700">{t('detail.noResponse')}</p>}
              {offer && !offer.error && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-ink tabular-nums">{formatPrice(offer.price)}</span>
                    {offer.price === best && (
                      <span className="rounded-full bg-leaf-100/90 px-2 py-0.5 text-xs font-semibold text-leaf-700 ring-1 ring-leaf-300/70 ring-inset">
                        {t('detail.bestPrice')}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-ink/75 tabular-nums">
                    {offer.stock > 0 ? t('detail.units', { count: offer.stock }) : t('stock.out')}
                  </span>
                  <span className="text-sm text-ink/60 tabular-nums">{offer.ms} ms</span>
                </>
              )}
              <div className="ml-auto">
                {isActive ? (
                  <span className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-citrus-800">{t('detail.current')}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveNode(node.id)}
                    aria-label={t('detail.useBranchFor', { branch: node.name })}
                    className={`${glassButton} min-h-11 px-4 py-2 text-sm`}
                  >
                    {t('detail.useBranch')}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Glass>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const list = useList();
  const { activeNodeId } = useCluster();
  const { t, localize, formatPrice } = useLocale();
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  const product = getProductById(Number(id));

  if (!product) {
    return (
      <div className="px-4 py-10 sm:py-16">
        <Glass tone="solid" className="container mx-auto max-w-xl rounded-3xl p-8 text-center">
          <h1 className="mb-4 text-3xl font-semibold tracking-tight text-ink">{t('detail.notFoundTitle')}</h1>
          <p className="mb-6 text-ink/75">{t('detail.notFoundText')}</p>
          <Link to="/products" className={primaryButton}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t('common.backToProducts')}
          </Link>
        </Glass>
      </div>
    );
  }

  const name = localize(product.name);
  const stock = stockAt(activeNodeId, product.id);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= MIN_QUANTITY && newQuantity <= MAX_QUANTITY) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    addItem(product.id, quantity);
    navigate('/cart');
  };

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto max-w-5xl">
        <BranchBar />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <Glass tone="clear" className="flex items-center justify-center rounded-[2rem] p-10 sm:p-14">
            <ProductIcon product={product} size="xl" />
          </Glass>

          <div className="flex flex-col gap-5">
            <div>
              <h1 className={`${pageHeading} mb-1`}>{name}</h1>
              <p className="text-ink/70">{localize(product.unit)} · {t(`category.${product.category}`)}</p>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-3xl font-semibold tracking-tight text-ink tabular-nums">{formatPrice(priceAt(activeNodeId, product))}</p>
              <StockBadge stock={stock} />
            </div>

            <div>
              <span id="quantity-label" className="mb-2 block font-semibold text-ink">{t('detail.quantity')}</span>
              <div role="group" aria-labelledby="quantity-label" className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= MIN_QUANTITY}
                  aria-label={t('detail.decrease')}
                  className={iconButton}
                >
                  <Minus aria-hidden="true" className="size-4" />
                </button>
                <span aria-live="polite" data-testid="quantity" className="min-w-8 text-center text-xl font-semibold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= MAX_QUANTITY}
                  aria-label={t('detail.increase')}
                  className={iconButton}
                >
                  <Plus aria-hidden="true" className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={handleAddToCart} disabled={stock === 0} className={`${primaryButton} flex-1`}>
                <ShoppingBag aria-hidden="true" className="size-5" />
                {t('common.add')}
              </button>
              <button
                type="button"
                onClick={() => list.addItem(product.id, quantity)}
                aria-label={t('common.toListFor', { name })}
                className={`${glassButton} flex-1`}
              >
                <ListPlus aria-hidden="true" className="size-5" />
                {t('common.toList')}
              </button>
            </div>
          </div>

          <BranchComparison key={product.id} product={product} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
