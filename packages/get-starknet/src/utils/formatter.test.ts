import { formatCalls, formatDeclareTransaction } from './formatter';

describe('formatCalls', () => {
  it('converts a list of `Call` objects to the expected format', () => {
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

  it('remains unchanged if the `Call` object is in the expected format', () => {
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

  it('remains `calldata` undefined if it is undefined in the `Call` object', () => {
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

// Helper function to generate the test params
/* eslint-disable @typescript-eslint/naming-convention */
const generateParams = ({
  compiledClassHash = '0xcompiledClassHash',
  classHash = '0xclassHash',
  entryPointsConstructor = [{ selector: '0xconstructorSelector', function_idx: 0 }],
  entryPointsExternal = [{ selector: '0xexternalSelector', function_idx: 1 }],
  entryPointsL1Handler = [{ selector: '0xhandlerSelector', function_idx: 2 }],
  abi = '[{"type":"function","name":"transfer"}]',
} = {}) => ({
  compiled_class_hash: compiledClassHash,
  class_hash: classHash,
  contract_class: {
    sierra_program: ['0x1', '0x2'],
    contract_class_version: '1.0.0',
    entry_points_by_type: {
      CONSTRUCTOR: entryPointsConstructor,
      EXTERNAL: entryPointsExternal,
      L1_HANDLER: entryPointsL1Handler,
    },
    abi,
  },
});

// Helper function to generate the expected result
const generateExpected = ({
  compiledClassHash = '0xcompiledClassHash',
  classHash = '0xclassHash',
  entryPointsConstructor = [{ selector: '0xconstructorSelector', function_idx: 0 }],
  entryPointsExternal = [{ selector: '0xexternalSelector', function_idx: 1 }],
  entryPointsL1Handler = [{ selector: '0xhandlerSelector', function_idx: 2 }],
  abi = '[{"type":"function","name":"transfer"}]',
} = {}) => ({
  compiledClassHash,
  classHash,
  contract: {
    sierra_program: ['0x1', '0x2'],
    contract_class_version: '1.0.0',
    entry_points_by_type: {
      CONSTRUCTOR: entryPointsConstructor,
      EXTERNAL: entryPointsExternal,
      L1_HANDLER: entryPointsL1Handler,
    },
    abi,
  },
});
/* eslint-enable @typescript-eslint/naming-convention */

describe('formatDeclareTransaction', () => {
  it('converts AddDeclareTransactionParameters to DeclareContractPayload format', () => {
    const params = generateParams();
    const expected = generateExpected();

    const result = formatDeclareTransaction(params);

    expect(result).toStrictEqual(expected);
  });

  it('handles missing optional class_hash correctly', () => {
    const params = generateParams({ classHash: undefined });
    const expected = generateExpected({ classHash: undefined });

    const result = formatDeclareTransaction(params);

    expect(result).toStrictEqual(expected);
  });

  it('handles empty entry_points_by_type correctly', () => {
    const params = generateParams({
      entryPointsConstructor: [],
      entryPointsExternal: [],
      entryPointsL1Handler: [],
      abi: '[]', // empty ABI string
    });

    const expected = generateExpected({
      entryPointsConstructor: [],
      entryPointsExternal: [],
      entryPointsL1Handler: [],
      abi: '[]', // empty ABI string
    });

    const result = formatDeclareTransaction(params);

    expect(result).toStrictEqual(expected);
  });
});
