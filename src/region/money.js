// Money is always an integer in the minor unit of the profile's currency (centavos, cents, yen…),
// never a float. Currencies quoted without decimals (COP, JPY) have minorUnits 0, so their minor
// unit is the whole peso or yen. Only formatting divides, at the very edge, to hand Intl a number.

// Local price endings: Colombian prices end in 00, Brazilian/US/French in 9, Japanese in 8.
export const roundPrice = (amount, { step, offset }) => Math.max(step, Math.round(amount / step) * step) + offset;

export const toMajor = (minor, profile) => minor / 10 ** profile.minorUnits;

// "R$ 25,90", "$25.90", "25,90 €", "$ 25.900", "￥2,590": symbol, separators and decimals come from
// CLDR through Intl for the profile's locale.
export const moneyFormatter = (profile) => {
  const format = new Intl.NumberFormat(profile.locale, {
    style: 'currency',
    currency: profile.currency,
    minimumFractionDigits: profile.minorUnits,
    maximumFractionDigits: profile.minorUnits
  });
  return (minor) => format.format(toMajor(minor, profile));
};

export const deliveryFee = (subtotal, fulfillment, profile) =>
  fulfillment === 'delivery' && subtotal < profile.delivery.freeFrom ? profile.delivery.fee : 0;

const lineTotal = (line) => line.price * line.quantity;

// The order's money, all from the profile: subtotal, delivery, taxes per rate, tip and total.
// Ready meals pay the prepared-food rate, groceries the reduced one. Included taxes (VAT style)
// are shown but not added; excluded ones (US sales tax) are added. Each tax rounds once.
// shortcut: the delivery fee is not taxed; tax it here if a country's rules require it.
export const quote = (lines, { fulfillment, tipPercent }, profile) => {
  const { tax, tip } = profile;
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const bases = {};
  for (const line of lines) {
    const category = line.category === 'meals' ? 'prepared' : 'reduced';
    bases[category] = (bases[category] ?? 0) + lineTotal(line);
  }
  const taxes = Object.entries(bases)
    .filter(([category]) => tax.rates[category] > 0)
    .map(([category, base]) => {
      const rate = tax.rates[category];
      const amount = Math.round(tax.includedInPrice ? (base * rate) / (tax.rateScale + rate) : (base * rate) / tax.rateScale);
      return { name: (category === 'prepared' && tax.preparedName) || tax.name, rate: rate / tax.rateScale, amount };
    });
  const tipAmount = tip.mode === 'none' ? 0 : Math.round((subtotal * (tipPercent ?? tip.defaultPercent)) / 100);
  const delivery = deliveryFee(subtotal, fulfillment, profile);
  const added = tax.includedInPrice ? 0 : taxes.reduce((sum, entry) => sum + entry.amount, 0);
  return { subtotal, delivery, taxes, taxIncluded: tax.includedInPrice, tip: tipAmount, total: subtotal + delivery + added + tipAmount };
};
