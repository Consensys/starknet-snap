import {
  isAsciiString,
  isValidAsciiStrField,
  replaceMiddleChar,
  shortenAddress,
} from './string';

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

describe('replaceMiddleChar', () => {
  const str =
    '0x074aaeb168bbd155d41290e6be09d80c9e937ee3d775eac19519a2fcc76fc61c';
  it('replaces the middle of a string', () => {
    expect(replaceMiddleChar(str, 5, 3)).toBe('0x074...61c');
  });

  it('does not replace if the string is empty', () => {
    expect(replaceMiddleChar('', 5, 3)).toBe('');
  });

  it('throws `Indexes must be positives` error if headLength or tailLength is negative value', () => {
    expect(() => replaceMiddleChar(str, -1, 20)).toThrow(
      'Indexes must be positives',
    );
    expect(() => replaceMiddleChar(str, 20, -10)).toThrow(
      'Indexes must be positives',
    );
  });

  it('throws `Indexes out of bounds` error if headLength + tailLength is out of bounds', () => {
    expect(() => replaceMiddleChar(str, 100, 0)).toThrow(
      'Indexes out of bounds',
    );
    expect(() => replaceMiddleChar(str, 0, 100)).toThrow(
      'Indexes out of bounds',
    );
  });
});

describe('shortenAddress', () => {
  const str =
    '0x074aaeb168bbd155d41290e6be09d80c9e937ee3d775eac19519a2fcc76fc61c';
  it('shorten an address', () => {
    expect(shortenAddress(str)).toBe('0x074...c61c');
  });
});
