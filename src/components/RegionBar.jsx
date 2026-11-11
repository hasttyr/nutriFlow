import { Crosshair, LoaderCircle, MapPin } from 'lucide-react';
import { locatePrecisely, useRegion } from '../geo/region';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import { countryName } from '../region/profiles';
import CountryPicker from './CountryPicker';
import { smallButton } from '../ui/classes';

// Where the shopper is (and how precisely we know it), plus the country that sets the currency.
const RegionBar = () => {
  const { t, locale } = useLocale();
  const region = useRegion();
  const { location } = region;

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
        <CountryPicker labelledBy="country-label" />
      </div>
    </Glass>
  );
};

export default RegionBar;
