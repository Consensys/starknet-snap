import type { Call } from 'starknet';
import type { Call as CallGetStarknetV4 } from 'starknet-types-07';
// Conversion function
export const formatCalls = (calls: CallGetStarknetV4[]): Call[] => {
  return calls.map((call) => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    contractAddress: call.contract_address, // convert to camelCase
    // eslint-disable-next-line @typescript-eslint/naming-convention
    entrypoint: call.entry_point, // rename entry_point to entrypoint
    calldata: call.calldata ?? [], // use calldata or empty array if undefined
  }));
};
