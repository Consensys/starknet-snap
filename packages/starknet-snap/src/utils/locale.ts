import { acquireLock } from './lock';

const localeSetterLock = acquireLock(true);
let locale: Locale;

/**
 * Loads the user's locale preferences and sets the locale variable.
 */
export async function loadLocale() {
  await localeSetterLock.runExclusive(async () => {
    locale = await getUserLocalePreference();
  });
}

/**
 * Retrieves the current user locale.
 *
 * @returns The current user locale.
 */
export function getUserLocale() {
  return locale;
}

export type Locale = Record<
  string,
  {
    message: string;
  }
>;

/**
 * Retrieves the user's locale preferences.
 *
 * @returns A promise that resolves to the user's locale messages.
 */
export async function getUserLocalePreference(): Promise<Locale> {
  try {
    const { locale: userLocale } = await snap.request({
      method: 'snap_getPreferences',
    });
    return (await import(`../../locales/${userLocale}.json`)).messages;
  } catch {
    return (await import(`../../locales/en.json`)).messages;
  }
}

export type Translator = (string, ...args: (string | undefined)[]) => string;

/**
 * Returns a translator function that translates keys to user locale messages.
 *
 * @returns A function that translates keys to user locale messages.
 */
export function getTranslator(): Translator {
  const userLocale = getUserLocale();

  return (key: string, ...args: string[]): string => {
    const template = userLocale[key]?.message ?? `{${key}}`;

    // Replace placeholders like $1, $2, etc., with corresponding arguments
    return template.replace(/\{(\d+)\}/gu, (_, index: string) => {
      const argIndex = parseInt(index, 10) - 1; // {1} corresponds to args[0], {2} to args[1], etc.
      return args[argIndex] ?? `{${index}}`; // Fallback to placeholder if argument is missing
    });
  };
}

/**
 * Translates keys to user local message
 *
 * @param key
 * @returns A function that translates keys to user locale messages.
 */
export function translate(key: string): string {
  const userLocale = getUserLocale();
  return userLocale[key]?.message ?? `{${key}}`;
}
