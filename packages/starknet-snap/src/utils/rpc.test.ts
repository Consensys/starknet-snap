import { constants } from 'starknet';
import { object, string } from 'superstruct';
import type { Struct, Infer } from 'superstruct';

import type { StarknetAccount } from '../__tests__/helper';
import { generateAccounts } from '../__tests__/helper';
import type { SnapState } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from './constants';
import { InvalidRequestParamsError, UnknownError } from './exceptions';
import {
  AccountRpcController,
  RpcController,
  validateRequest,
  validateResponse,
} from './rpc';
import * as snapHelper from './snap';
import * as snapUtils from './snapUtils';
import * as starknetUtils from './starknetUtils';
import { AddressStruct } from './superstruct';

jest.mock('./snap');
jest.mock('./logger');

const validateStruct = object({
  signerAddress: AddressStruct,
});

const validateParam = {
  signerAddress:
    '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
};

describe('validateRequest', () => {
  it('does not throw error if the request is valid', () => {
    expect(() =>
      validateRequest(validateParam, validateStruct as unknown as Struct),
    ).not.toThrow();
  });

  it('throws `InvalidRequestParamsError` if the request is invalid', () => {
    const requestParams = {
      signerAddress: 1234,
    };

    expect(() =>
      validateRequest(requestParams, validateStruct as unknown as Struct),
    ).toThrow(InvalidRequestParamsError);
  });
});

describe('validateResponse', () => {
  it('does not throw error if the response is valid', () => {
    expect(() =>
      validateResponse(validateParam, validateStruct as unknown as Struct),
    ).not.toThrow();
  });

  it('throws `Invalid Response` error if the response is invalid', () => {
    const response = {
      signerAddress: 1234,
    };

    expect(() =>
      validateResponse(response, validateStruct as unknown as Struct),
    ).toThrow(new UnknownError('Invalid Response'));
  });
});

describe('RpcController', () => {
  class MockRpc extends RpcController<string, string> {
    protected requestStruct = string();

    protected responseStruct = string();

    // Set it to public to be able to spy on it
    async handleRequest(params: string) {
      return `done ${params}`;
    }
  }

  it('executes request', async () => {
    const rpc = new MockRpc();

    const result = await rpc.execute('test');

    expect(result).toBe('done test');
  });
});

describe('AccountRpcController', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const RequestStruct = object({
    address: string(),
    chainId: string(),
  });

  type Request = Infer<typeof RequestStruct>;

  class MockAccountRpc extends AccountRpcController<Request, string> {
    protected requestStruct = RequestStruct;

    protected responseStruct = string();

    // Set it to public to be able to spy on it
    async handleRequest(param: Request) {
      return `done ${param.address} and ${param.chainId}`;
    }
  }

  const mockAccount = async (network: constants.StarknetChainId) => {
    const accounts = await generateAccounts(network, 1);
    return accounts[0];
  };

  const prepareExecute = async (account: StarknetAccount) => {
    const verifyIfAccountNeedUpgradeOrDeploySpy = jest.spyOn(
      snapUtils,
      'verifyIfAccountNeedUpgradeOrDeploy',
    );

    const getKeysFromAddressSpy = jest.spyOn(
      starknetUtils,
      'getKeysFromAddress',
    );

    const getStateDataSpy = jest.spyOn(snapHelper, 'getStateData');

    getStateDataSpy.mockResolvedValue(state);

    getKeysFromAddressSpy.mockResolvedValue({
      privateKey: account.privateKey,
      publicKey: account.publicKey,
      addressIndex: account.addressIndex,
      derivationPath: account.derivationPath as unknown as any,
    });

    verifyIfAccountNeedUpgradeOrDeploySpy.mockReturnThis();

    return {
      getKeysFromAddressSpy,
      getStateDataSpy,
      verifyIfAccountNeedUpgradeOrDeploySpy,
    };
  };

  it('executes request', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    await prepareExecute(account);
    const rpc = new MockAccountRpc();

    const result = await rpc.execute({
      address: account.address,
      chainId,
    });

    expect(result).toBe(`done ${account.address} and ${chainId}`);
  });

  it('fetchs account before execute', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    const { getKeysFromAddressSpy } = await prepareExecute(account);
    const rpc = new MockAccountRpc();

    await rpc.execute({ address: account.address, chainId });

    expect(getKeysFromAddressSpy).toHaveBeenCalled();
  });

  it.each([true, false])(
    `assign verifyIfAccountNeedUpgradeOrDeploy's argument "showAlert" to %s if the constructor option 'showInvalidAccountAlert' is set to %s`,
    async (showInvalidAccountAlert: boolean) => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const account = await mockAccount(chainId);
      const { verifyIfAccountNeedUpgradeOrDeploySpy } = await prepareExecute(
        account,
      );
      const rpc = new MockAccountRpc({
        showInvalidAccountAlert,
      });

      await rpc.execute({ address: account.address, chainId });

      expect(verifyIfAccountNeedUpgradeOrDeploySpy).toHaveBeenCalledWith(
        expect.any(Object),
        account.address,
        account.publicKey,
        showInvalidAccountAlert,
      );
    },
  );
});
