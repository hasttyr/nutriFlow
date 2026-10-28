import en from './locales/en';
import es from './locales/es';
import it from './locales/it';
import pl from './locales/pl';
import pt from './locales/pt';

// One file per language. Plural entries use Intl.PluralRules categories ({ one, few, many, other });
// each language only lists the categories it needs, and anything else falls back to `other`.
const messages = { es, en, pt, pl, it };

export default messages;
