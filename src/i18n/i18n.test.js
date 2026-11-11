import { afterEach, describe, expect, it, vi } from 'vitest';
import products from '../data/products';
import { NODES } from '../distributed/cluster';
import { COUNTRIES, profileFor } from '../region/profiles';
import { LOCALES, LOCALE_NAMES, STORAGE_KEY, browserLocale, createTranslator, localeFor, loadLocaleChoice, messages, saveLocaleChoice } from './i18n';

// Plural forms each language actually uses for whole numbers (Japanese has only `other`).
const integerCategories = (locale) => {
  const rules = new Intl.PluralRules(locale);
  return [...new Set(Array.from({ length: 200 }, (_, n) => rules.select(n)))].sort();
};

describe('resource catalogs', () => {
  it('speaks the language of each of the five countries', () => {
    expect([...LOCALES].sort()).toEqual(['en', 'es', 'fr', 'ja', 'pt']);
    for (const country of COUNTRIES) expect(LOCALES).toContain(profileFor(country).language);
    expect(LOCALE_NAMES).toEqual({ es: 'Español', pt: 'Português', en: 'English', fr: 'Français', ja: '日本語' });
  });

  it('has every key in every language', () => {
    const keys = Object.keys(messages.en).sort();
    for (const locale of LOCALES) expect(Object.keys(messages[locale]).sort(), locale).toEqual(keys);
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
    const { t } = createTranslator('en', profileFor('US'));
    expect(t('products.count', { count: 1 })).toBe('1 product');
    expect(t('products.count', { count: 1200 })).toBe('1,200 products');
    expect(t('nav.cartLabel', { count: 3 })).toBe('Cart, 3 items');
  });

  it('translates to Spanish', () => {
    const { t } = createTranslator('es');
    expect(t('list.moveToCart', { count: 1 })).toBe('Pasar 1 faltante al carrito');
    expect(t('list.moveToCart', { count: 4 })).toBe('Pasar 4 faltantes al carrito');
  });

  it('treats 0 and 1 as singular in French (CLDR fr)', () => {
    const { t } = createTranslator('fr', profileFor('FR'));
    expect(t('products.count', { count: 0 })).toBe('0 produit');
    expect(t('products.count', { count: 1 })).toBe('1 produit');
    expect(t('products.count', { count: 2 })).toBe('2 produits');
  });

  it('has no grammatical plural in Japanese (CLDR ja)', () => {
    const { t } = createTranslator('ja', profileFor('JP'));
    expect(t('products.count', { count: 1 })).toBe('1 件の商品');
    expect(t('products.count', { count: 3 })).toBe('3 件の商品');
  });

  it('formats numbers the way the country does, whatever the language', () => {
    expect(createTranslator('en', profileFor('FR')).t('products.count', { count: 1200 })).toBe('1 200 products');
    expect(createTranslator('en', profileFor('CO')).t('products.count', { count: 1200 })).toBe('1.200 products');
  });

  it('falls back to English for a key a catalog lacks, and fails loudly on an unknown key', () => {
    const original = messages.ja['nav.home'];
    delete messages.ja['nav.home'];
    try {
      expect(createTranslator('ja', profileFor('JP')).t('nav.home')).toBe('Home');
    } finally {
      messages.ja['nav.home'] = original;
    }
    expect(() => createTranslator('en').t('nope')).toThrow('Missing translation: nope');
  });

  it('localizes multilingual records, falling back to English', () => {
    const name = { en: 'Bananas', es: 'Banano', ja: 'バナナ' };
    expect(createTranslator('es').localize(name)).toBe('Banano');
    expect(createTranslator('ja').localize(name)).toBe('バナナ');
    expect(createTranslator('fr').localize(name)).toBe('Bananas');
  });
});

describe('interface language', () => {
  afterEach(() => vi.restoreAllMocks());

  it('follows the country profile', () => {
    expect(localeFor('CO', null)).toBe('es');
    expect(localeFor('BR', null)).toBe('pt');
    expect(localeFor('US', null)).toBe('en');
    expect(localeFor('FR', null)).toBe('fr');
    expect(localeFor('JP', null)).toBe('ja');
  });

  it('keeps a hand-picked language only in the country it was picked in', () => {
    saveLocaleChoice('en', 'JP');
    expect(loadLocaleChoice()).toEqual({ locale: 'en', country: 'JP' });
    expect(localeFor('JP')).toBe('en');
    expect(localeFor('FR')).toBe('fr');
  });

  it('ignores unknown saved values', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ locale: 'pl', country: 'CO' }));
    expect(loadLocaleChoice()).toBeNull();
    window.localStorage.setItem(STORAGE_KEY, 'es');
    expect(loadLocaleChoice()).toBeNull();
  });

  it('uses the browser language outside the served countries', () => {
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['de-DE', 'fr-FR']);
    expect(browserLocale()).toBe('fr');
    expect(localeFor('DE', null)).toBe('fr');
    expect(browserLocale(['de-DE'])).toBe('en');
  });
});
