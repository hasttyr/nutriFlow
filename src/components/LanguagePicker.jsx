import { ChevronDown, Languages } from 'lucide-react';
import { useLocale } from '../i18n/useLocale';
import { LOCALES, LOCALE_NAMES } from '../i18n/i18n';

// Five languages do not fit a segmented toggle in the header capsule. The pill shows the current
// code; a native select stretched invisibly over it does the picking, so phones get their own picker.
const LanguagePicker = () => {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="relative flex min-h-11 items-center gap-1 rounded-full bg-ink/8 px-2.5 text-xs font-semibold tracking-wide text-ink uppercase ring-1 ring-white/50 ring-inset transition duration-200 ease-out hover:bg-white/55 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-citrus-500 md:min-h-8">
      <Languages aria-hidden="true" className="size-4 text-ink/70" strokeWidth={1.9} />
      <span aria-hidden="true">{locale}</span>
      <ChevronDown aria-hidden="true" className="size-3.5 text-ink/60" />
      <select
        aria-label={t('language.label')}
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code} lang={code}>
            {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguagePicker;
