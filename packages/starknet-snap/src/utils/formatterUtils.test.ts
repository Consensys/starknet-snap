import { mapDeprecatedParams } from './formatterUtils'; // replace 'yourModule' with the actual module path

describe('mapDeprecatedParams', () => {
  it('should map deprecated parameters to their new equivalents', () => {
    const requestParams = {
      signerAddress: '0x123',
      txnInvocation: 'invoke',
    };
    const mappings = {
      signerAddress: 'address',
      txnInvocation: 'calls',
    };

    const expected = {
      address: '0x123',
      calls: 'invoke',
    };

    mapDeprecatedParams(requestParams, mappings);

    expect(requestParams).toStrictEqual(expected);
  });

  it('should remove deprecated parameters after mapping', () => {
    const requestParams = {
      signerAddress: '0x123',
      txnInvocation: 'invoke',
    };
    const mappings = {
      signerAddress: 'address',
      txnInvocation: 'calls',
    };

    mapDeprecatedParams(requestParams, mappings);

    expect(requestParams).not.toHaveProperty('signerAddress');
    expect(requestParams).not.toHaveProperty('txnInvocation');
  });

  it('should not map if deprecated parameter does not exist', () => {
    const requestParams = {
      otherParam: 'value',
    };
    const mappings = {
      signerAddress: 'address',
    };

    const expected = { otherParam: 'value' };

    mapDeprecatedParams(requestParams, mappings);

    expect(requestParams).toStrictEqual(expected);
  });

  it('should handle empty mappings correctly', () => {
    const requestParams = {
      signerAddress: '0x123',
    };
    const mappings = {};

    const expected = { signerAddress: '0x123' };

    mapDeprecatedParams(requestParams, mappings);

    expect(requestParams).toStrictEqual(expected);
  });
});
