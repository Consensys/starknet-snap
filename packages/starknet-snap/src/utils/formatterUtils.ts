import type { Call } from 'starknet';
import type { Call as CallGetStarknetV4 } from 'starknet-types-07';

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
 * Converts an array of calls from either the `CallGetStarknetV4[]` format
 * or the standard `Call[]` format into the standard `Call[]` format. If the input
 * calls are already in the correct format, no changes are made.
 *
 * The function ensures that:
 * - `contract_address` from `CallGetStarknetV4` is renamed to `contractAddress` if needed.
 * - `entry_point` from `CallGetStarknetV4` is renamed to `entrypoint` if needed.
 * - `calldata` is set to an empty array if undefined.
 *
 * @template T - The type of the calls array, either `CallGetStarknetV4[]` or `Call[]`.
 * @param calls - The array of call objects to be formatted.
 * @returns The array of formatted calls in the `Call[]` format.
 * @example
 * const calls = [
 *   { contract_address: '0xabc', entry_point: 'transfer', calldata: ['0x1', '0x2'] }, // CallGetStarknetV4
 *   { contractAddress: '0xdef', entrypoint: 'approve', calldata: ['0x3', '0x4'] }     // Call
 * ];
 * const formattedCalls = formatCalls(calls);
 * console.log(formattedCalls);
 * // Output: [{ contractAddress: '0xabc', entrypoint: 'transfer', calldata: ['0x1', '0x2'] },
 * //          { contractAddress: '0xdef', entrypoint: 'approve', calldata: ['0x3', '0x4'] }]
 */
export const formatCalls = <CallType extends Call | CallGetStarknetV4>(
  calls: CallType[],
): Call[] => {
  return calls.map((call) => {
    const contractAddress =
      'contract_address' in call ? call.contract_address : call.contractAddress;
    const entrypoint =
      'entry_point' in call ? call.entry_point : call.entrypoint;
    const calldata = call.calldata ?? [];

    return {
      contractAddress,
      entrypoint,
      calldata,
    };
  });
};
