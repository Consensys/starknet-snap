import { formatUnits } from 'ethers/lib/utils';
import type { Call } from 'starknet';

import type { TokenStateManager } from '../state/token-state-manager';
import type { FormattedCallData } from '../types/snapState';

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

/**
 * Extracts and formats call data from an array of calls, returning an array where each item
 * corresponds directly to an item in the original callsArray. If the call involves an ERC20
 * 'transfer' entrypoint, additional fields are included to provide details about the transfer.
 *
 * @param callsArray - The array of call objects, each containing contract address, calldata, and entrypoint.
 * @param chainId - The chain ID associated with the calls.
 * @param address - The sender address.
 * @param tokenStateManager - The token state manager used to retrieve token details.
 * @returns A promise that resolves to an array of FormattedCallData objects, each representing
 * formatted call data, with one-to-one correspondence with the original callsArray.
 * @example
 * const callDataArray = await extractCallData(calls, chainId, senderAddress, tokenStateManager);
 */
export const formatCallData = async (
  callsArray: Call[],
  chainId: string,
  address: string,
  tokenStateManager: TokenStateManager,
): Promise<FormattedCallData[]> => {
  const dataArray: FormattedCallData[] = [];

  for (const call of callsArray) {
    const { contractAddress, calldata, entrypoint } = call;

    // Base data object for each call, with transfer fields left as optional
    const callData: FormattedCallData = {
      type: 'contract',
      label: 'Contract Call',
      contractAddress,
      chainId,
      calldata,
      entrypoint,
      isTransfer: false, // Set default to false
    };

    // Check if the contract is an ERC20 token and entrypoint is 'transfer' to populate transfer fields
    const token = await tokenStateManager.getToken({
      address: contractAddress,
      chainId,
    });

    if (token && entrypoint === 'transfer' && calldata) {
      try {
        const senderAddress = address;
        const recipientAddress = calldata[0]; // Assuming calldata[0] is the recipient address
        const amount = formatUnits(calldata[1], token.decimals); // Convert amount using token decimals

        // Populate transfer-specific fields
        callData.isTransfer = true;
        callData.senderAddress = senderAddress;
        callData.recipientAddress = recipientAddress;
        callData.amount = amount;
        callData.tokenSymbol = token.symbol;
        callData.decimals = token.decimals;
        callData.label = 'Token Transfer';
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.warn(`Error in amount conversion: ${error}`);
      }
    }

    dataArray.push(callData);
  }

  return dataArray;
};
