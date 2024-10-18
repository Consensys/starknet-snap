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

/* eslint-disable @typescript-eslint/naming-convention */
describe('formatDeclareTransaction', () => {
  // Helper function to generate the declare contract test params
  const generateDeclareTransactionParams = ({
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

  // Helper function to generate the expected result of the declare transaction
  const generateExpectedDeclareTransactionPayload = ({
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

  it('converts the `AddDeclareTransactionParameters` object to the expected format', () => {
    const params = generateDeclareTransactionParams();
    const expected = generateExpectedDeclareTransactionPayload();

    const result = formatDeclareTransaction(params);

    expect(result).toStrictEqual(expected);
  });

  it('remains `class_hash` undefined if it is undefined', () => {
    const params = generateDeclareTransactionParams({ classHash: undefined });
    const expected = generateExpectedDeclareTransactionPayload({ classHash: undefined });

    const result = formatDeclareTransaction(params);

    expect(result).toStrictEqual(expected);
  });

  // Test each entry point property individually when empty
  it.each([
    {
      entryType: 'CONSTRUCTOR',
      entryPointsConstructor: [],
      entryPointsExternal: [{ selector: '0xexternalSelector', function_idx: 1 }],
      entryPointsL1Handler: [{ selector: '0xhandlerSelector', function_idx: 2 }],
    },
    {
      entryType: 'EXTERNAL',
      entryPointsConstructor: [{ selector: '0xconstructorSelector', function_idx: 0 }],
      entryPointsExternal: [],
      entryPointsL1Handler: [{ selector: '0xhandlerSelector', function_idx: 2 }],
    },
    {
      entryType: 'L1_HANDLER',
      entryPointsConstructor: [{ selector: '0xconstructorSelector', function_idx: 0 }],
      entryPointsExternal: [{ selector: '0xexternalSelector', function_idx: 1 }],
      entryPointsL1Handler: [],
    },
  ])('handles empty $entryType correctly', ({ entryPointsConstructor, entryPointsExternal, entryPointsL1Handler }) => {
    const params = generateDeclareTransactionParams({
      entryPointsConstructor,
      entryPointsExternal,
      entryPointsL1Handler,
      abi: '[]', // empty ABI string
    });

    const expected = generateExpectedDeclareTransactionPayload({
      entryPointsConstructor,
      entryPointsExternal,
      entryPointsL1Handler,
      abi: '[]', // empty ABI string
    });

    const result = formatDeclareTransaction(params);

    expect(result).toStrictEqual(expected);
  });
});
