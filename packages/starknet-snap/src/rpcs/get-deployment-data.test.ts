import { constants } from 'starknet';

import type { SnapState } from '../types/snapState';
import {
  ACCOUNT_CLASS_HASH,
  CAIRO_VERSION,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../utils/constants';
import {
  InvalidRequestParamsError,
  AccountAlreadyDeployedError,
} from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import { mockAccount, prepareMockAccount } from './__tests__/helper';
import type { GetDeploymentDataParams } from './get-deployment-data';
import { getDeploymentData } from './get-deployment-data';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('GetDeploymentDataRpc', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const createRequest = (
    chainId: constants.StarknetChainId,
    address: string,
  ) => ({
    address,
    chainId,
  });

  const mockIsAccountDeployed = (deployed: boolean) => {
    const spy = jest.spyOn(starknetUtils, 'isAccountDeployed');
    spy.mockResolvedValue(deployed);
    return spy;
  };

  const prepareGetDeploymentDataTest = async (deployed: boolean) => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    mockIsAccountDeployed(deployed);
    const request = createRequest(chainId, account.address);

    return {
      account,
      request,
    };
  };

  it('returns the deployment data', async () => {
    const { account, request } = await prepareGetDeploymentDataTest(false);
    const { address, publicKey } = account;
    const expectedResult = {
      address,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      class_hash: ACCOUNT_CLASS_HASH,
      salt: publicKey,
      calldata: starknetUtils.getDeployAccountCallData(
        publicKey,
        CAIRO_VERSION,
      ),
      version: CAIRO_VERSION,
    };

    const result = await getDeploymentData.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('throws `AccountAlreadyDeployedError` if the account has deployed', async () => {
    const { request } = await prepareGetDeploymentDataTest(true);

    await expect(getDeploymentData.execute(request)).rejects.toThrow(
      AccountAlreadyDeployedError,
    );
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      getDeploymentData.execute({} as unknown as GetDeploymentDataParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
