import { BigNumber, utils } from 'ethers';
import type { Abi } from 'starknet';
import { constants } from 'starknet';
import type { Infer } from 'superstruct';

import { toJson, type DeclareContractPayloadStruct } from '../utils';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
  UnknownError,
} from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import {
  mockAccount,
  prepareConfirmDialog,
  prepareMockAccount,
} from './__tests__/helper';
import { declareContract } from './declare-contract';
import type { DeclareContractResponse } from './declare-contract';

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

const prepareMockDeclareContract = async (
  transactionHash: string,
  payload: DeclareContractPayload,
  details: UniversalDetails
) => {
  const state = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };
  const { confirmDialogSpy } = prepareConfirmDialog();

  const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
  prepareMockAccount(account, state);

  const request = {
    chainId: state.networks[0].chainId as unknown as constants.StarknetChainId,
    address: account.address,
    payload,
    details,
  };

  const declareContractRespMock: DeclareContractResponse = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_hash: transactionHash,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    class_hash: '0x123456789abcdef',
  };

  const declareContractUtilSpy = jest.spyOn(starknetUtils, 'declareContract');
  declareContractUtilSpy.mockResolvedValue(declareContractRespMock);

  return {
    network: state.networks[0],
    account,
    request,
    confirmDialogSpy,
    declareContractRespMock,
    declareContractUtilSpy,
  };
};

describe('DeclareContractRpc', () => {
  it('declares a contract correctly if user confirms the dialog', async () => {
    const payload = generateExpectedDeclareTransactionPayload();
    const details = { maxFee: BigNumber.from(1000000000000000).toString() };
    const transactionHash = '0x123';

    const {
      account,
      request,
      declareContractRespMock,
      confirmDialogSpy,
      declareContractUtilSpy,
    } = await prepareMockDeclareContract(transactionHash, payload, details);

    confirmDialogSpy.mockResolvedValue(true);

    const result = await declareContract.execute(request);

    expect(result).toStrictEqual(declareContractRespMock);
    expect(declareContractUtilSpy).toHaveBeenCalledWith(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account.address,
      account.privateKey,
      request.payload,
      request.details,
    );
  });

  it('throws UserRejectedOpError if user cancels the dialog', async () => {
    const payload = generateExpectedDeclareTransactionPayload();
    const details = { maxFee: BigNumber.from(1000000000000000).toString() };
    const transactionHash = '0x07f901c023bac6c874691244c4c2332c6825b916fb68d240c807c6156db84fd3';

    const { request, confirmDialogSpy } = await prepareMockDeclareContract(
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
    await expect(declareContract.execute({} as unknown as DeclareContractParams)).rejects.toThrow(
      InvalidRequestParamsError,
    );
  });

  it.each([
    {
      testCase: 'class_hash is missing',
      declareContractRespMock: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        transaction_hash: '0x123',
      },
    },
    {
      testCase: 'transaction_hash is missing',
      declareContractRespMock: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        class_hash: '0x123456789abcdef',
      },
    },
    {
      testCase: 'empty object is returned',
      declareContractRespMock: {},
    },
  ])(
    'throws `Unknown Error` when $testCase',
    async ({ declareContractRespMock }) => {
      const payload = generateExpectedDeclareTransactionPayload();
      const details = { maxFee: BigNumber.from(1000000000000000).toString() };
      const transactionHash = '0x123';

      const { request, declareContractUtilSpy } =
        await prepareMockDeclareContract(transactionHash, payload, details);

      declareContractUtilSpy.mockResolvedValue(
        declareContractRespMock as unknown as DeclareContractResponse,
      );

      await expect(declareContract.execute(request)).rejects.toThrow(
        UnknownError,
      );
    },
  );

  it('renders confirmation dialog', async () => {
    const payload = generateExpectedDeclareTransactionPayload();
    const details = { maxFee: BigNumber.from(1000000000000000).toString() };
    // Convert maxFee to ETH from Wei
    const maxFeeInEth = utils.formatUnits(details.maxFee, 'ether');
    const transactionHash = '0x123';

    const { request, confirmDialogSpy, account } =
      await prepareMockDeclareContract(transactionHash, payload, details);

    await declareContract.execute(request);

    expect(confirmDialogSpy).toHaveBeenCalledWith([
      {
        type: 'heading',
        value: 'Do you want to sign this transaction?',
      },
      {
        type: 'row',
        label: 'Signer Address',
        value: {
          value: account.address,
          markdown: false,
          type: 'text',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'row',
        label: 'Network',
        value: {
          value: STARKNET_SEPOLIA_TESTNET_NETWORK.name,
          markdown: false,
          type: 'text',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'row',
        label: 'Contract',
        value: {
          value: toJson(payload.contract),
          markdown: false,
          type: 'text',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'row',
        label: 'Compiled Class Hash',
        value: {
          value: payload.compiledClassHash,
          markdown: false,
          type: 'text',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'row',
        label: 'Class Hash',
        value: {
          value: payload.classHash,
          markdown: false,
          type: 'text',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'row',
        label: 'Max Fee (ETH)',
        value: {
          value: maxFeeInEth,
          markdown: false,
          type: 'text',
        },
      },
    ]);
  });
});
