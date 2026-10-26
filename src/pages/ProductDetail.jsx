import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Flame, Minus, Plus, ShoppingBag } from 'lucide-react';
import { getProductById } from '../data/products';
import { useCart } from '../cart/useCart';
import { MAX_QUANTITY, MIN_QUANTITY } from '../cart/cart';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import { glassButton, iconButton, pageHeading, primaryButton } from '../ui/classes';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
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

  const handleAddToCart = () => {
    addItem(product.id, quantity);
    navigate('/cart');
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= MIN_QUANTITY && newQuantity <= MAX_QUANTITY) {
      setQuantity(newQuantity);
    }
  };

  const name = localize(product.name);
  const totalCalories = product.calories * quantity;

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <Glass tone="clear" className="self-start rounded-[2rem] p-3">
          <img
            src={product.image}
            alt={name}
            width="300"
            height="200"
            className="aspect-[3/2] w-full rounded-[1.5rem] object-cover"
          />
        </Glass>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className={`${pageHeading} mb-2`}>{name}</h1>
            <p className="text-lg text-ink/75">{localize(product.description)}</p>
          </div>

          <Glass className="rounded-3xl p-5">
            <p className="text-3xl font-semibold tracking-tight text-ink tabular-nums">{formatPrice(product.price)}</p>
            <p className="text-ink/75">{t('detail.perServing', { count: product.calories })}</p>
          </Glass>

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

          <Glass tone="clear" className="rounded-3xl bg-citrus-100/45 p-5">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
              <Flame aria-hidden="true" className="size-5 text-citrus-700" />
              {t('detail.calorieInfo')}
            </h2>
            <p className="text-ink/80">{t('detail.eachServing', { count: product.calories })}</p>
            <p className="text-ink/80">
              {t('detail.totalFor', { count: quantity })}{' '}
              <span className="font-semibold text-citrus-800 tabular-nums">{t('common.calories', { count: totalCalories })}</span>
            </p>
            <p className="mt-2 text-sm text-ink/65 italic">{t('detail.note')}</p>
          </Glass>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={handleAddToCart} className={`${primaryButton} flex-1`}>
              <ShoppingBag aria-hidden="true" className="size-5" />
              {t('detail.addToCart')}
            </button>
            <Link to="/products" className={`${glassButton} flex-1`}>
              {t('common.backToProducts')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
