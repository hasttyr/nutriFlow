import { afterEach, describe, expect, it, vi } from 'vitest';
import messages from './messages';
import products from '../data/products';
import { NODES } from '../distributed/cluster';
import { LOCALES, LOCALE_NAMES, STORAGE_KEY, createTranslator, detectLocale, loadLocale, localeForTimeZone } from './i18n';

// Plural forms each language actually uses for whole numbers (Polish needs one, few and many).
const integerCategories = (locale) => {
  const rules = new Intl.PluralRules(locale);
  return [...new Set(Array.from({ length: 200 }, (_, n) => rules.select(n)))].sort();
};

describe('messages', () => {
  it('has every key in every language', () => {
    const keys = Object.keys(messages.en).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(messages[locale]).sort(), locale).toEqual(keys);
      expect(LOCALE_NAMES[locale], locale).toBeTruthy();
    }
  });

  it('gives every plural entry the forms its language needs', () => {
    for (const locale of LOCALES) {
      const needed = integerCategories(locale);
      for (const [key, value] of Object.entries(messages[locale])) {
        if (typeof value === 'string') continue;
        expect(value, `${locale} ${key}`).toHaveProperty('other');
        for (const category of needed) expect(value, `${locale} ${key}`).toHaveProperty(category);
      }
    }
  });

  it('names every product and branch zone in every language', () => {
    const records = [...products.flatMap((product) => [product.name, product.unit]), ...NODES.map((node) => node.zone)];
    for (const record of records) {
      for (const locale of LOCALES) expect(record[locale], `${record.en} (${locale})`).toBeTruthy();
    }
  });
});

describe('createTranslator', () => {
  it('interpolates and pluralises', () => {
    const { t } = createTranslator('en');
    expect(t('products.count', { count: 1 })).toBe('1 product');
    expect(t('products.count', { count: 1200 })).toBe('1,200 products');
    expect(t('nav.cartLabel', { count: 3 })).toBe('Cart, 3 items');
  });

  it('translates to Spanish', () => {
    const { t } = createTranslator('es');
    expect(t('list.moveToCart', { count: 1 })).toBe('Pasar 1 faltante al carrito');
    expect(t('list.moveToCart', { count: 4 })).toBe('Pasar 4 faltantes al carrito');
  });

  it('uses all three Polish plural forms', () => {
    const { t } = createTranslator('pl');
    expect(t('products.count', { count: 1 })).toBe('1 produkt');
    expect(t('products.count', { count: 3 })).toBe('3 produkty');
    expect(t('products.count', { count: 5 })).toBe('5 produktów');
    expect(t('products.count', { count: 12 })).toBe('12 produktów');
    expect(t('products.count', { count: 22 })).toBe('22 produkty');
  });

  it('translates to Portuguese and Italian', () => {
    expect(createTranslator('pt').t('nav.cartLabel', { count: 2 })).toBe('Carrinho, 2 itens');
    expect(createTranslator('it').t('nav.cartLabel', { count: 1 })).toBe('Carrello, 1 articolo');
  });

  it('formats Colombian pesos without decimals in each language', () => {
    expect(createTranslator('es').formatPrice(12900)).toMatch(/^\$\s12\.900$/);
    expect(createTranslator('en').formatPrice(12900)).toMatch(/^COP\s12,900$/);
    expect(createTranslator('pt').formatPrice(12900)).toMatch(/^COP\s12\.900$/);
    expect(createTranslator('pl').formatPrice(12900)).toMatch(/^12\s900\sCOP$/);
    expect(createTranslator('it').formatPrice(12900)).toMatch(/^12\.900\sCOP$/);
  });

  it('fails loudly on a missing key', () => {
    expect(() => createTranslator('en').t('nope')).toThrow('Missing translation: nope');
  });

  it('localizes multilingual records', () => {
    const name = { en: 'Bananas', es: 'Banano', pl: 'Banany' };
    expect(createTranslator('es').localize(name)).toBe('Banano');
    expect(createTranslator('pl').localize(name)).toBe('Banany');
    expect(createTranslator('it').localize(name)).toBe('Bananas');
  });
});

describe('locale detection', () => {
  afterEach(() => vi.restoreAllMocks());

  it('follows a language the browser asks for', () => {
    expect(detectLocale({ languages: ['pl-PL', 'en'], timeZone: 'America/Bogota' })).toBe('pl');
    expect(detectLocale({ languages: ['pt-BR'], timeZone: 'UTC' })).toBe('pt');
    // The first language the app speaks, even if it is not the browser's first.
    expect(detectLocale({ languages: ['fr-FR', 'it'], timeZone: 'Europe/Paris' })).toBe('it');
  });

  it('lets the location win over an English browser', () => {
    expect(detectLocale({ languages: ['en-US'], timeZone: 'Europe/Warsaw' })).toBe('pl');
    expect(detectLocale({ languages: ['en-GB'], timeZone: 'Europe/Rome' })).toBe('it');
    expect(detectLocale({ languages: ['en-US'], timeZone: 'America/Sao_Paulo' })).toBe('pt');
    expect(detectLocale({ languages: ['en-US'], timeZone: 'Europe/Lisbon' })).toBe('pt');
    expect(detectLocale({ languages: ['en-US'], timeZone: 'America/Bogota' })).toBe('es');
  });

  it('falls back to English', () => {
    expect(detectLocale({ languages: ['en-US'], timeZone: 'America/New_York' })).toBe('en');
    expect(detectLocale({ languages: ['fr-FR'], timeZone: 'Europe/Paris' })).toBe('en');
    expect(detectLocale({ languages: [], timeZone: undefined })).toBe('en');
  });

  it('maps every Argentine time zone to Spanish', () => {
    expect(localeForTimeZone('America/Argentina/Buenos_Aires')).toBe('es');
    expect(localeForTimeZone('America/Argentina/Ushuaia')).toBe('es');
    expect(localeForTimeZone('Asia/Tokyo')).toBeUndefined();
  });

  it('reads the browser when nothing is saved', () => {
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['es-CO', 'en']);
    expect(detectLocale()).toBe('es');
    expect(loadLocale()).toBe('es');
  });

  it('prefers the saved language and ignores unknown values', () => {
    window.localStorage.setItem(STORAGE_KEY, 'pl');
    expect(loadLocale()).toBe('pl');
    window.localStorage.setItem(STORAGE_KEY, 'fr');
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['it-IT']);
    expect(loadLocale()).toBe('it');
  });
});
