import { useCallback, useEffect, useMemo, useState } from 'react';
import { LocaleContext } from './LocaleContext';
import { createTranslator, loadLocale, saveLocale } from './i18n';
import { moneyOf, useRegion } from '../geo/region';

const LocaleProvider = ({ children }) => {
  const [locale, setCurrentLocale] = useState(loadLocale);
  const { currency, rate } = moneyOf(useRegion());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Remembers only what the visitor picks; a detected language is worked out again next visit.
  const setLocale = useCallback((next) => {
    saveLocale(next);
    setCurrentLocale(next);
  }, []);

  const value = useMemo(() => ({ ...createTranslator(locale, { currency, rate }), setLocale }), [locale, currency, rate, setLocale]);

  return <LocaleContext value={value}>{children}</LocaleContext>;
};

export default LocaleProvider;
