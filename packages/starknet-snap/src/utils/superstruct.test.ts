import { constants, TransactionType } from 'starknet';
import { StructError, assert } from 'superstruct';

import contractExample from '../__tests__/fixture/contract-example.json';
import transactionExample from '../__tests__/fixture/transactionExample.json';
import typedDataExample from '../__tests__/fixture/typedDataExample.json';
import { generateTransactions } from '../__tests__/helper';
import { ContractFuncName } from '../types/snapState';
import { createAccountObject } from '../wallet/account/__test__/helper';
import {
  ACCOUNT_CLASS_HASH,
  CAIRO_VERSION,
  CAIRO_VERSION_LEGACY,
  ETHER_SEPOLIA_TESTNET,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from './constants';
import {
  AddressStruct,
  AuthorizableStruct,
  BaseRequestStruct,
  CairoVersionStruct,
  CallDataStruct,
  DeclareSignDetailsStruct,
  EDataModeStruct,
  NumberStringStruct,
  ResourceBoundMappingStruct,
  TxVersionStruct,
  TypeDataStruct,
  V3TransactionDetailStruct,
  InvocationsStruct,
  ChainIdStruct,
  TokenSymbolStruct,
  TokenNameStruct,
  TransactionStruct,
  AccountStruct,
} from './superstruct';

describe('TokenNameStruct', () => {
  it.each(['Hello', 'Hello World'])(
    'does not throw error if the token name is valid - %s',
    (tokenName) => {
      expect(() => assert(tokenName, TokenNameStruct)).not.toThrow();
    },
  );

  it.each([
    // non ASCII string
    'Schönen',
    // invalid length, longer than 64 chars
    '372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cddddddd372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cddddddd',
  ])('throws error if the token name is invalid - %s', (tokenName) => {
    expect(() => assert(tokenName, TokenNameStruct)).toThrow(StructError);
  });
});

describe('TokenSymbolStruct', () => {
  it.each(['symbol', 'symbol A'])(
    'does not throw error if the token symbol is valid - %s',
    (tokenSymbol) => {
      expect(() => assert(tokenSymbol, TokenSymbolStruct)).not.toThrow();
    },
  );

  it.each([
    // non ASCII string
    'Schönen',
    // invalid length, longer than 16 chars
    'ABCDEFGHIJKLMNOPABCDEFGHIJKLMNOP',
  ])('throws error if the token symbol is invalid - %s', (tokenSymbol) => {
    expect(() => assert(tokenSymbol, TokenSymbolStruct)).toThrow(StructError);
  });
});

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
        },
        BaseRequestStruct,
      ),
    ).not.toThrow();
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
  it.each([
    constants.TRANSACTION_VERSION.V1,
    constants.TRANSACTION_VERSION.V2,
    constants.TRANSACTION_VERSION.V3,
  ])('does not throw error if the tx version is %s', (version) => {
    expect(() => assert(version, TxVersionStruct)).not.toThrow();
  });

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
      version: constants.TRANSACTION_VERSION.V1,
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

describe('InvocationsStruct', () => {
  it.each([
    {
      type: TransactionType.INVOKE,
      payload: {
        contractAddress: ETHER_SEPOLIA_TESTNET.address,
        entrypoint: ContractFuncName.Transfer,
      },
    },
    {
      type: TransactionType.DECLARE,
      payload: {
        contract: contractExample.contract,
      },
    },
    {
      type: TransactionType.DEPLOY,
      payload: {
        classHash: ACCOUNT_CLASS_HASH,
      },
    },
    {
      type: TransactionType.DEPLOY_ACCOUNT,
      payload: {
        classHash: ACCOUNT_CLASS_HASH,
      },
    },
  ])(
    'does not throw error if the invocation type is $type and payload is valid',
    (request: unknown) => {
      expect(() => assert([request], InvocationsStruct)).not.toThrow();
    },
  );

  it.each([
    {
      type: TransactionType.INVOKE,
      payload: {
        entrypoint: ContractFuncName.Transfer,
      },
    },
    {
      type: TransactionType.DECLARE,
      payload: {
        contract: {
          ...contractExample.contract,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          entry_points_by_type: {
            invalid: 1,
          },
        },
      },
    },
    {
      type: TransactionType.DEPLOY,
      payload: {
        classHash: '',
      },
    },
    {
      type: TransactionType.DEPLOY_ACCOUNT,
      payload: {
        classHash: '',
      },
    },
  ])(
    'throws error if the invocation type is $type and payload is invalid',
    (request: unknown) => {
      expect(() => assert([request], InvocationsStruct)).toThrow(StructError);
    },
  );

  it.each([
    {
      request: {
        type: TransactionType.DECLARE,
        payload: [
          {
            contract: contractExample.contract,
          },
        ],
      },
      expectedError: 'Declare payload does not accept mutiple items',
    },
    {
      request: {
        type: TransactionType.DEPLOY_ACCOUNT,
        payload: [
          {
            classHash: ACCOUNT_CLASS_HASH,
          },
        ],
      },
      expectedError: 'Deploy account payload does not accept mutiple items',
    },
  ])(
    'throws error if the invocation type is $request.type and payload is multiple',
    ({
      request,
      expectedError,
    }: {
      request: unknown;
      expectedError: string;
    }) => {
      expect(() => assert([request], InvocationsStruct)).toThrow(expectedError);
    },
  );

  it.each([
    {
      type: TransactionType.INVOKE,
      payload: [
        {
          contractAddress: ETHER_SEPOLIA_TESTNET.address,
          entrypoint: ContractFuncName.Transfer,
        },
      ],
    },
    {
      type: TransactionType.DEPLOY,
      payload: [
        {
          classHash: ACCOUNT_CLASS_HASH,
        },
      ],
    },
  ])(
    'does not throw error if the invocation type is $type and payload is multiple',
    (request: unknown) => {
      expect(() => assert([request], InvocationsStruct)).not.toThrow();
    },
  );

  it('throws meaningful error message if a nested StructError thrown', () => {
    const request = {
      type: TransactionType.INVOKE,
      payload: {
        contractAddress: ETHER_SEPOLIA_TESTNET.address,
      },
    };
    expect(() => assert([request], InvocationsStruct)).toThrow(
      'At path: entrypoint -- At path: entrypoint -- Expected a string, but received: undefined',
    );
  });
});

describe('TransactionStruct', () => {
  it('does not throw error if the transaction is valid', () => {
    const [transaction] = generateTransactions({
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address:
        '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
    });
    expect(() => assert(transaction, TransactionStruct)).not.toThrow();
  });

  it('throws error if the transaction is invalid', () => {
    const [transaction] = generateTransactions({
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address:
        '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
    });
    expect(() =>
      assert(
        {
          ...transaction,
          txnType: 'invalid txn type',
        },
        TransactionStruct,
      ),
    ).toThrow(StructError);
  });
});

describe('AccountStruct', () => {
  it('does not throw error if the account is valid', async () => {
    const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
    const { accountObj } = await createAccountObject(network);

    jest
      .spyOn(accountObj.accountContract, 'isRequireUpgrade')
      .mockResolvedValue(false);
    jest
      .spyOn(accountObj.accountContract, 'isRequireDeploy')
      .mockResolvedValue(false);
    jest
      .spyOn(accountObj.accountContract, 'isDeployed')
      .mockResolvedValue(true);

    const account = await accountObj.serialize();

    expect(() => assert(account, AccountStruct)).not.toThrow();
  });

  it('throws error if the account is invalid', () => {
    expect(() => assert({}, AccountStruct)).toThrow(StructError);
  });
});
