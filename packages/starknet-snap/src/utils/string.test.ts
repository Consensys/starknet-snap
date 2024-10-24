import { isAsciiString, isValidAsciiStrField } from './string';

describe('isAsciiString', () => {
  it('returns true for a ASCII string', () => {
    expect(isAsciiString('hello')).toBe(true);
  });

  it('returns false for a non ASCII string', () => {
    // non ASCII string
    expect(isAsciiString('Schönen Tag noch')).toBe(false);
  });
});

describe('isValidAsciiStrField', () => {
  it.each(['hello', 'hello '])(
    'returns true for a valid ASCII string: %s',
    (str: string) => {
      expect(isValidAsciiStrField(str, 10)).toBe(true);
    },
  );

  it.each([
    // invalid length, longer than 10 chars
    'Have a nice day',
    // non ASCII string
    'Schönen',
    // non ASCII string
    ' Schönaa ',
  ])(
    'returns false for a string that fails ASCII check or length validation: %s',
    (str: string) => {
      expect(isValidAsciiStrField(str, 10)).toBe(false);
    },
  );
});
