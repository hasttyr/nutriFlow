import { useCallback, useEffect, useMemo, useState } from 'react';
import { LocaleContext } from './LocaleContext';
import { createTranslator, loadLocaleChoice, localeFor, saveLocaleChoice } from './i18n';
import { activeProfile, useRegion } from '../geo/region';
import { DEFAULT_COUNTRY, profileFor } from '../region/profiles';
import { useLive } from '../live/store';

const LocaleProvider = ({ children }) => {
  const region = useRegion();
  // Re-render when the admin console overrides a profile.
  useLive();
  const [choice, setChoice] = useState(loadLocaleChoice);
  const locale = localeFor(region.country, choice);
  // Outside the served countries nothing is priced, so formats fall back to the default profile.
  const profile = activeProfile(region) ?? profileFor(DEFAULT_COUNTRY);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next) => {
      const nextChoice = { locale: next, country: region.country };
      saveLocaleChoice(next, region.country);
      setChoice(nextChoice);
    },
    [region.country]
  );

  const value = useMemo(() => ({ ...createTranslator(locale, profile), setLocale }), [locale, profile, setLocale]);

  return <LocaleContext value={value}>{children}</LocaleContext>;
};

export default LocaleProvider;
