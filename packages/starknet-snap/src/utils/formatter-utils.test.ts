import { constants } from 'starknet';

import { singleCall } from '../__tests__/fixture/callsExamples.json';
import { generateAccounts } from '../__tests__/helper';
import { TokenStateManager } from '../state/token-state-manager';
import type { Erc20Token } from '../types/snapState';
import { ETHER_SEPOLIA_TESTNET } from './constants';
import {
  callToTransactionReqCall,
  mapDeprecatedParams,
} from './formatter-utils';
import { logger } from './logger';

jest.mock('./logger');

describe('mapDeprecatedParams', () => {
  it('maps deprecated parameters to their new equivalents', () => {
    const requestParams = {
      signerAddress: '0x123',
      txnInvocation: 'invoke',
    };
    const mappings = {
      signerAddress: 'address',
      txnInvocation: 'calls',
    };

    const expected = {
      address: '0x123',
      calls: 'invoke',
    };

    mapDeprecatedParams(requestParams, mappings);

    expect(requestParams).toStrictEqual(expected);
  });

  it('removes the deprecated parameter after mapping', () => {
    const requestParams = {
      signerAddress: '0x123',
      txnInvocation: 'invoke',
    };
    const mappings = {
      signerAddress: 'address',
      txnInvocation: 'calls',
    };

    mapDeprecatedParams(requestParams, mappings);

    expect(requestParams).not.toHaveProperty('signerAddress');
    expect(requestParams).not.toHaveProperty('txnInvocation');
  });

  it('does nothing if the deprecated parameter does not exist', () => {
    const requestParams = {
      otherParam: 'value',
    };
    const mappings = {
      signerAddress: 'address',
    };

    const expected = { otherParam: 'value' };

    mapDeprecatedParams(requestParams, mappings);

    expect(requestParams).toStrictEqual(expected);
  });

  it('does nothing if the mapping is empty', () => {
    const requestParams = {
      signerAddress: '0x123',
    };
    const mappings = {};

    const expected = { signerAddress: '0x123' };

    mapDeprecatedParams(requestParams, mappings);

    expect(requestParams).toStrictEqual(expected);
  });
});

describe('callToTransactionReqCall', () => {
  const chainId = constants.StarknetChainId.SN_SEPOLIA;

  const mockGetToken = async (tokenData: Erc20Token | null) => {
    const getTokenSpy = jest.spyOn(TokenStateManager.prototype, 'getToken');
    // Mock getToken method to return the provided tokenData
    getTokenSpy.mockResolvedValue(tokenData);

    return {
      getTokenSpy,
    };
  };

  const getSenderAndRecipient = async () => {
    const [{ address }, { address: receipientAddress }] =
      await generateAccounts(chainId, 2);
    return {
      senderAddress: address,
      recipientAddress: receipientAddress,
    };
  };

  it('returns a formatted `call` object without `tokenTransferData` if no ERC20 transfer calldata is present.', async () => {
    const call = singleCall.calls;
    const { senderAddress } = await getSenderAndRecipient();

    // The getToken method should not be called, so we prepare the spy with null
    const { getTokenSpy } = await mockGetToken(null);

    const result = await callToTransactionReqCall(
      call,
      chainId,
      senderAddress,
      new TokenStateManager(),
    );

    expect(getTokenSpy).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      contractAddress: call.contractAddress,
      calldata: call.calldata,
      entrypoint: call.entrypoint,
    });
  });

  it('returns a formatted `call` object without `tokenTransferData` if the Erc20Token can not be found.', async () => {
    const { senderAddress, recipientAddress } = await getSenderAndRecipient();
    const call = {
      ...singleCall.calls,
      entrypoint: 'transfer',
      calldata: [recipientAddress, '1000'],
    };

    // Simulate the case where the token can not be found
    await mockGetToken(null);

    const result = await callToTransactionReqCall(
      call,
      chainId,
      senderAddress,
      new TokenStateManager(),
    );

    expect(result).toStrictEqual({
      contractAddress: call.contractAddress,
      calldata: call.calldata,
      entrypoint: call.entrypoint,
    });
  });

  it('returns a formatted `call` object without `tokenTransferData` if the calldata is not in the expected format', async () => {
    const { senderAddress } = await getSenderAndRecipient();
    const call = { ...singleCall.calls, entrypoint: 'transfer', calldata: [] };
    const loggerSpy = jest.spyOn(logger, 'warn');

    await mockGetToken(ETHER_SEPOLIA_TESTNET);

    const result = await callToTransactionReqCall(
      call,
      chainId,
      senderAddress,
      new TokenStateManager(),
    );

    expect(loggerSpy).toHaveBeenCalled();
    expect(result).toStrictEqual({
      contractAddress: call.contractAddress,
      calldata: call.calldata,
      entrypoint: call.entrypoint,
    });
  });

  it('returns a formatted `call` object with `tokenTransferData` if ERC20 transfer calldata is present', async () => {
    const { senderAddress, recipientAddress } = await getSenderAndRecipient();
    const transferAmt = '1000';
    const call = {
      ...singleCall.calls,
      entrypoint: 'transfer',
      calldata: [recipientAddress, transferAmt],
    };
    const token = ETHER_SEPOLIA_TESTNET;

    const { getTokenSpy } = await mockGetToken(token);

    const result = await callToTransactionReqCall(
      call,
      chainId,
      senderAddress,
      new TokenStateManager(),
    );

    expect(getTokenSpy).toHaveBeenCalledWith({
      address: call.contractAddress,
      chainId,
    });
    expect(result).toStrictEqual({
      contractAddress: call.contractAddress,
      calldata: call.calldata,
      entrypoint: call.entrypoint,
      tokenTransferData: {
        senderAddress,
        recipientAddress,
        amount: transferAmt,
        symbol: token.symbol,
        decimals: token.decimals,
      },
    });
  });
});
