import { ChevronDown, Globe2 } from 'lucide-react';
import { COUNTRIES, countryName, currencyFor } from '../geo/currency';
import { setCountry, useRegion } from '../geo/region';
import { useLocale } from '../i18n/useLocale';
import GlassSelect from '../ui/GlassSelect';

// The country that sets the currency and the payment methods. Language is a separate choice.
const CountryPicker = ({ labelledBy, align = 'end' }) => {
  const { locale } = useLocale();
  const { country } = useRegion();

  const options = COUNTRIES.map((code) => ({ value: code, label: countryName(locale, code) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale))
    .map(({ value, label }) => ({
      value,
      label,
      content: (
        <span className="flex items-center justify-between gap-6">
          {label}
          <span aria-hidden="true" className="text-xs font-semibold text-ink/55">{currencyFor(value)}</span>
        </span>
      )
    }));

  return (
    <GlassSelect
      value={country}
      options={options}
      onChange={setCountry}
      labelledBy={labelledBy}
      align={align}
      className="relative flex min-h-11 items-center gap-2 rounded-full border border-white/80 bg-white/70 py-2 pr-9 pl-3 text-sm font-semibold text-ink shadow-glass-sm transition hover:bg-white/90"
    >
      <Globe2 aria-hidden="true" className="size-4 text-ink/70" />
      <span className="max-w-40 truncate">{countryName(locale, country)}</span>
      <span className="text-ink/60">· {currencyFor(country)}</span>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink/70" />
    </GlassSelect>
  );
};

export default CountryPicker;
