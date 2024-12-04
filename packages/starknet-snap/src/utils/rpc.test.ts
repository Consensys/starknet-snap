import { object } from 'superstruct';
import type { Struct } from 'superstruct';

import { InvalidRequestParamsError, UnknownError } from './exceptions';
import { validateRequest, validateResponse } from './rpc';
import { AddressStruct } from './superstruct';

jest.mock('./logger');

const validateStruct = object({
  signerAddress: AddressStruct,
});

const validateParam = {
  signerAddress:
    '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
};

describe('validateRequest', () => {
  it('does not throw error if the request is valid', () => {
    expect(() =>
      validateRequest(validateParam, validateStruct as unknown as Struct),
    ).not.toThrow();
  });

  it('throws `InvalidRequestParamsError` if the request is invalid', () => {
    const requestParams = {
      signerAddress: 1234,
    };

    expect(() =>
      validateRequest(requestParams, validateStruct as unknown as Struct),
    ).toThrow(InvalidRequestParamsError);
  });
});

describe('validateResponse', () => {
  it('does not throw error if the response is valid', () => {
    expect(() =>
      validateResponse(validateParam, validateStruct as unknown as Struct),
    ).not.toThrow();
  });

  it('throws `Invalid Response` error if the response is invalid', () => {
    const response = {
      signerAddress: 1234,
    };

    expect(() =>
      validateResponse(response, validateStruct as unknown as Struct),
    ).toThrow(new UnknownError('Invalid Response'));
  });
});
