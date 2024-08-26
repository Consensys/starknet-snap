import { union } from '@metamask/snaps-sdk';
import { HexStruct } from '@metamask/utils';
import { constants, TransactionType, validateAndParseAddress } from 'starknet';
import type { Struct, Infer } from 'superstruct';
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
  dynamic,
  define,
  mask,
  validate,
  nonempty,
} from 'superstruct';

import { CAIRO_VERSION_LEGACY, CAIRO_VERSION } from './constants';
import { LogLevel } from './logger';

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
  // TODO: the debug level should be set by snap rather than pass in from request.
  debugLevel: optional(enums(Object.keys(LogLevel))),
});

export const CallDataStruct = object({
  entrypoint: string(),
  contractAddress: string(),
  calldata: union([array(string()), record(string(), any())]), // TODO: refine this to calldata
});

export const NumberStringStruct = union([number(), HexStruct]);

export const CairoVersionStruct = enums([CAIRO_VERSION, CAIRO_VERSION_LEGACY]);

export const TxVersionStruct = enums([
  constants.TRANSACTION_VERSION.V2,
  constants.TRANSACTION_VERSION.V3,
]);

export const V2TxVersionStruct = enums([constants.TRANSACTION_VERSION.V2]);

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

/**
 * Creates a struct that combines predefined properties with additional dynamic properties.
 *
 * This function generates a Superstruct schema that includes both the predefined properties
 * and any additional properties found in the input. The additional properties are validated
 * according to the specified `additionalPropertyTypes`, or `any` if not provided.
 *
 * @param predefinedProperties - A Superstruct schema defining the base set of properties that are expected.
 * @param additionalPropertyTypes - A Superstruct schema that defines the types for any additional properties.
 * Defaults to `any`, allowing any additional properties.
 * @returns A dynamic struct that first validates against the predefined properties and then
 * includes any additional properties that match the `additionalPropertyTypes` schema.
 */
export const createStructWithAdditionalProperties = (
  predefinedProperties: Struct<any, any>,
  additionalPropertyTypes: Struct<any, any> = any(),
) => {
  return dynamic((value) => {
    if (typeof value !== 'object' || value === null) {
      return predefinedProperties;
    }

    const additionalProperties = Object.keys(value).reduce<
      Record<string, Struct>
    >((schema, key) => {
      if (!(key in predefinedProperties.schema)) {
        schema[key] = additionalPropertyTypes;
      }
      return schema;
    }, {});

    return assign(predefinedProperties, object(additionalProperties));
  });
};

// Define the types you expect for additional properties
const additionalPropertyTypes = union([string(), number(), any()]);

const DeclarePayloadStruct = object({
  contract: union([any(), string()]),
  classHash: optional(string()),
  casm: optional(any()),
  compiledClassHash: optional(string()),
});

const InvokePayloadStruct = object({
  contractAddress: string(),
  calldata: array(string()),
  entrypoint: optional(string()), // Making entrypoint optional as it was mentioned in the example
});

const DeclareTransactionStruct = createStructWithAdditionalProperties(
  object({
    type: enums([TransactionType.DECLARE]),
    payload: optional(DeclarePayloadStruct),
  }),
  additionalPropertyTypes,
);

const DeployTransactionStruct = createStructWithAdditionalProperties(
  object({
    type: enums([TransactionType.DEPLOY]),
    payload: optional(any()),
  }),
  additionalPropertyTypes,
);

const DeployAccountTransactionStruct = createStructWithAdditionalProperties(
  object({
    type: enums([TransactionType.DEPLOY_ACCOUNT]),
    payload: optional(any()),
  }),
  additionalPropertyTypes,
);

const InvokeTransactionStruct = createStructWithAdditionalProperties(
  object({
    type: enums([TransactionType.INVOKE]),
    payload: optional(InvokePayloadStruct),
  }),
  additionalPropertyTypes,
);

type Invocation =
  | Infer<typeof DeclareTransactionStruct>
  | Infer<typeof DeployTransactionStruct>
  | Infer<typeof DeployAccountTransactionStruct>
  | Infer<typeof InvokeTransactionStruct>;

/**
 * Mapping between account types and their matching `superstruct` schema.
 */
export const InvocationStructs: Record<
  string,
  | typeof DeclareTransactionStruct
  | typeof DeployTransactionStruct
  | typeof DeployAccountTransactionStruct
  | typeof InvokeTransactionStruct
> = {
  [`${TransactionType.DECLARE}`]: DeclareTransactionStruct,
  [`${TransactionType.DEPLOY}`]: DeployTransactionStruct,
  [`${TransactionType.DEPLOY_ACCOUNT}`]: DeployAccountTransactionStruct,
  [`${TransactionType.INVOKE}`]: InvokeTransactionStruct,
};

/**
 * Base type for `Invocation` as a `superstruct.object`.
 */
export const BaseInvocationStruct = object({
  /**
   * Account type.
   */
  type: enums([
    TransactionType.DECLARE,
    TransactionType.DEPLOY,
    TransactionType.DEPLOY_ACCOUNT,
    TransactionType.INVOKE,
  ]),
});

/**
 * Invocation as a `superstruct.object`.
 *
 * See {@link KeyringAccount}.
 */
export const InvocationStruct = define<Invocation>(
  // We do use a custom `define` for this type to avoid having to use a `union` since error
  // messages are a bit confusing.
  //
  // Doing manual validation allows us to use the "concrete" type of each supported acounts giving
  // use a much nicer message from `superstruct`.
  'InvocationStruct',
  (value: unknown) => {
    // This will also raise if `value` does not match any of the supported account types!
    const account = mask(value, BaseInvocationStruct);

    // At this point, we know that `value.type` can be used as an index for `KeyringAccountStructs`
    const [error] = validate(value, InvocationStructs[account.type] as Struct);

    return error ?? true;
  },
);

export const UniversalDetailsStruct = object({
  nonce: optional(any()),
  blockIdentifier: optional(any()),
  maxFee: optional(any()),
  tip: optional(any()),
  paymasterData: optional(array(any())),
  accountDeploymentData: optional(array(any())),
  nonceDataAvailabilityMode: optional(any()),
  feeDataAvailabilityMode: optional(any()),
  version: optional(TxVersionStruct),
  resourceBounds: optional(any()),
  skipValidate: optional(boolean()),
});
