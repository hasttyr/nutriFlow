import { afterEach, describe, expect, it, vi } from 'vitest';
import messages from './messages';
import { STORAGE_KEY, createTranslator, detectLocale, loadLocale } from './i18n';

describe('messages', () => {
  it('has the same keys and plural shapes in every language', () => {
    const shape = (locale) =>
      Object.entries(messages[locale])
        .map(([key, value]) => `${key}:${typeof value === 'string' ? 'text' : Object.keys(value).sort().join('|')}`)
        .sort();
    expect(shape('es')).toEqual(shape('en'));
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

  it('formats Colombian pesos without decimals', () => {
    expect(createTranslator('es').formatPrice(12900)).toMatch(/^\$\s12\.900$/);
    expect(createTranslator('en').formatPrice(12900)).toMatch(/^COP\s12,900$/);
  });

  it('fails loudly on a missing key', () => {
    expect(() => createTranslator('en').t('nope')).toThrow('Missing translation: nope');
  });

  it('localizes bilingual records', () => {
    const name = { en: 'Bananas', es: 'Banano' };
    expect(createTranslator('es').localize(name)).toBe('Banano');
    expect(createTranslator('en').localize(name)).toBe('Bananas');
  });
});

describe('locale detection', () => {
  afterEach(() => vi.restoreAllMocks());

  it('follows the browser language when nothing is saved', () => {
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['es-CO', 'en']);
    expect(detectLocale()).toBe('es');
    expect(loadLocale()).toBe('es');
  });

  it('prefers the saved language and ignores unknown values', () => {
    window.localStorage.setItem(STORAGE_KEY, 'en');
    expect(loadLocale()).toBe('en');
    window.localStorage.setItem(STORAGE_KEY, 'fr');
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
    expect(loadLocale()).toBe('en');
  });
});
