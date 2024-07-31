import { StructError, assert } from 'superstruct';

import { AddressStruct } from './superstruct';

describe('AddressStruct', () => {
  it.each([
    '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
    '4882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
  ])('does not throw error if the address is valid - %s', (address) => {
    expect(() => assert(address, AddressStruct)).not.toThrow();
  });

  it.each([
    // non hex string - charactor is not within [0-9a-fA-F]
    '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f2zzz',
    // invalid length - 66/63 chars expected
    '372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
  ])('throws error if the address is invalid - %s', (address) => {
    expect(() => assert(address, AddressStruct)).toThrow(StructError);
  });
});
