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
    expect(t('common.calories', { count: 1 })).toBe('1 calorie');
    expect(t('common.calories', { count: 1120 })).toBe('1,120 calories');
    expect(t('nav.cartLabel', { count: 3 })).toBe('Cart, 3 items');
  });

  it('translates to Spanish', () => {
    const { t } = createTranslator('es');
    expect(t('detail.totalFor', { count: 1 })).toBe('Total para 1 porción:');
    expect(t('detail.totalFor', { count: 4 })).toBe('Total para 4 porciones:');
  });

  it('formats US dollars unambiguously in both languages', () => {
    expect(createTranslator('en').formatPrice(5.99)).toBe('$5.99');
    expect(createTranslator('es').formatPrice(5.99)).toMatch(/^USD\s5\.99$/);
  });

  it('fails loudly on a missing key', () => {
    expect(() => createTranslator('en').t('nope')).toThrow('Missing translation: nope');
  });

  it('localizes bilingual records', () => {
    const name = { en: 'Protein Bar', es: 'Barra de proteína' };
    expect(createTranslator('es').localize(name)).toBe('Barra de proteína');
    expect(createTranslator('en').localize(name)).toBe('Protein Bar');
  });
});

describe('locale detection', () => {
  afterEach(() => vi.restoreAllMocks());

  it('follows the browser language when nothing is saved', () => {
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['es-MX', 'en']);
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
