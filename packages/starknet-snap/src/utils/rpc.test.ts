import { InvalidParamsError, SnapError } from '@metamask/snaps-sdk';
import { object } from 'superstruct';
import type { Struct } from 'superstruct';

import { validateRequest, validateResponse } from './rpc';
import { AddressStruct } from './superstruct';

const struct = object({
  signerAddress: AddressStruct,
});

const params = {
  signerAddress:
    '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
};

describe('validateRequest', () => {
  it('does not throw error if the request is valid', () => {
    expect(() =>
      validateRequest(params, struct as unknown as Struct),
    ).not.toThrow();
  });

  it('throws `InvalidParamsError` if the request is invalid', () => {
    const requestParams = {
      signerAddress: 1234,
    };

    expect(() =>
      validateRequest(requestParams, struct as unknown as Struct),
    ).toThrow(InvalidParamsError);
  });
});

describe('validateResponse', () => {
  it('does not throw error if the response is valid', () => {
    expect(() =>
      validateResponse(params, struct as unknown as Struct),
    ).not.toThrow();
  });

  it('throws `Invalid Response` error if the response is invalid', () => {
    const response = {
      signerAddress: 1234,
    };

    expect(() =>
      validateResponse(response, struct as unknown as Struct),
    ).toThrow(new SnapError('Invalid Response'));
  });
});
