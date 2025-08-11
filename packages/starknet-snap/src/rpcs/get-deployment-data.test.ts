import type { constants } from 'starknet';

import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  InvalidRequestParamsError,
  AccountAlreadyDeployedError,
  ContractNotDeployedError,
} from '../utils/exceptions';
import { mockAccountContractReader } from '../wallet/account/__test__/helper';
import { setupAccountController } from './__tests__/helper';
import type { GetDeploymentDataParams } from './get-deployment-data';
import { getDeploymentData } from './get-deployment-data';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('GetDeploymentDataRpc', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupGetDeploymentDataTest = async (deployed: boolean) => {
    const { getVersionSpy } = mockAccountContractReader({});

    if (!deployed) {
      getVersionSpy.mockRejectedValue(new ContractNotDeployedError());
    }
    const { account } = await setupAccountController({
      network,
      isDeployed: deployed,
    });

    const request = {
      address: account.address,
      chainId: network.chainId as constants.StarknetChainId,
    };

    return {
      account,
      request,
    };
  };

  it('returns the deployment data', async () => {
    const { account, request } = await setupGetDeploymentDataTest(false);
    const {
      address,
      accountContract: {
        deployPayload: {
          classHash,
          addressSalt: salt,
          constructorCalldata: calldata,
        },
        cairoVerion,
      },
    } = account;

    const expectedResult = {
      address,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      class_hash: classHash,
      salt,
      calldata,
      version: cairoVerion.toString(10),
    };

    const result = await getDeploymentData.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('throws `AccountAlreadyDeployedError` if the account has deployed', async () => {
    const { request } = await setupGetDeploymentDataTest(true);

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
