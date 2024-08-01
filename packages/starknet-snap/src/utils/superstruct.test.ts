import { constants } from 'starknet';
import { StructError, assert } from 'superstruct';

import typedDataExample from '../__test__/fixture/typedDataExample.json';
import {
  AddressStruct,
  AuthorizableStruct,
  BaseRequestStruct,
  ChainIdStruct,
  TypeDataStruct,
} from './superstruct';

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

describe('ChainIdStruct', () => {
  it.each(Object.values(constants.StarknetChainId))(
    'does not throw error if the chain id is valid - %s',
    (chainId) => {
      expect(() => assert(chainId, ChainIdStruct)).not.toThrow();
    },
  );

  it('throws error if the chain id is invalid', () => {
    expect(() => assert('0x', ChainIdStruct)).toThrow(StructError);
  });
});

describe('TypeDataStruct', () => {
  it('does not throw error if the type data is valid', () => {
    expect(() => assert(typedDataExample, TypeDataStruct)).not.toThrow();
  });

  it('throws error if the type data is invalid', () => {
    expect(() =>
      assert(
        {
          ...typedDataExample,
          domain: {
            name: 1,
          },
        },
        TypeDataStruct,
      ),
    ).toThrow(StructError);
  });
});

describe('AuthorizableStruct', () => {
  it('does not throw error if `enableAuthorize` is true', () => {
    expect(() =>
      assert(
        {
          enableAuthorize: true,
        },
        AuthorizableStruct,
      ),
    ).not.toThrow();
  });

  it('does not throw error if `enableAuthorize` is omit', () => {
    expect(() => assert({}, AuthorizableStruct)).not.toThrow();
  });

  it('throws error if the type data is invalid', () => {
    expect(() =>
      assert(
        {
          enable: true,
        },
        AuthorizableStruct,
      ),
    ).toThrow(StructError);
  });
});

describe('BaseRequestStruct', () => {
  it('does not throw error if data is valid', () => {
    expect(() =>
      assert(
        {
          chainId: constants.StarknetChainId.SN_SEPOLIA.toString(),
          debugLevel: 'ALL',
        },
        BaseRequestStruct,
      ),
    ).not.toThrow();
  });

  it('does not throw error if `debugLevel` is omit', () => {
    expect(() =>
      assert(
        {
          chainId: constants.StarknetChainId.SN_SEPOLIA.toString(),
        },
        BaseRequestStruct,
      ),
    ).not.toThrow();
  });

  it('throws error if `debugLevel` is invalid', () => {
    expect(() =>
      assert(
        {
          chainId: constants.StarknetChainId.SN_SEPOLIA.toString(),
          debugLevel: 'Invalid-Debug-Level',
        },
        BaseRequestStruct,
      ),
    ).toThrow(StructError);
  });
});
