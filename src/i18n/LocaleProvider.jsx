import { useEffect, useMemo, useState } from 'react';
import { LocaleContext } from './LocaleContext';
import { createTranslator, loadLocale, saveLocale } from './i18n';

const LocaleProvider = ({ children }) => {
  const [locale, setLocale] = useState(loadLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    saveLocale(locale);
  }, [locale]);

  const value = useMemo(() => ({ ...createTranslator(locale), setLocale }), [locale]);

  return <LocaleContext value={value}>{children}</LocaleContext>;
};

export default LocaleProvider;
