import { constants } from 'starknet';

import typedDataExample from '../__tests__/fixture/typedDataExample.json';
import type { SnapState } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import { mockAccount, prepareMockAccount } from './__tests__/helper';
import { verifySignature } from './verify-signature';
import type { VerifySignatureParams } from './verify-signature';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('verifySignature', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  it('returns true if the signature is correct', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
    prepareMockAccount(account, state);

    const signature = await starknetUtils.signMessage(
      account.privateKey,
      typedDataExample,
      account.address,
    );

    const request = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      typedDataMessage: typedDataExample,
      signature,
    };

    const result = await verifySignature.execute(request);

    expect(result).toBe(true);
  });

  it('returns false if the signature is incorrect', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
    const invalidSignatueAccount = await mockAccount(
      constants.StarknetChainId.SN_MAIN,
    );
    prepareMockAccount(account, state);

    const invalidSignatue = await starknetUtils.signMessage(
      invalidSignatueAccount.privateKey,
      typedDataExample,
      invalidSignatueAccount.address,
    );

    const request = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      typedDataMessage: typedDataExample,
      signature: invalidSignatue,
    };

    const result = await verifySignature.execute(request);

    expect(result).toBe(false);
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      verifySignature.execute({} as unknown as VerifySignatureParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
