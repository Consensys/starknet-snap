import { mapDeprecatedParams, formatCalls } from './formatterUtils';

describe('mapDeprecatedParams', () => {
  it('maps deprecated parameters to their new equivalents', () => {
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

  it('removes the deprecated parameter after mapping', () => {
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

  it('does nothing if the deprecated parameter does not exist', () => {
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

  it('does nothing if the mapping is empty', () => {
    const requestParams = {
      signerAddress: '0x123',
    };
    const mappings = {};

    const expected = { signerAddress: '0x123' };

    mapDeprecatedParams(requestParams, mappings);

    expect(requestParams).toStrictEqual(expected);
  });
});

describe('formatCalls', () => {
  it('converts CallGetStarknetV4 to Call', () => {
    const calls = [
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        contract_address: '0xabc',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        entry_point: 'transfer',
        calldata: ['0x1', '0x2'],
      },
    ];

    const expected = [
      {
        contractAddress: '0xabc',
        entrypoint: 'transfer',
        calldata: ['0x1', '0x2'],
      },
    ];

    const result = formatCalls(calls);

    expect(result).toStrictEqual(expected);
  });

  it('leaves Call unchanged if already in correct format', () => {
    const calls = [
      {
        contractAddress: '0xdef',
        entrypoint: 'approve',
        calldata: ['0x3', '0x4'],
      },
    ];

    const expected = [
      {
        contractAddress: '0xdef',
        entrypoint: 'approve',
        calldata: ['0x3', '0x4'],
      },
    ];

    const result = formatCalls(calls);

    expect(result).toStrictEqual(expected);
  });

  it('sets calldata to an empty array if undefined in CallGetStarknetV4', () => {
    const calls = [
      // eslint-disable-next-line @typescript-eslint/naming-convention
      { contract_address: '0xabc', entry_point: 'transfer' }, // no calldata
    ];

    const expected = [
      { contractAddress: '0xabc', entrypoint: 'transfer', calldata: [] }, // empty calldata
    ];

    const result = formatCalls(calls);

    expect(result).toStrictEqual(expected);
  });

  it('sets calldata to an empty array if undefined in Call', () => {
    const calls = [
      { contractAddress: '0xdef', entrypoint: 'approve' }, // no calldata
    ];

    const expected = [
      { contractAddress: '0xdef', entrypoint: 'approve', calldata: [] }, // empty calldata
    ];

    const result = formatCalls(calls);

    expect(result).toStrictEqual(expected);
  });
});
