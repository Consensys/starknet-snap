import type { Call } from 'starknet';
import type { Call as CallGetStarknetV4 } from 'starknet-types-07';

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
 * @param calls - The array of `Call` objects, either in `CallGetStarknetV4` or `Call`.
 * @returns The array of formatted calls in the `Call[]` format.
 */
export const formatCalls = (calls: Call[] | CallGetStarknetV4[]): Call[] => {
  return calls.map((call) => {
    const contractAddress = 'contract_address' in call ? call.contract_address : call.contractAddress;
    const entrypoint = 'entry_point' in call ? call.entry_point : call.entrypoint;
    const { calldata } = call;

    return {
      contractAddress,
      entrypoint,
      calldata,
    };
  });
};