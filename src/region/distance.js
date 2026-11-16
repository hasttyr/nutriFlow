// Distances in the country's measurement system (metric or imperial), formatted by Intl (CLDR),
// never concatenated by hand: "850 m", "1,2 km", "0.5 mi", "300 ft".
const FEET_PER_METER = 3.28084;
const METERS_PER_MILE = 1609.344;

export const formatDistance = (meters, profile, fallbackLocale = 'en') => {
  const locale = profile?.locale ?? fallbackLocale;
  const unit = (name, value, digits) => new Intl.NumberFormat(locale, { style: 'unit', unit: name, unitDisplay: 'short', maximumFractionDigits: digits }).format(value);
  if (profile?.measurement === 'imperial') {
    const miles = meters / METERS_PER_MILE;
    return miles < 0.1 ? unit('foot', Math.round(meters * FEET_PER_METER), 0) : unit('mile', miles, 1);
  }
  return meters < 1000 ? unit('meter', Math.round(meters), 0) : unit('kilometer', meters / 1000, 1);
};
