import { ChevronDown, Languages } from 'lucide-react';
import { useLocale } from '../i18n/useLocale';
import { LOCALES, LOCALE_NAMES } from '../i18n/i18n';
import GlassSelect from '../ui/GlassSelect';

// Five languages do not fit a segmented toggle in the header capsule: a compact pill shows the
// current code and opens a glass list with each language under its own name.
const options = LOCALES.map((code) => ({
  value: code,
  label: LOCALE_NAMES[code],
  lang: code,
  content: (
    <span className="flex items-center justify-between gap-6">
      {LOCALE_NAMES[code]}
      <span aria-hidden="true" className="text-xs font-semibold tracking-wide text-ink/50 uppercase">{code}</span>
    </span>
  )
}));

const LanguagePicker = () => {
  const { locale, setLocale, t } = useLocale();

  return (
    <GlassSelect
      value={locale}
      options={options}
      onChange={setLocale}
      label={t('language.label')}
      align="end"
      className="flex min-h-11 items-center gap-1 rounded-full bg-ink/8 px-2.5 text-xs font-semibold tracking-wide text-ink uppercase ring-1 ring-white/50 ring-inset transition duration-200 ease-out hover:bg-white/55 aria-expanded:bg-white/85 aria-expanded:shadow-glass-sm md:min-h-8"
    >
      <Languages aria-hidden="true" className="size-4 text-ink/70" strokeWidth={1.9} />
      <span className="sr-only">{LOCALE_NAMES[locale]}</span>
      <span aria-hidden="true">{locale}</span>
      <ChevronDown aria-hidden="true" className="size-3.5 text-ink/60 transition-transform duration-200 in-aria-expanded:rotate-180" />
    </GlassSelect>
  );
};

export default LanguagePicker;
