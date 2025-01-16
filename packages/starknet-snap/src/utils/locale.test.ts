/* eslint-disable no-restricted-globals */
import {
  loadLocale,
  getUserLocale,
  getTranslator,
  getUserLocalePreference,
} from './locale';

const mockSnapRequest = jest.fn();

jest.mock('../../locales/en.json', () => ({
  messages: { greeting: { message: 'Hello' } },
}));

(global as any).snap = {
  request: mockSnapRequest.mockResolvedValue({ locale: 'en' }),
};

describe('locale utils', () => {
  describe('getUserLocale', () => {
    it("returns the locale messages for the user's preferred locale", async () => {
      const locale = await getUserLocalePreference();
      expect(locale).toStrictEqual({ greeting: { message: 'Hello' } });
    });

    it("returns the default locale messages if the user's preferred locale is not available", async () => {
      mockSnapRequest.mockRejectedValue(new Error('Locale not found'));

      const locale = await getUserLocalePreference();
      expect(locale).toStrictEqual({ greeting: { message: 'Hello' } });
    });
  });

  describe('loadLocale', () => {
    it('loads and set the user locale', async () => {
      await loadLocale();
      const locale = getUserLocale();
      expect(locale).toStrictEqual({ greeting: { message: 'Hello' } });
    });

    it('loads and set the default locale if user locale is not available', async () => {
      mockSnapRequest.mockRejectedValue(new Error('Locale not found'));

      await loadLocale();
      const locale = getUserLocale();
      expect(locale).toStrictEqual({ greeting: { message: 'Hello' } });
    });
  });

  describe('getTranslator', () => {
    it('translates keys to user locale messages', async () => {
      await loadLocale();
      const translate = getTranslator();
      expect(translate('greeting')).toBe('Hello');
    });

    it('returns the key wrapped in curly braces if translation is not found', async () => {
      await loadLocale();
      const translate = getTranslator();
      expect(translate('nonexistent')).toBe('{nonexistent}');
    });
  });
});
