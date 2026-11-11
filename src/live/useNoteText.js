import { useLocale } from '../i18n/useLocale';
import { createTranslator } from '../i18n/i18n';
import { profileFor } from '../region/profiles';

// A notification in the reader's language and time zone. Amounts are in the order's own
// currency, so they are formatted with that country's profile.
export const useNoteText = () => {
  const { t, locale, formatDate, formatTime } = useLocale();
  return (note) => {
    const money = createTranslator(locale, profileFor(note.country)).formatPrice;
    const vars = Object.fromEntries(Object.entries(note.vars).map(([key, value]) => [key, key === 'total' || key === 'amount' ? money(value) : value]));
    const at = Date.parse(note.at);
    return { text: t(note.key, vars), when: `${formatDate(at)} ${formatTime(at)}` };
  };
};
