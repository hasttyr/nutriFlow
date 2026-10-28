import { Link, NavLink } from 'react-router';
import { House, Leaf, ListChecks, ShoppingBag, Store } from 'lucide-react';
import { useCart } from '../cart/useCart';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import ClusterBadge from './ClusterBadge';
import LanguagePicker from './LanguagePicker';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500';

// One nav for every size: a floating glass tab bar within thumb reach on phones,
// inline links inside the header capsule from md up.
const navClass = [
  'flex items-center gap-1',
  'max-md:fixed max-md:inset-x-3 max-md:bottom-[max(0.75rem,env(safe-area-inset-bottom))] max-md:z-50 max-md:gap-0 max-md:p-1.5',
  'max-md:rounded-full max-md:border max-md:border-white/60 max-md:bg-white/45 max-md:shadow-glass-raised max-md:backdrop-blur-2xl max-md:backdrop-saturate-[1.8]'
].join(' ');

const tabClass = ({ isActive }) =>
  [
    `relative flex items-center rounded-full font-medium transition duration-200 ease-out ${focusRing}`,
    'max-md:min-h-13 max-md:flex-1 max-md:flex-col max-md:justify-center max-md:gap-0.5 max-md:text-xs',
    'md:gap-1.5 md:px-3 md:py-1.5 md:text-sm',
    isActive ? 'bg-white/85 text-ink shadow-glass-sm' : 'text-ink/75 hover:bg-white/45 hover:text-ink'
  ].join(' ');

const Header = () => {
  const { itemCount } = useCart();
  const { t } = useLocale();

  return (
    <header className="sticky top-[max(0.75rem,env(safe-area-inset-top))] z-50 px-3 sm:px-4">
      <div className="relative container mx-auto flex items-center justify-between gap-2 py-2 pr-2 pl-3 sm:pr-3 sm:pl-5">
        <Glass aria-hidden="true" className="absolute inset-0 -z-10 rounded-full" />
        <Link to="/" className={`flex min-h-11 items-center gap-2 rounded-full text-lg font-semibold tracking-tight text-ink ${focusRing}`}>
          <span className="flex size-8 items-center justify-center rounded-full bg-citrus-500 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.45)]">
            <Leaf aria-hidden="true" className="size-4.5" strokeWidth={2.25} />
          </span>
          nutriFlow
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <nav aria-label={t('nav.label')} className={navClass}>
            <NavLink to="/" end className={tabClass}>
              <House aria-hidden="true" className="size-5 md:hidden" strokeWidth={1.9} />
              {t('nav.home')}
            </NavLink>
            <NavLink to="/products" className={tabClass}>
              <Store aria-hidden="true" className="size-5 md:hidden" strokeWidth={1.9} />
              {t('nav.products')}
            </NavLink>
            <NavLink to="/list" className={tabClass}>
              <ListChecks aria-hidden="true" className="size-5 md:hidden" strokeWidth={1.9} />
              {t('nav.list')}
            </NavLink>
            <NavLink to="/cart" className={tabClass} aria-label={t('nav.cartLabel', { count: itemCount })}>
              <ShoppingBag aria-hidden="true" className="size-5 md:size-4" strokeWidth={1.9} />
              {t('nav.cart')}
              {itemCount > 0 && (
                // Phones: rides on the icon's top-right. From md up: an inline pill after the label.
                <span
                  aria-hidden="true"
                  data-testid="cart-count"
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-citrus-500 px-1 text-xs font-bold text-white tabular-nums shadow-[0_4px_10px_-3px_rgb(216_90_6/0.7)] ring-2 ring-white/85 max-md:absolute max-md:top-0.5 max-md:left-1/2 max-md:ml-1"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </NavLink>
          </nav>
          <ClusterBadge />
          <LanguagePicker />
        </div>
      </div>
    </header>
  );
};

export default Header;
