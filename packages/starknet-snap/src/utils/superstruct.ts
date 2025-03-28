import { union } from '@metamask/snaps-sdk';
import { HexStruct } from '@metamask/utils';
import type {
  Call,
  CompiledContract,
  Invocations,
  UniversalDetails,
} from 'starknet';
import {
  constants,
  TransactionType,
  validateAndParseAddress,
  TransactionFinalityStatus,
  TransactionExecutionStatus,
} from 'starknet';
import type { Struct } from 'superstruct';
import {
  boolean,
  enums,
  object,
  optional,
  record,
  refine,
  string,
  any,
  number,
  array,
  assign,
  define,
  mask,
  validate,
  nonempty,
  unknown,
  empty,
  nullable,
  type,
} from 'superstruct';

import { TransactionDataVersion } from '../types/snapState';
import {
  CAIRO_VERSION_LEGACY,
  CAIRO_VERSION,
  MAXIMUM_TOKEN_NAME_LENGTH,
  MAXIMUM_TOKEN_SYMBOL_LENGTH,
} from './constants';
import { isValidStarkName } from './starknetUtils';
import { isValidAsciiStrField } from './string';

export const TokenNameStruct = refine(
  string(),
  'TokenNameStruct',
  (value: string) => {
    if (isValidAsciiStrField(value, MAXIMUM_TOKEN_NAME_LENGTH)) {
      return true;
    }
    return `The given token name is invalid`;
  },
);

export const TokenSymbolStruct = refine(
  string(),
  'TokenSymbolStruct',
  (value: string) => {
    if (isValidAsciiStrField(value, MAXIMUM_TOKEN_SYMBOL_LENGTH)) {
      return true;
    }
    return `The given token symbol is invalid`;
  },
);

export const AddressStruct = refine(
  string(),
  'AddressStruct',
  (value: string) => {
    try {
      const trimmedAddress = value.toString().replace(/^0x0?/u, '');

      // Check if the address is 63 characters long, the expected length of a StarkNet address exclude 0x0.
      if (trimmedAddress.length !== 63) {
        return 'Invalid address format';
      }

      validateAndParseAddress(trimmedAddress);
    } catch (error) {
      return 'Invalid address format';
    }
    return true;
  },
);

export const TransactionFinalityStatusStruct = enums(
  Object.values(TransactionFinalityStatus),
);

export const TransactionExecutionStatusStruct = enums(
  Object.values(TransactionExecutionStatus),
);

export const TransactionTypeStruct = enums(Object.values(TransactionType));

export const ChainIdStruct = enums(Object.values(constants.StarknetChainId));

export const TypeDataStarknetTypeStruct = union([
  object({
    name: string(),
    type: enums(['enum']),
    contains: string(),
  }),
  object({
    name: string(),
    type: enums(['merkletree']),
    contains: string(),
  }),
  object({
    name: string(),
    type: string(),
  }),
]);

export const TypeDataStarknetDomainStruct = object({
  name: optional(string()),
  version: optional(string()),
  chainId: optional(union([string(), number()])),
  revision: optional(union([string(), number()])),
});

export const TypeDataStruct = object({
  types: record(string(), array(TypeDataStarknetTypeStruct)),
  primaryType: string(),
  domain: TypeDataStarknetDomainStruct,
  message: record(string(), any()),
});

export const AuthorizableStruct = object({
  // TODO: the enableAuthorize should default to true
  enableAuthorize: optional(boolean()),
});

export const BaseRequestStruct = object({
  chainId: ChainIdStruct,
});

// TODO: refine this to calldata
export const RawArgsStruct = union([array(string()), record(string(), any())]);

export const CallDataStruct = object({
  entrypoint: nonempty(string()),
  contractAddress: nonempty(string()),
  calldata: optional(RawArgsStruct),
});

export const NumberStringStruct = union([number(), HexStruct]);

export const CairoVersionStruct = enums([CAIRO_VERSION, CAIRO_VERSION_LEGACY]);

export const TxVersionStruct = enums([
  constants.TRANSACTION_VERSION.V1,
  constants.TRANSACTION_VERSION.V2,
  constants.TRANSACTION_VERSION.V3,
]);

export const V1TxVersionStruct = enums([constants.TRANSACTION_VERSION.V1]);

export const V3TxVersionStruct = enums([constants.TRANSACTION_VERSION.V3]);

export const EDataModeStruct = enums(['L1', 'L2']);

export const ResourceBoundStruct = object({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  max_amount: optional(string()),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  max_price_per_unit: optional(string()),
});

export const ResourceBoundMappingStruct = object({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  l1_gas: optional(ResourceBoundStruct),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  l2_gas: optional(ResourceBoundStruct),
});

export const V3TransactionDetailStruct = object({
  nonce: optional(NumberStringStruct),
  version: optional(V3TxVersionStruct),
  resourceBounds: optional(ResourceBoundMappingStruct),
  tip: optional(NumberStringStruct),
  paymasterData: optional(array(NumberStringStruct)),
  accountDeploymentData: optional(array(NumberStringStruct)),
  nonceDataAvailabilityMode: optional(EDataModeStruct),
  feeDataAvailabilityMode: optional(EDataModeStruct),
});

// The declare transaction details struct does not using union to have more relax validation as starknet.js
export const DeclareSignDetailsStruct = assign(
  object({
    nonce: optional(NumberStringStruct),
    maxFee: optional(NumberStringStruct),
  }),
  V3TransactionDetailStruct,
  // Only restrict some required parameters for the declare transaction
  object({
    // TODO: classHash should be a hex string
    classHash: nonempty(string()),
    // TODO: compiledClassHash should be a hex string
    compiledClassHash: optional(string()),
    senderAddress: AddressStruct,
    chainId: ChainIdStruct,
    version: TxVersionStruct,
  }),
);

export const StarkNameStruct = refine(
  string(),
  'StarkNameStruct',
  (value: string) => {
    if (isValidStarkName(value)) {
      return true;
    }
    return `The given stark name is invalid`;
  },
);

export const AccountNameStruct = refine(
  string(),
  'AccountNameStruct',
  (value: string) => {
    if (value.length >= 1 && value.length <= 20) {
      return true;
    }
    return `The given account name is invalid`;
  },
);

/* ------------------------------ Contract Struct ------------------------------ */
/* eslint-disable */
export const SierraContractEntryPointFieldsStruct = object({
  selector: string(),
  function_idx: number(),
});

export const ContractEntryPointFieldsStruct = object({
  selector: string(),
  offset: union([string(), number()]),
  builtins: optional(array(string())),
});

export const EntryPointByTypeStruct = object({
  CONSTRUCTOR: array(ContractEntryPointFieldsStruct),
  EXTERNAL: array(ContractEntryPointFieldsStruct),
  L1_HANDLER: array(ContractEntryPointFieldsStruct),
});

export const SierraEntryPointByTypeStruct = object({
  CONSTRUCTOR: array(SierraContractEntryPointFieldsStruct),
  EXTERNAL: array(SierraContractEntryPointFieldsStruct),
  L1_HANDLER: array(SierraContractEntryPointFieldsStruct),
});

export const CompiledSierraStruct = object({
  sierra_program: array(string()),
  contract_class_version: nonempty(string()),
  entry_points_by_type: SierraEntryPointByTypeStruct,
  sierra_program_debug_info: optional(any()),
  abi: any(),
});

export const CompiledSierraCasmStruct = object({
  prime: string(),
  compiler_version: string(),
  bytecode: array(string()),
  hints: array(any()),
  pythonic_hints: optional(array(any())),
  bytecode_segment_lengths: optional(array(number())),
  entry_points_by_type: EntryPointByTypeStruct,
});

export const LegacyCompiledContractStruct = object({
  program: record(string(), any()),
  entry_points_by_type: EntryPointByTypeStruct,
  abi: any(),
});
/* eslint-enable */
/* ------------------------------ Contract Struct ------------------------------ */

// TODO: add unit test
export const CompiledContractStruct = define<CompiledContract>(
  'CompiledContractStruct',
  (value: CompiledContract) => {
    if (Object.prototype.hasOwnProperty.call(value, 'sierra_program')) {
      return validate(value, CompiledSierraStruct)[0] ?? true;
    }
    return validate(value, LegacyCompiledContractStruct)[0] ?? true;
  },
);

export const DeclareContractPayloadStruct = object({
  contract: CompiledContractStruct,
  classHash: optional(string()),
  casm: optional(CompiledSierraCasmStruct),
  compiledClassHash: optional(string()),
});

export const DeployAccountContractStruct = object({
  classHash: nonempty(string()),
  constructorCalldata: optional(RawArgsStruct),
  addressSalt: optional(NumberStringStruct),
  contractAddress: optional(string()),
});

export const UniversalDeployerContractPayloadStruct = object({
  classHash: NumberStringStruct,
  salt: optional(string()),
  unique: optional(boolean()),
  constructorCalldata: optional(RawArgsStruct),
});

export const BaseInvocationStruct = object({
  // lets not accept optaional payload to reduce the complexity of the struct
  // as the snap control the input
  payload: unknown(),
  type: TransactionTypeStruct,
});

export const CallsStruct = define<Call[] | Call>(
  // We do use a custom `define` for this type to avoid having to use a `union` since error
  // messages are a bit confusing.
  //
  // Doing manual validation allows us to use the "concrete" type of each supported acounts giving
  // use a much nicer message from `superstruct`.
  'CallsStruct',
  (value: unknown[] | unknown) => {
    const calls = Array.isArray(value) ? (value as Call[]) : [value as Call];
    return validate(calls, array(CallDataStruct))[0] ?? true;
  },
);

export const InvocationsStruct = define<Invocations>(
  // We do use a custom `define` for this type to avoid having to use a `union` since error
  // messages are a bit confusing.
  //
  // Doing manual validation allows us to use the "concrete" type of each supported acounts giving
  // use a much nicer message from `superstruct`.
  'InvocationsStruct',
  (value: unknown[]) => {
    for (const invocation of value as Invocations) {
      // This will also raise if `value` does not match any of the supported TransactionType!
      const maskedInvocation = mask(invocation, BaseInvocationStruct);

      const isArray = Array.isArray(maskedInvocation.payload);

      let struct: Struct;

      switch (invocation.type) {
        case TransactionType.DECLARE:
          struct = DeclareContractPayloadStruct;
          if (isArray) {
            throw new Error('Declare payload does not accept mutiple items');
          }
          break;
        case TransactionType.DEPLOY:
          struct = UniversalDeployerContractPayloadStruct;
          break;
        case TransactionType.DEPLOY_ACCOUNT:
          struct = DeployAccountContractStruct;
          if (isArray) {
            throw new Error(
              'Deploy account payload does not accept mutiple items',
            );
          }
          break;
        case TransactionType.INVOKE:
          struct = CallDataStruct;
          break;
        default:
          throw new Error('Invalid transaction type');
      }

      const [error] = validate(
        maskedInvocation.payload,
        isArray ? array(struct) : struct,
      );

      if (error !== undefined) {
        return error;
      }
    }
    return true;
  },
);

export const UniversalDetailsStruct = define<UniversalDetails>(
  'UniversalDetailsStruct',
  (value: unknown) => {
    return (
      validate(
        value,
        assign(
          V3TransactionDetailStruct,
          object({
            blockIdentifier: optional(string()),
            maxFee: optional(NumberStringStruct),
            skipValidate: optional(boolean()),
            version: optional(TxVersionStruct),
          }),
        ),
      )[0] ?? true
    );
  },
);

export const TransactionStruct = object({
  txnHash: HexStruct,
  txnType: TransactionTypeStruct,
  chainId: string(),
  senderAddress: union([AddressStruct, empty(string())]),
  contractAddress: union([AddressStruct, empty(string())]),
  executionStatus: union([TransactionExecutionStatusStruct, string()]),
  finalityStatus: union([TransactionFinalityStatusStruct, string()]),
  failureReason: string(),
  timestamp: number(),
  maxFee: nullable(string()),
  actualFee: nullable(string()),
  accountCalls: nullable(
    record(
      HexStruct,
      array(
        object({
          contract: HexStruct,
          contractFuncName: string(),
          contractCallData: array(string()),
          recipient: optional(string()),
          amount: optional(string()),
        }),
      ),
    ),
  ),
  version: number(),
  // Snap data Version to support backward compatibility , migration.
  dataVersion: enums(Object.values(TransactionDataVersion)),
});

export const AccountStruct = type({
  address: AddressStruct,
  chainId: ChainIdStruct,
  publicKey: HexStruct,
  addressSalt: HexStruct,
  addressIndex: number(),
  cairoVersion: CairoVersionStruct,
  upgradeRequired: boolean(),
  deployRequired: boolean(),
  accountName: optional(string()),
  isDeployed: optional(boolean()),
});
