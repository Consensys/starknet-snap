import { constants } from 'starknet';

import typedDataExample from '../__tests__/fixture/typedDataExample.json';
import { generateAccounts } from '../__tests__/helper';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import { setupAccountController } from './__tests__/helper';
import { verifySignature } from './verify-signature';
import type { VerifySignatureParams } from './verify-signature';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('verifySignature', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupVerifySignatureTest = async () => {
    const { account } = await setupAccountController({
      network,
    });

    const request = {
      chainId: network.chainId as constants.StarknetChainId,
      address: account.address,
      typedDataMessage: typedDataExample,
    };

    return {
      request,
      account,
    };
  };

  it('returns true if the signature is correct', async () => {
    const { account, request } = await setupVerifySignatureTest();

    const signature = await starknetUtils.signMessage(
      account.privateKey,
      typedDataExample,
      account.address,
    );

    const result = await verifySignature.execute({
      ...request,
      signature,
    });

    expect(result).toBe(true);
  });

  it('returns false if the signature is incorrect', async () => {
    const { account } = await setupAccountController({
      network,
    });

    const [invalidSignatureAccount] = await generateAccounts(
      network.chainId,
      1,
    );

    const invalidSignature = await starknetUtils.signMessage(
      invalidSignatureAccount.privateKey,
      typedDataExample,
      invalidSignatureAccount.address,
    );

    const request = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      typedDataMessage: typedDataExample,
      signature: invalidSignature,
    };

    const result = await verifySignature.execute({
      ...request,
      signature: invalidSignature,
    });

    expect(result).toBe(false);
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      verifySignature.execute({} as unknown as VerifySignatureParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
