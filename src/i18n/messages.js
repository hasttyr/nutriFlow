import en from './locales/en';
import es from './locales/es';
import it from './locales/it';
import pl from './locales/pl';
import pt from './locales/pt';
import { featureMessages } from './locales/features';

// One file per language. Plural entries use Intl.PluralRules categories ({ one, few, many, other });
// each language only lists the categories it needs, and anything else falls back to `other`.
// Newer features keep their copy for all five languages side by side in locales/features.js.
const merge = (locale, base) => ({ ...base, ...featureMessages(locale) });
const messages = { es: merge('es', es), en: merge('en', en), pt: merge('pt', pt), pl: merge('pl', pl), it: merge('it', it) };

export default messages;
