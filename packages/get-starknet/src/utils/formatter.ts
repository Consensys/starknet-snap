/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import type { Abi, Call, DeclareContractPayload } from 'starknet';
import type { AddDeclareTransactionParameters, Call as CallGetStarknetV4 } from 'starknet-types-07';

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

/**
 * Converts `AddDeclareTransactionParameters` into `DeclareContractPayload` format.
 *
 * The function ensures that:
 * - `compiled_class_hash` is mapped to `compiledClassHash`.
 * - `class_hash` is optional and is mapped to `classHash`.
 * - `contract_class` is converted into the expected `CompiledSierra` structure.
 *
 * @param params - The object of `AddDeclareTransactionParameters`.
 * @returns The object in `DeclareContractPayload` format.
 */
export const formatDeclareTransaction = (params: AddDeclareTransactionParameters): DeclareContractPayload => {
  const { compiled_class_hash, class_hash, contract_class } = params;

  return {
    compiledClassHash: compiled_class_hash,
    classHash: class_hash,
    contract: {
      sierra_program: contract_class.sierra_program,
      contract_class_version: contract_class.contract_class_version,
      entry_points_by_type: {
        CONSTRUCTOR: contract_class?.entry_points_by_type.CONSTRUCTOR.map((ep) => ({
          selector: ep.selector,
          function_idx: ep.function_idx,
        })),
        EXTERNAL: contract_class?.entry_points_by_type.EXTERNAL.map((ep) => ({
          selector: ep.selector,
          function_idx: ep.function_idx,
        })),
        L1_HANDLER: contract_class?.entry_points_by_type.L1_HANDLER.map((ep) => ({
          selector: ep.selector,
          function_idx: ep.function_idx,
        })),
      },
      abi: contract_class.abi as unknown as Abi, // Directly passing the string as `any`
    },
  };
};
