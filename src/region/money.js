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
