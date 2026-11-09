import { ChevronDown, Crosshair, Globe2, LoaderCircle, MapPin } from 'lucide-react';
import { COUNTRIES, currencyFor } from '../geo/currency';
import { locatePrecisely, setCountry, useRegion } from '../geo/region';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import GlassSelect from '../ui/GlassSelect';
import { smallButton } from '../ui/classes';

const countryName = (locale, code) => {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code);
  } catch {
    return code;
  }
};

// Where the shopper is (and how precisely we know it), plus the country that sets the currency.
const RegionBar = () => {
  const { t, locale } = useLocale();
  const region = useRegion();
  const { location } = region;

  const options = COUNTRIES.map((code) => ({ value: code, label: countryName(locale, code), code }))
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
    <Glass className="mb-6 flex flex-col gap-3 rounded-3xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between" data-testid="region-bar">
      <div className="flex min-w-0 items-start gap-3">
        <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-citrus-700" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">
            {location ? [location.city, location.countryCode && countryName(locale, location.countryCode)].filter(Boolean).join(', ') || t('region.unknownPlace') : t('region.locating')}
          </p>
          {location && (
            <p className="text-sm text-ink/70">
              {t(`region.source.${location.source}`)}
              {location.accuracy ? ` · ±${location.accuracy >= 1000 ? `${Math.round(location.accuracy / 1000)} km` : `${location.accuracy} m`}` : ''}
              {region.gpsError && ` · ${t(region.gpsError === 'denied' ? 'region.gpsDenied' : 'region.gpsFailed')}`}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {location?.source !== 'gps' && (
          <button type="button" onClick={locatePrecisely} disabled={region.locating} className={smallButton}>
            {region.locating ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Crosshair aria-hidden="true" className="size-4" />}
            {t('region.precise')}
          </button>
        )}
        <span id="country-label" className="sr-only">{t('region.country')}</span>
        <GlassSelect
          value={region.country}
          options={options}
          onChange={setCountry}
          labelledBy="country-label"
          align="end"
          className="relative flex min-h-11 items-center gap-2 rounded-full border border-white/80 bg-white/70 py-2 pr-9 pl-3 text-sm font-semibold text-ink shadow-glass-sm transition hover:bg-white/90"
        >
          <Globe2 aria-hidden="true" className="size-4 text-ink/70" />
          <span className="max-w-40 truncate">{countryName(locale, region.country)}</span>
          <span className="text-ink/60">· {currencyFor(region.country)}</span>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink/70" />
        </GlassSelect>
      </div>
    </Glass>
  );
};

export default RegionBar;
