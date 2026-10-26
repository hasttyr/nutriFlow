const tints = {
  produce: 'bg-leaf-100/90 text-leaf-700 ring-leaf-300/60',
  dairy: 'bg-sky-100/90 text-sky-700 ring-sky-300/60',
  bakery: 'bg-amber-100/90 text-amber-800 ring-amber-300/60',
  pantry: 'bg-citrus-100/90 text-citrus-800 ring-citrus-300/60',
  drinks: 'bg-rose-100/90 text-rose-700 ring-rose-300/60'
};

const sizes = {
  sm: ['size-11 rounded-xl', 'size-5'],
  md: ['size-14 rounded-2xl', 'size-7'],
  xl: ['size-32 rounded-[2rem] sm:size-40', 'size-16 sm:size-20']
};

// Category-tinted glass tile carrying the product's line icon.
const ProductIcon = ({ product, size = 'md' }) => {
  const Icon = product.icon;
  const [box, glyph] = sizes[size];
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center shadow-glass-sm ring-1 ring-inset ${tints[product.category]} ${box}`}>
      <Icon className={glyph} strokeWidth={1.6} />
    </span>
  );
};

export default ProductIcon;
