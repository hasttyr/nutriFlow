import { useCallback, useEffect, useMemo, useState } from 'react';
import { LocaleContext } from './LocaleContext';
import { createTranslator, loadLocale, saveLocale } from './i18n';

const LocaleProvider = ({ children }) => {
  const [locale, setCurrentLocale] = useState(loadLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Remembers only what the visitor picks; a detected language is worked out again next visit.
  const setLocale = useCallback((next) => {
    saveLocale(next);
    setCurrentLocale(next);
  }, []);

  const value = useMemo(() => ({ ...createTranslator(locale), setLocale }), [locale, setLocale]);

  return <LocaleContext value={value}>{children}</LocaleContext>;
};

export default LocaleProvider;
