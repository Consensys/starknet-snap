import { union } from '@metamask/snaps-sdk';
import { constants, validateAndParseAddress } from 'starknet';
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

export const NumberStringStruct = union([number(), string()]);

export const CairoVersionStruct = enums([CAIRO_VERSION, CAIRO_VERSION_LEGACY]);

export const TxVersionStruct = enums(
  Object.values(constants.TRANSACTION_VERSION),
);

export const V2TxVersionStruct = enums([
  constants.TRANSACTION_VERSION.V0,
  constants.TRANSACTION_VERSION.V1,
  constants.TRANSACTION_VERSION.V2,
  constants.TRANSACTION_VERSION.F0,
  constants.TRANSACTION_VERSION.F1,
  constants.TRANSACTION_VERSION.F2,
]);

export const V3TxVersionStruct = enums([
  constants.TRANSACTION_VERSION.V3,
  constants.TRANSACTION_VERSION.F3,
]);

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
  version: optional(NumberStringStruct),
  resourceBounds: optional(ResourceBoundMappingStruct),
  tip: optional(NumberStringStruct),
  paymasterData: optional(array(NumberStringStruct)),
  accountDeploymentData: optional(array(NumberStringStruct)),
  nonceDataAvailabilityMode: optional(enums(['L1', 'L2'])),
  feeDataAvailabilityMode: optional(enums(['L1', 'L2'])),
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
    classHash: nonempty(string()),
    compiledClassHash: optional(string()),
    senderAddress: AddressStruct,
    chainId: ChainIdStruct,
    version: TxVersionStruct,
  }),
);
