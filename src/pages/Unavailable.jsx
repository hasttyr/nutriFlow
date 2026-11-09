import { ChevronDown, Globe2, MapPinOff } from 'lucide-react';
import { COUNTRIES, countryName } from '../geo/currency';
import { setCountry } from '../geo/region';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import GlassSelect from '../ui/GlassSelect';
import { fieldLabel } from '../ui/classes';

// Shown instead of the whole app when the shopper is in a country nutriFlow does not serve.
const Unavailable = ({ country }) => {
  const { t, locale } = useLocale();
  const place = countryName(locale, country);
  const supported = COUNTRIES.map((code) => ({ value: code, label: countryName(locale, code) })).sort((a, b) => a.label.localeCompare(b.label, locale));

  return (
    <main className="px-4 py-12 sm:py-20">
      <Glass tone="solid" className="container mx-auto max-w-2xl rounded-3xl p-6 sm:p-10" role="alert">
        <MapPinOff aria-hidden="true" className="mb-4 size-11 text-rose-600" strokeWidth={1.6} />
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">{t('unavailable.title', { country: place })}</h1>
        <p className="mb-4 text-ink/75">{t('unavailable.text', { country: place })}</p>
        <ul className="mb-8 flex flex-wrap gap-2" aria-label={t('region.country')}>
          {supported.map(({ value, label }) => (
            <li key={value} className="rounded-full bg-white/70 px-3 py-1 text-sm text-ink/80 ring-1 ring-white/80">{label}</li>
          ))}
        </ul>
        <p id="simulate-country" className={fieldLabel}>{t('unavailable.simulate')}</p>
        <GlassSelect
          value={null}
          options={supported}
          onChange={setCountry}
          labelledBy="simulate-country"
          className="relative flex min-h-11 max-w-xs items-center gap-2 rounded-2xl border border-white/80 bg-white/60 py-2.5 pr-10 pl-4 text-ink shadow-[inset_0_1px_3px_rgb(19_32_26/0.1)] transition hover:bg-white/75 aria-expanded:bg-white/85"
        >
          <Globe2 aria-hidden="true" className="size-4 text-ink/70" />
          {t('unavailable.pick')}
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink/70 transition-transform duration-200 in-aria-expanded:rotate-180" />
        </GlassSelect>
      </Glass>
    </main>
  );
};

export default Unavailable;
