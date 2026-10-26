import { useLocale } from '../i18n/useLocale';
import { LOCALES } from '../i18n/i18n';

const names = { es: 'Español', en: 'English' };

const LanguageToggle = () => {
  const { locale, setLocale, t } = useLocale();

  return (
    <div role="group" aria-label={t('language.label')} className="flex rounded-full bg-ink/8 p-0.5 ring-1 ring-white/50 ring-inset">
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-label={names[code]}
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
          className={`min-h-11 min-w-11 cursor-pointer rounded-full px-2.5 text-xs md:min-h-7 md:min-w-0 font-semibold tracking-wide uppercase transition duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus-500 ${
            locale === code ? 'bg-white/90 text-ink shadow-glass-sm' : 'text-ink/65 hover:text-ink'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
