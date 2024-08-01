import { union } from '@metamask/snaps-sdk';
import { constants, validateAndParseAddress } from 'starknet';
import {
  assert,
  boolean,
  enums,
  object,
  optional,
  record,
  refine,
  string,
  unknown,
  number,
  array,
} from 'superstruct';

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

export const ChainIdStruct = refine(
  string(),
  'ChainIdStruct',
  (value: string) => {
    assert(value, enums(Object.values(constants.StarknetChainId)));
    return true;
  },
);

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
  message: record(string(), unknown()),
});

export const AuthorizableStruct = object({
  enableAuthorize: optional(boolean()),
});

export const BaseRequestStruct = object({
  chainId: ChainIdStruct,
  // TODO: the debug level should be set by snap rather than pass in from request.
  debugLevel: optional(enums(Object.keys(LogLevel))),
});
