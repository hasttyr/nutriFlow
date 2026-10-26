import { use } from 'react';
import { LocaleContext } from './LocaleContext';

export const useLocale = () => {
  const locale = use(LocaleContext);
  if (!locale) {
    throw new Error('useLocale must be used inside <LocaleProvider>');
  }
  return locale;
};
