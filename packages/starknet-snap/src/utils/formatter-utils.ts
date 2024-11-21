import type { Call } from 'starknet';
import { assert } from 'superstruct';

import type { TokenStateManager } from '../state/token-state-manager';
import type { FormattedCallData } from '../types/snapState';
import { logger } from './logger';
import { AddressStruct, NumberStringStruct } from './superstruct';

export const hexToString = (hexStr) => {
  let str = '';
  for (let i = 0; i < hexStr.length; i += 2) {
    const hexValue = hexStr.substr(i, 2);
    const decimalValue = parseInt(hexValue, 16);
    str += String.fromCharCode(decimalValue);
  }
  return str;
};

/**
 * Maps deprecated parameters to their new equivalents in the requestParams object
 * and removes the deprecated parameters afterward.
 *
 * @param requestParams - The object containing the API request parameters.
 * @param mappings - A record of key-value pairs where the key is the old parameter
 * and the value is the new parameter.
 * @example
 * const paramMappings = {
 *   signerAddress: 'address',
 *   senderAddress: 'address',
 *   txnInvocation: 'calls',
 *   invocationsDetails: 'details',
 *   transaction: 'details'
 * };
 * mapDeprecatedParams(apiParams.requestParams, paramMappings);
 */
export const mapDeprecatedParams = <Params>(
  requestParams: Params,
  mappings: Record<string, string>,
) => {
  Object.keys(mappings).forEach((oldParam) => {
    const newParam = mappings[oldParam] as unknown as keyof Params;
    if (Object.prototype.hasOwnProperty.call(requestParams, oldParam)) {
      requestParams[newParam] = requestParams[oldParam];
      delete requestParams[oldParam]; // Remove old param after mapping
    }
  });
};

export const callToTransactionReqCall = async (
  call: Call,
  chainId: string,
  address: string,
  tokenStateManager: TokenStateManager,
): Promise<FormattedCallData> => {
  const { contractAddress, calldata, entrypoint } = call;
  // Base data object for each call, with transfer fields left as optional
  const formattedCall: FormattedCallData = {
    contractAddress,
    calldata: calldata as string[],
    entrypoint,
  };

  // Check if the entrypoint is 'transfer' and the populate transfer fields
  if (entrypoint === 'transfer' && calldata) {
    try {
      const token = await tokenStateManager.getToken({
        address: contractAddress,
        chainId,
      });

      if (token) {
        const senderAddress = address;

        // ensure the data is in correct format,
        // if an error occur, it will catch and not to format it
        assert(calldata[0], AddressStruct);
        assert(calldata[1], NumberStringStruct);
        const recipientAddress = calldata[0]; // Assuming calldata[0] is the recipient address
        const amount = calldata[1];
        // Populate transfer-specific fields
        formattedCall.tokenTransferData = {
          senderAddress,
          recipientAddress,
          amount: typeof amount === 'number' ? amount.toString() : amount,
          symbol: token.symbol,
          decimals: token.decimals,
        };
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.warn(`Error in amount conversion: ${error.message}`);
    }
  }
  return formattedCall;
};
