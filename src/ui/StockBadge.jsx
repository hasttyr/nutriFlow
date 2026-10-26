import { LOW_STOCK_THRESHOLD } from '../distributed/inventory';
import { useLocale } from '../i18n/useLocale';

const StockBadge = ({ stock }) => {
  const { t } = useLocale();
  const [tone, label] =
    stock === 0
      ? ['bg-rose-100/85 text-rose-800 ring-rose-300/70', t('stock.out')]
      : stock <= LOW_STOCK_THRESHOLD
        ? ['bg-amber-100/85 text-amber-900 ring-amber-300/70', t('stock.low', { count: stock })]
        : ['bg-leaf-100/85 text-leaf-700 ring-leaf-300/70', t('stock.available')];

  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${tone}`}>
      {label}
    </span>
  );
};

export default StockBadge;
