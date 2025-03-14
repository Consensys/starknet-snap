import { utils } from 'ethers';
import type { Abi, UniversalDetails, constants } from 'starknet';
import type { Infer } from 'superstruct';

import { type DeclareContractPayloadStruct } from '../utils';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
  UnknownError,
} from '../utils/exceptions';
import { loadLocale } from '../utils/locale';
import * as starknetUtils from '../utils/starknetUtils';
import {
  buildDividerComponent,
  buildNetworkComponent,
  buildRowComponent,
  buildSignerComponent,
  generateRandomFee,
  mockConfirmDialog,
  setupAccountController,
} from './__tests__/helper';
import { declareContract } from './declare-contract';
import type {
  DeclareContractParams,
  DeclareContractResponse,
} from './declare-contract';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

type DeclareContractPayload = Infer<typeof DeclareContractPayloadStruct>;

// Helper function to generate the expected DeclareContractPayload
const generateExpectedDeclareTransactionPayload =
  (): DeclareContractPayload => ({
    compiledClassHash: '0xcompiledClassHash',
    classHash: '0xclassHash',
    contract: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      sierra_program: ['0x1', '0x2'],
      // eslint-disable-next-line @typescript-eslint/naming-convention
      contract_class_version: '1.0.0',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      entry_points_by_type: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        CONSTRUCTOR: [{ selector: '0xconstructorSelector', function_idx: 0 }],
        // eslint-disable-next-line @typescript-eslint/naming-convention
        EXTERNAL: [{ selector: '0xexternalSelector', function_idx: 1 }],
        // eslint-disable-next-line @typescript-eslint/naming-convention
        L1_HANDLER: [{ selector: '0xhandlerSelector', function_idx: 2 }],
      },
      abi: '[{"type":"function","name":"transfer"}]' as unknown as Abi,
    },
  });

describe('DeclareContractRpc', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupDeclareContractTest = async (
    transactionHash: string,
    payload: DeclareContractPayload,
    details: UniversalDetails,
  ) => {
    await loadLocale();
    const { confirmDialogSpy } = mockConfirmDialog();

    const { account } = await setupAccountController({});

    const request = {
      chainId: network.chainId as unknown as constants.StarknetChainId,
      address: account.address,
      payload,
      details,
    };

    const declareContractMockResp: DeclareContractResponse = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      transaction_hash: transactionHash,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      class_hash: '0x123456789abcdef',
    };

    const declareContractUtilSpy = jest.spyOn(starknetUtils, 'declareContract');
    declareContractUtilSpy.mockResolvedValue(declareContractMockResp);

    return {
      account,
      request,
      confirmDialogSpy,
      declareContractMockResp,
      declareContractUtilSpy,
    };
  };

  it('declares a contract correctly if user confirms the dialog', async () => {
    const payload = generateExpectedDeclareTransactionPayload();
    const details = {
      maxFee: generateRandomFee('1000000000000000', '2000000000000000'),
    };
    const transactionHash = '0x123';

    const {
      account,
      request,
      declareContractMockResp,
      confirmDialogSpy,
      declareContractUtilSpy,
    } = await setupDeclareContractTest(transactionHash, payload, details);

    confirmDialogSpy.mockResolvedValue(true);

    const result = await declareContract.execute(request);

    expect(result).toStrictEqual(declareContractMockResp);
    expect(declareContractUtilSpy).toHaveBeenCalledWith(
      network,
      account.address,
      account.privateKey,
      request.payload,
      request.details,
    );
  });

  it('throws UserRejectedOpError if user cancels the dialog', async () => {
    const payload = generateExpectedDeclareTransactionPayload();
    const details = {
      maxFee: generateRandomFee('1000000000000000', '2000000000000000'),
    };
    const transactionHash =
      '0x07f901c023bac6c874691244c4c2332c6825b916fb68d240c807c6156db84fd3';

    const { request, confirmDialogSpy } = await setupDeclareContractTest(
      transactionHash,
      payload,
      details,
    );
    confirmDialogSpy.mockResolvedValue(false);

    await expect(declareContract.execute(request)).rejects.toThrow(
      UserRejectedOpError,
    );
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      declareContract.execute({} as unknown as DeclareContractParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });

  it.each([
    {
      testCase: 'class_hash is missing',
      declareContractMockResp: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        transaction_hash: '0x123',
      },
    },
    {
      testCase: 'transaction_hash is missing',
      declareContractMockResp: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        class_hash: '0x123456789abcdef',
      },
    },
    {
      testCase: 'empty object is returned',
      declareContractMockResp: {},
    },
  ])(
    'throws `Unknown Error` when $testCase',
    async ({ declareContractMockResp }) => {
      const payload = generateExpectedDeclareTransactionPayload();
      const details = {
        maxFee: generateRandomFee('1000000000000000', '2000000000000000'),
      };
      const transactionHash = '0x123';

      const { request, declareContractUtilSpy } =
        await setupDeclareContractTest(transactionHash, payload, details);

      declareContractUtilSpy.mockResolvedValue(
        declareContractMockResp as unknown as DeclareContractResponse,
      );

      await expect(declareContract.execute(request)).rejects.toThrow(
        UnknownError,
      );
    },
  );

  it('renders confirmation dialog', async () => {
    const payload = generateExpectedDeclareTransactionPayload();
    const details = {
      maxFee: generateRandomFee('1000000000000000', '2000000000000000'),
    };
    // Convert maxFee to ETH from Wei
    const maxFeeInEth = utils.formatUnits(details.maxFee, 'ether');
    const transactionHash = '0x123';

    const { request, confirmDialogSpy, account } =
      await setupDeclareContractTest(transactionHash, payload, details);

    await declareContract.execute(request);

    expect(confirmDialogSpy).toHaveBeenCalledWith([
      {
        type: 'heading',
        value: 'Do you want to sign this transaction?',
      },
      buildSignerComponent(account.address, network.chainId),
      buildDividerComponent(),
      buildNetworkComponent(network.name),
      buildDividerComponent(),
      buildRowComponent('Compiled Class Hash', payload.compiledClassHash ?? ''),
      buildDividerComponent(),
      buildRowComponent('Class Hash', payload.classHash ?? ''),
      buildDividerComponent(),
      buildRowComponent('Max Fee (ETH)', maxFeeInEth),
    ]);
  });
});
