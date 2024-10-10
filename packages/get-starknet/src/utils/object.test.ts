import { isset } from './object';

describe('isset', () => {
  const obj = {
    p1: {
      p2a: 1,
      p2: {
        p3: 4,
      },
    },
  };

  it.each(['p1.p2.p3'])('returns true if the property "%s" exist in the object', (property: string) => {
    const result = isset(obj, property);

    expect(result).toBe(true);
  });

  it('returns false if the property is not exist in the object', () => {
    const result = isset(obj, 'p0');

    expect(result).toBe(false);
  });
});
