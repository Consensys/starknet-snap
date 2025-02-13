import { getDefaultAccountName } from './account';

describe('getDefaultAccountName', () => {
  it.each([
    [undefined, 'Account 1'], // Default case
    [0, 'Account 1'],
    [1, 'Account 2'],
    [5, 'Account 6'],
    [999, 'Account 1000'],
  ])("returns '%s' when hdIndex is %s", (hdIndex, expected) => {
    expect(getDefaultAccountName(hdIndex as number)).toBe(expected);
  });

  it('throws an error when hdIndex is negative', () => {
    expect(() => getDefaultAccountName(-1)).toThrow(
      'hdIndex cannot be negative.',
    );
  });
});
