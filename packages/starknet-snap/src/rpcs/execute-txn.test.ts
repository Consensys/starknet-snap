import type { Call } from 'starknet';
import { constants, TransactionType } from 'starknet';
import { v4 as uuidv4 } from 'uuid';

import callsExamples from '../__tests__/fixture/callsExamples.json';
import { mockTransactionRequestStateManager } from '../state/__tests__/helper';
import { AccountStateManager } from '../state/account-state-manager';
import { TransactionStateManager } from '../state/transaction-state-manager';
import { FeeToken } from '../types/snapApi';
import type {
  FormattedCallData,
  Network,
  TransactionRequest,
} from '../types/snapState';
import * as uiUtils from '../ui/utils';
import {
  CAIRO_VERSION,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
} from '../utils/exceptions';
import * as formatUtils from '../utils/formatter-utils';
import * as starknetUtils from '../utils/starknetUtils';
import {
  feeTokenToTransactionVersion,
  newDeployTransaction as newDeployTransactionFn,
  newInvokeTransaction as newInvokeTransactionFn,
  transactionVersionToFeeToken,
  transactionVersionToNumber,
} from '../utils/transaction';
import {
  mockGetEstimatedFeesResponse,
  mockConfirmDialogInteractiveUI,
  setupAccountController,
} from './__tests__/helper';
import type {
  ConfirmTransactionParams,
  DeployAccountParams,
  ExecuteTxnParams,
  SaveDataToStateParamas,
  SendTransactionParams,
} from './execute-txn';
import { executeTxn, ExecuteTxnRpc } from './execute-txn';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

/* eslint-disable @typescript-eslint/naming-convention */
class MockExecuteTxnRpc extends ExecuteTxnRpc {
  public async confirmTransaction(
    arg: ConfirmTransactionParams,
  ): Promise<TransactionRequest> {
    return super.confirmTransaction(arg);
  }

  public async preExecute(arg: ExecuteTxnParams): Promise<void> {
    await super.preExecute(arg);
  }

  public async deployAccount(arg: DeployAccountParams): Promise<string> {
    return super.deployAccount(arg);
  }

  public async sendTransaction(arg: SendTransactionParams): Promise<string> {
    return super.sendTransaction(arg);
  }

  public async saveDataToState(arg: SaveDataToStateParamas): Promise<void> {
    return super.saveDataToState(arg);
  }
}

const createMockRpc = () => {
  const rpc = new MockExecuteTxnRpc({
    showInvalidAccountAlert: true,
  });
  return rpc;
};

const setupMockRpc = async (network: Network, calls: Call[]) => {
  const { account } = await setupAccountController({ network });

  const rpc = createMockRpc();

  // Setup the rpc, to discover the account and network
  await rpc.preExecute({
    chainId: network.chainId,
    address: account.address,
    calls,
  } as unknown as ExecuteTxnParams);

  return {
    rpc,
    account,
  };
};

const mockCallToTransactionReqCall = (calls: Call[]) => {
  const callToTransactionReqCallSpy = jest.spyOn(
    formatUtils,
    'callToTransactionReqCall',
  );
  const formattedCalls: FormattedCallData[] = [];
  for (const call of calls) {
    formattedCalls.push({
      contractAddress: call.contractAddress,
      calldata: call.calldata as unknown as string[],
      entrypoint: call.entrypoint,
    });
    callToTransactionReqCallSpy.mockResolvedValueOnce(
      formattedCalls[formattedCalls.length - 1],
    );
  }
  return {
    callToTransactionReqCallSpy,
    formattedCalls,
  };
};

const mockGenerateExecuteTxnFlow = () => {
  const generateExecuteTxnFlowSpy = jest.spyOn(
    uiUtils,
    'generateExecuteTxnFlow',
  );
  const interfaceId = uuidv4();
  generateExecuteTxnFlowSpy.mockResolvedValue(interfaceId);
  return {
    interfaceId,
    generateExecuteTxnFlowSpy,
  };
};

describe('ExecuteTxn', () => {
  describe('confirmTransaction', () => {
    const setupConfirmTransactionTest = async (confirm = true) => {
      const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
      const includeDeploy = true;
      const txnVersion = constants.TRANSACTION_VERSION.V3;
      const { calls } = callsExamples.multipleCalls;

      const { account, rpc } = await setupMockRpc(network, calls);
      const {
        getEstimatedFeesResponse: { suggestedMaxFee: maxFee, resourceBounds },
      } = mockGetEstimatedFeesResponse({
        includeDeploy: false,
      });

      const request = {
        calls,
        address: account.address,
        maxFee,
        resourceBounds,
        txnVersion,
        includeDeploy,
      };

      const { formattedCalls } = mockCallToTransactionReqCall(calls);
      const { interfaceId } = mockGenerateExecuteTxnFlow();
      const txnMgrMocks = mockTransactionRequestStateManager();

      const transactionRequest = {
        chainId: network.chainId,
        networkName: network.name,
        id: uuidv4(),
        interfaceId,
        type: TransactionType.INVOKE,
        signer: account.address,
        addressIndex: 0,
        maxFee,
        calls: formattedCalls,
        resourceBounds,
        selectedFeeToken: transactionVersionToFeeToken(txnVersion),
        includeDeploy,
      };
      txnMgrMocks.getTransactionRequestSpy.mockResolvedValue(
        transactionRequest,
      );

      return {
        request,
        rpc,
        transactionRequest,
        interfaceId,
        ...mockConfirmDialogInteractiveUI(confirm),
        ...txnMgrMocks,
      };
    };

    it('returns the `TransactionRequest` object and remove it from state', async () => {
      const {
        request,
        rpc,
        interfaceId,
        transactionRequest,
        upsertTransactionRequestSpy,
        confirmDialogSpy,
        getTransactionRequestSpy,
        removeTransactionRequestSpy,
      } = await setupConfirmTransactionTest();

      const expectedTransactionRequest = {
        ...transactionRequest,
        id: expect.any(String),
      };

      const result = await rpc.confirmTransaction(request);

      expect(result).toStrictEqual(expectedTransactionRequest);
      expect(upsertTransactionRequestSpy).toHaveBeenCalledWith(
        expectedTransactionRequest,
      );
      expect(confirmDialogSpy).toHaveBeenCalledWith(interfaceId);
      expect(getTransactionRequestSpy).toHaveBeenCalledWith({
        requestId: expect.any(String),
      });
      expect(removeTransactionRequestSpy).toHaveBeenCalledWith(
        expect.any(String),
      );
    });

    it('does not throw an error if remove request failed', async () => {
      const { request, rpc, removeTransactionRequestSpy } =
        await setupConfirmTransactionTest();

      removeTransactionRequestSpy.mockRejectedValue(
        new Error('Failed to remove request'),
      );

      // if any error occurs, it should not throw an error
      await rpc.confirmTransaction(request);

      expect(removeTransactionRequestSpy).toHaveBeenCalled();
    });

    it("throws `Failed to retrieve the updated transaction request` error if the transaction request can't be found after updated.", async () => {
      const {
        request,
        rpc,
        getTransactionRequestSpy,
        removeTransactionRequestSpy,
      } = await setupConfirmTransactionTest();

      getTransactionRequestSpy.mockResolvedValue(null);

      await expect(rpc.confirmTransaction(request)).rejects.toThrow(
        'Failed to retrieve the updated transaction request',
      );

      expect(removeTransactionRequestSpy).toHaveBeenCalledWith(
        expect.any(String),
      );
    });

    it('throws UserRejectedOpError if user denied the operation', async () => {
      const { request, rpc } = await setupConfirmTransactionTest(false);

      await expect(rpc.confirmTransaction(request)).rejects.toThrow(
        UserRejectedOpError,
      );
    });
  });

  describe('deployAccount', () => {
    const setupDeployAccountTest = async () => {
      const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
      const txnVersion = constants.TRANSACTION_VERSION.V3;
      const { calls } = callsExamples.multipleCalls;
      const { account, rpc } = await setupMockRpc(network, calls);

      const deployAccountSpy = jest.spyOn(starknetUtils, 'deployAccount');
      const deployAccountResponse = {
        contract_address: account.address,
        transaction_hash: callsExamples.multipleCalls.hash,
      };
      deployAccountSpy.mockResolvedValue(deployAccountResponse);

      const request = {
        address: account.address,
        txnVersion,
      };

      const accountDeploymentData = starknetUtils.getDeployAccountCallData(
        account.publicKey,
        CAIRO_VERSION,
      );

      return {
        accountDeploymentData,
        request,
        rpc,
        network,
        account,
        deployAccountSpy,
        deployAccountResponse,
      };
    };

    it('deploys an account', async () => {
      const {
        rpc,
        request,
        network,
        account: { address, privateKey, publicKey },
        deployAccountResponse,
        deployAccountSpy,
        accountDeploymentData,
      } = await setupDeployAccountTest();

      const result = await rpc.deployAccount(request);

      expect(result).toStrictEqual(deployAccountResponse.transaction_hash);
      expect(deployAccountSpy).toHaveBeenCalledWith(
        network,
        address,
        accountDeploymentData,
        publicKey,
        privateKey,
        CAIRO_VERSION,
      );
    });

    it('throws `Failed to deploy account` error if the execution transaction hash is empty', async () => {
      const { rpc, request, deployAccountSpy, deployAccountResponse } =
        await setupDeployAccountTest();
      deployAccountSpy.mockResolvedValue({
        ...deployAccountResponse,
        transaction_hash: '',
      });

      await expect(rpc.deployAccount(request)).rejects.toThrow(
        'Failed to deploy account',
      );
    });
  });

  describe('sendTransaction', () => {
    const setupConfirmTransactionTest = async () => {
      const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
      const txnVersion = constants.TRANSACTION_VERSION.V3;
      const { calls } = callsExamples.multipleCalls;

      const { account, rpc } = await setupMockRpc(network, calls);

      const executeTxnSpy = jest.spyOn(starknetUtils, 'executeTxn');
      const executeTxnResponse = {
        transaction_hash: callsExamples.multipleCalls.hash,
      };
      executeTxnSpy.mockResolvedValue(executeTxnResponse);

      const request: SendTransactionParams = {
        calls,
        address: account.address,
        abis: undefined,
        details: {
          version: txnVersion,
        },
      };

      return {
        request,
        rpc,
        network,
        account,
        executeTxnSpy,
        executeTxnResponse,
      };
    };

    it('execute a transaction and return the transaction hash', async () => {
      const {
        rpc,
        request,
        network,
        account: { privateKey },
        executeTxnResponse,
        executeTxnSpy,
      } = await setupConfirmTransactionTest();

      const result = await rpc.sendTransaction(request);

      expect(result).toStrictEqual(executeTxnResponse.transaction_hash);
      expect(executeTxnSpy).toHaveBeenCalledWith(
        network,
        request.address,
        privateKey,
        request.calls,
        request.abis,
        request.details,
      );
    });

    it('throws `Failed to execute transaction` error if the execution transaction hash is empty', async () => {
      const { rpc, request, executeTxnSpy } =
        await setupConfirmTransactionTest();
      executeTxnSpy.mockResolvedValue({ transaction_hash: '' });

      await expect(rpc.sendTransaction(request)).rejects.toThrow(
        'Failed to execute transaction',
      );
    });
  });

  describe('execute', () => {
    const setupExecuteTest = async (accountDeployed = true) => {
      const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
      const { account } = await setupAccountController({ network });

      const { getEstimatedFeesResponse, getEstimatedFeesSpy } =
        mockGetEstimatedFeesResponse({
          includeDeploy: !accountDeployed,
        });
      const { suggestedMaxFee, resourceBounds } = getEstimatedFeesResponse;

      const confirmTransactionSpy = jest.spyOn(
        MockExecuteTxnRpc.prototype,
        'confirmTransaction',
      );
      const transactionRequest = {
        selectedFeeToken: FeeToken.STRK,
        maxFee: suggestedMaxFee,
        resourceBounds,
      } as unknown as TransactionRequest;
      confirmTransactionSpy.mockResolvedValue(transactionRequest);

      const sendTansactionResponse = callsExamples.multipleCalls.hash;
      const sendTransactionSpy = jest.spyOn(
        MockExecuteTxnRpc.prototype,
        'sendTransaction',
      );
      sendTransactionSpy.mockResolvedValue(sendTansactionResponse);

      const deployAccountResponse = callsExamples.singleCall.hash;
      const deployAccountSpy = jest.spyOn(
        MockExecuteTxnRpc.prototype,
        'deployAccount',
      );
      deployAccountSpy.mockResolvedValue(deployAccountResponse);

      const saveDataToStateSpy = jest.spyOn(
        MockExecuteTxnRpc.prototype,
        'saveDataToState',
      );
      saveDataToStateSpy.mockReturnThis();

      const rpc = createMockRpc();
      const request: ExecuteTxnParams = {
        chainId: network.chainId,
        address: account.address,
        calls: callsExamples.multipleCalls.calls,
        details: callsExamples.multipleCalls.details,
      } as unknown as ExecuteTxnParams;

      return {
        rpc,
        account,
        request,
        network,
        getEstimatedFeesSpy,
        getEstimatedFeesResponse,
        confirmTransactionSpy,
        sendTransactionSpy,
        transactionRequest,
        deployAccountResponse,
        sendTansactionResponse,
        deployAccountSpy,
        saveDataToStateSpy,
      };
    };

    it('executes a transaction and return the transaction hash', async () => {
      const {
        rpc,
        request,
        sendTansactionResponse,
        sendTransactionSpy,
        account: { address },
        getEstimatedFeesResponse,
        confirmTransactionSpy,
        deployAccountSpy,
        saveDataToStateSpy,
        transactionRequest,
      } = await setupExecuteTest();
      const updatedTxnVersion = feeTokenToTransactionVersion(
        transactionRequest.selectedFeeToken,
      );
      const { maxFee: updatedMaxFee, resourceBounds: updatedResourceBounds } =
        transactionRequest;
      const {
        suggestedMaxFee: maxFee,
        resourceBounds,
        includeDeploy,
      } = getEstimatedFeesResponse;
      const { calls, abis, details } = request;

      const result = await rpc.execute(request);

      expect(result).toStrictEqual({
        transaction_hash: sendTansactionResponse,
      });
      expect(confirmTransactionSpy).toHaveBeenCalledWith({
        address,
        calls,
        maxFee,
        resourceBounds,
        includeDeploy,
      });
      expect(deployAccountSpy).not.toHaveBeenCalled();
      expect(sendTransactionSpy).toHaveBeenCalledWith({
        address,
        calls,
        abis,
        details: {
          ...details,
          version: updatedTxnVersion,
          maxFee: updatedMaxFee,
          resourceBounds: updatedResourceBounds,
        },
      });
      expect(saveDataToStateSpy).toHaveBeenCalledWith({
        txnHashForDeploy: undefined,
        txnHashForExecute: sendTansactionResponse,
        maxFee: updatedMaxFee,
        address,
        calls,
      });
    });

    it('executes a transaction and return the transaction hash with deploy account', async () => {
      const {
        rpc,
        request,
        sendTansactionResponse,
        account: { address },
        deployAccountResponse,
        deployAccountSpy,
        saveDataToStateSpy,
        transactionRequest,
        sendTransactionSpy,
      } = await setupExecuteTest(false);
      const updatedTxnVersion = feeTokenToTransactionVersion(
        transactionRequest.selectedFeeToken,
      );
      const { maxFee: updatedMaxFee, resourceBounds: updatedResourceBounds } =
        transactionRequest;
      const { calls, details } = request;

      const result = await rpc.execute(request);

      expect(result).toStrictEqual({
        transaction_hash: sendTansactionResponse,
      });
      expect(deployAccountSpy).toHaveBeenCalledWith({
        address,
      });
      expect(sendTransactionSpy).toHaveBeenCalledWith({
        address,
        calls,
        details: {
          ...details,
          nonce: 1,
          version: updatedTxnVersion,
          maxFee: updatedMaxFee,
          resourceBounds: updatedResourceBounds,
        },
      });
      expect(saveDataToStateSpy).toHaveBeenCalledWith({
        txnHashForDeploy: deployAccountResponse,
        txnHashForExecute: sendTansactionResponse,
        maxFee: updatedMaxFee,
        address,
        calls,
      });
    });
  });

  describe('saveDataToState', () => {
    const setupSaveDataToStateTest = async () => {
      const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
      const txnVersion = constants.TRANSACTION_VERSION.V3;
      const { hash: txnHashForExecute, calls } = callsExamples.multipleCalls;
      const { hash: txnHashForDeploy } = callsExamples.singleCall;

      const { rpc, account } = await setupMockRpc(network, calls);
      const {
        getEstimatedFeesResponse: { suggestedMaxFee: maxFee },
      } = mockGetEstimatedFeesResponse({
        includeDeploy: false,
      });

      const addTransactionSpy = jest.spyOn(
        TransactionStateManager.prototype,
        'addTransaction',
      );
      addTransactionSpy.mockReturnThis();

      const updateAccountAsDeploySpy = jest.spyOn(
        AccountStateManager.prototype,
        'updateAccountAsDeploy',
      );
      updateAccountAsDeploySpy.mockReturnThis();

      const request: SaveDataToStateParamas = {
        txnHashForDeploy,
        txnHashForExecute,
        txnVersion,
        maxFee,
        address: account.address,
        calls,
      } as unknown as SaveDataToStateParamas;

      const newInvokeTransaction = newInvokeTransactionFn({
        senderAddress: account.address,
        txnHash: request.txnHashForExecute,
        chainId: network.chainId,
        maxFee,
        txnVersion: transactionVersionToNumber(txnVersion),
        calls,
      });
      const newDeployTransaction = newDeployTransactionFn({
        senderAddress: account.address,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        txnHash: request.txnHashForDeploy!,
        chainId: network.chainId,
        txnVersion: transactionVersionToNumber(txnVersion),
      });

      return {
        rpc,
        account,
        request,
        network,
        newInvokeTransaction,
        newDeployTransaction,
        addTransactionSpy,
        updateAccountAsDeploySpy,
      };
    };

    it('saves a invoke transaction if `txnHashForDeploy` has not given', async () => {
      const {
        rpc,
        request,
        addTransactionSpy,
        updateAccountAsDeploySpy,
        newInvokeTransaction,
      } = await setupSaveDataToStateTest();

      await rpc.saveDataToState({
        ...request,
        txnHashForDeploy: undefined,
      });

      expect(addTransactionSpy).toHaveBeenCalledWith(newInvokeTransaction);
      expect(updateAccountAsDeploySpy).not.toHaveBeenCalled();
    });

    it('saves a deploy transaction and a invoke transaction', async () => {
      const {
        rpc,
        request,
        addTransactionSpy,
        network: { chainId },
        account: { address },
        updateAccountAsDeploySpy,
        newInvokeTransaction,
        newDeployTransaction,
      } = await setupSaveDataToStateTest();

      await rpc.saveDataToState(request);

      expect(addTransactionSpy).toHaveBeenNthCalledWith(
        1,
        newDeployTransaction,
      );
      expect(addTransactionSpy).toHaveBeenNthCalledWith(
        2,
        newInvokeTransaction,
      );

      expect(updateAccountAsDeploySpy).toHaveBeenCalledWith({
        address,
        chainId,
        transactionHash: newDeployTransaction.txnHash,
      });
    });
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      executeTxn.execute({} as unknown as ExecuteTxnParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});

/* eslint-enable */
