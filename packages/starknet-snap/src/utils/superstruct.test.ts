import { constants } from 'starknet';
import { StructError, assert } from 'superstruct';

import transactionExample from '../__tests__/fixture/transactionExample.json';
import typedDataExample from '../__tests__/fixture/typedDataExample.json';
import { CAIRO_VERSION, CAIRO_VERSION_LEGACY } from './constants';
import {
  AddressStruct,
  AuthorizableStruct,
  BaseRequestStruct,
  CairoVersionStruct,
  CallDataStruct,
  ChainIdStruct,
  DeclareSignDetailsStruct,
  EDataModeStruct,
  NumberStringStruct,
  ResourceBoundMappingStruct,
  TxVersionStruct,
  TypeDataStruct,
  V3TransactionDetailStruct,
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

describe('CairoVersionStruct', () => {
  it.each([CAIRO_VERSION, CAIRO_VERSION_LEGACY])(
    'does not throw error if the version is %s',
    (version) => {
      expect(() => assert(version, CairoVersionStruct)).not.toThrow();
    },
  );

  it('throws error if the cairo version is invalid', () => {
    expect(() => assert('invalid version', CairoVersionStruct)).toThrow(
      StructError,
    );
  });
});

describe('TxVersionStruct', () => {
  it.each(Object.values(constants.TRANSACTION_VERSION))(
    'does not throw error if the tx version is %s',
    (version) => {
      expect(() => assert(version, TxVersionStruct)).not.toThrow();
    },
  );

  it('throws error if the tx version is invalid', () => {
    expect(() => assert('invalid version', TxVersionStruct)).toThrow(
      StructError,
    );
  });
});

describe('CallDataStruct', () => {
  it('does not throw error if the call data is correct', () => {
    expect(() =>
      assert(transactionExample.transactions[0], CallDataStruct),
    ).not.toThrow();
  });

  it('throws error if the call data is invalid', () => {
    expect(() => assert('invalid version', CallDataStruct)).toThrow(
      StructError,
    );
  });
});

describe('NumberStringStruct', () => {
  it.each([1, '0x1'])(
    'does not throw error if the input is %s',
    (val: number | string) => {
      expect(() => assert(val, NumberStringStruct)).not.toThrow();
    },
  );

  it('throws error if the input is invalid', () => {
    expect(() => assert('9sd0', NumberStringStruct)).toThrow(StructError);
  });
});

describe('EDataModeStruct', () => {
  it.each(['L1', 'L2'])(
    'does not throw error if the data mode is %s',
    (val: string) => {
      expect(() => assert(val, EDataModeStruct)).not.toThrow();
    },
  );

  it('throws error if the data mode is invalid', () => {
    expect(() => assert('L3', EDataModeStruct)).toThrow(StructError);
  });
});

// this test also cover the test for ResourceBoundStruct
describe('ResourceBoundMappingStruct', () => {
  it.each([
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      l1_gas: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        max_amount: '100',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        max_price_per_unit: '100',
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      l2_gas: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        max_amount: '100',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        max_price_per_unit: '100',
      },
    },
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      l1_gas: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        max_amount: '100',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        max_price_per_unit: '100',
      },
    },
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      l2_gas: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        max_amount: '100',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        max_price_per_unit: '100',
      },
    },
  ])('does not throw error if the data mode is correct', (request: unknown) => {
    expect(() => assert(request, ResourceBoundMappingStruct)).not.toThrow();
  });

  it('throws error if the data mode is invalid', () => {
    expect(() =>
      assert(
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          l3_gas: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            max_amount: '100',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            max_price_per_unit: '100',
          },
        },
        ResourceBoundMappingStruct,
      ),
    ).toThrow(StructError);
  });
});

describe('V3TransactionDetailStruct', () => {
  it.each([
    {
      nonce: '1',
      version: constants.TRANSACTION_VERSION.V3,
      resourceBounds: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        l1_gas: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          max_amount: '100',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          max_price_per_unit: '100',
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        l2_gas: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          max_amount: '100',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          max_price_per_unit: '100',
        },
      },
      tip: '1',
      paymasterData: ['1'],
      accountDeploymentData: ['1'],
      nonceDataAvailabilityMode: 'L1',
      feeDataAvailabilityMode: 'L2',
    },
    {
      nonce: '1',
    },
  ])('does not throw error if the data mode is correct', (request: unknown) => {
    expect(() => assert(request, V3TransactionDetailStruct)).not.toThrow();
  });

  it('does not throw error if the tx detail is empty', () => {
    expect(() => assert({}, V3TransactionDetailStruct)).not.toThrow();
  });

  it('throws error if the data mode is invalid', () => {
    expect(() =>
      assert(
        {
          nonce: 'ae',
        },
        ResourceBoundMappingStruct,
      ),
    ).toThrow(StructError);
  });
});

describe('DeclareSignDetailsStruct', () => {
  it.each([
    {
      classHash:
        '0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918',
      senderAddress:
        '0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918',
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      version: constants.TRANSACTION_VERSION.V2,
      maxFee: '0',
      nonce: '0',
    },
    {
      classHash:
        '0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918',
      senderAddress:
        '0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918',
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      version: constants.TRANSACTION_VERSION.V3,
      nonce: '0x1',
      resourceBounds: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        l1_gas: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          max_amount: '100',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          max_price_per_unit: '100',
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        l2_gas: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          max_amount: '100',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          max_price_per_unit: '100',
        },
      },
    },
  ])(
    'does not throw error if the declare sign details is correct',
    (request: unknown) => {
      expect(() => assert(request, DeclareSignDetailsStruct)).not.toThrow();
    },
  );

  it('throws error if the declare sign details is invalid', () => {
    expect(() => assert({}, DeclareSignDetailsStruct)).toThrow(StructError);
  });
});
