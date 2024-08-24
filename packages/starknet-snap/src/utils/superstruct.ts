import { union } from '@metamask/snaps-sdk';
import { constants, validateAndParseAddress } from 'starknet';
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
  dynamic,
  assign,
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

export const CairoVersionStruct = enums([CAIRO_VERSION, CAIRO_VERSION_LEGACY]);

export const TxVersionStruct = enums(
  Object.values(constants.TRANSACTION_VERSION),
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
