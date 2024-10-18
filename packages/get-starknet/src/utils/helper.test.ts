import { formatCalls } from './helper';

describe('formatCalls', () => {
  it('converts Call (GetStarknet format) to Call (starknet.js format)', () => {
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

  it('leaves Call unchanged if already in correct starknet.js format', () => {
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

  it('leaves calldata undefined if undefined in Call', () => {
    const calls = [
      { contractAddress: '0xdef', entrypoint: 'approve' }, // no calldata
    ];

    const expected = [
      { contractAddress: '0xdef', entrypoint: 'approve', calldata: undefined }, // empty calldata
    ];

    const result = formatCalls(calls);

    expect(result).toStrictEqual(expected);
  });
});
