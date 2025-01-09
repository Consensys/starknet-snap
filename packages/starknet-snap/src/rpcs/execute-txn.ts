import { type Json } from '@metamask/snaps-sdk';
import type { Call, constants } from 'starknet';
import { TransactionType } from 'starknet';
import type { Infer } from 'superstruct';
import { object, string, assign, optional, any } from 'superstruct';
import { v4 as uuidv4 } from 'uuid';

import { AccountStateManager } from '../state/account-state-manager';
import { TransactionRequestStateManager } from '../state/request-state-manager';
import { TokenStateManager } from '../state/token-state-manager';
import { TransactionStateManager } from '../state/transaction-state-manager';
import type { ResourceBounds, TransactionRequest } from '../types/snapState';
import { generateExecuteTxnFlow } from '../ui/utils';
import {
  AddressStruct,
  BaseRequestStruct,
  UniversalDetailsStruct,
  CallsStruct,
  mapDeprecatedParams,
  createInteractiveConfirmDialog,
  callToTransactionReqCall,
  logger,
} from '../utils';
import { CAIRO_VERSION } from '../utils/constants';
import { UserRejectedOpError } from '../utils/exceptions';
import {
  deployAccount,
  executeTxn as executeTxnUtil,
  getEstimatedFees,
} from '../utils/starknetUtils';
import {
  transactionVersionToNumber,
  feeTokenToTransactionVersion,
  transactionVersionToFeeToken,
  newDeployTransaction,
  newInvokeTransaction,
} from '../utils/transaction';
import type { AccountRpcControllerOptions } from './abstract/account-rpc-controller';
import { AccountRpcController } from './abstract/account-rpc-controller';

export const ExecuteTxnRequestStruct = assign(
  object({
    address: AddressStruct,
    calls: CallsStruct,
    details: optional(UniversalDetailsStruct),
    abis: optional(any()),
  }),
  BaseRequestStruct,
);

export const ExecuteTxnResponseStruct = object({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transaction_hash: string(),
});

export type ExecuteTxnParams = Infer<typeof ExecuteTxnRequestStruct> & Json;

export type ExecuteTxnResponse = Infer<typeof ExecuteTxnResponseStruct>;

export type ConfirmTransactionParams = {
  calls: Call[];
  maxFee: string;
  resourceBounds: ResourceBounds;
  txnVersion: constants.TRANSACTION_VERSION;
};

export type DeployAccountParams = {
  txnVersion: constants.TRANSACTION_VERSION;
};

export type SendTransactionParams = {
  calls: Call[];
  abis?: any[];
  details?: Infer<typeof UniversalDetailsStruct>;
};

export type SaveDataToStateParamas = {
  txnHashForDeploy?: string;
  txnHashForExecute: string;
  txnVersion: constants.TRANSACTION_VERSION;
  maxFee: string;
  calls: Call[];
};

/**
 * The RPC handler to execute a transaction.
 */
export class ExecuteTxnRpc extends AccountRpcController<
  ExecuteTxnParams,
  ExecuteTxnResponse
> {
  protected txnStateManager: TransactionStateManager;

  protected reqStateManager: TransactionRequestStateManager;

  protected accStateManager: AccountStateManager;

  protected tokenStateManager: TokenStateManager;

  protected requestStruct = ExecuteTxnRequestStruct;

  protected responseStruct = ExecuteTxnResponseStruct;

  constructor(options?: AccountRpcControllerOptions) {
    super(options);
    this.txnStateManager = new TransactionStateManager();
    this.reqStateManager = new TransactionRequestStateManager();
    this.accStateManager = new AccountStateManager();
    this.tokenStateManager = new TokenStateManager();
  }

  protected async preExecute(params: ExecuteTxnParams): Promise<void> {
    // Define mappings to ensure backward compatibility with previous versions of the API.
    // These mappings replace deprecated parameter names with the updated equivalents,
    // allowing older integrations to function without changes
    const paramMappings: Record<string, string> = {
      senderAddress: 'address',
      txnInvocation: 'calls',
      invocationsDetails: 'details',
    };

    // Apply the mappings to params
    mapDeprecatedParams(params, paramMappings);
    await super.preExecute(params);
  }

  /**
   * Execute the transaction request handler.
   *
   * @param params - The parameters of the request.
   * @param params.address - The address of the signer.
   * @param params.calls - The invoke calls to execute
   * @param [params.abis] - The abis associated to invocations.
   * @param [params.details] - Optional, the UniversalDetails of the transactions to be signed. Reference: https://starknetjs.com/docs/API/interfaces/types.UniversalDetails
   * @returns A Promise that resolve the ExecuteTxnResponse object.
   */
  async execute(params: ExecuteTxnParams): Promise<ExecuteTxnResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: ExecuteTxnParams,
  ): Promise<ExecuteTxnResponse> {
    const { address, calls, abis, details } = params;
    const { privateKey, publicKey } = this.account;
    const callsArray = Array.isArray(calls) ? calls : [calls];

    // FIXME: getEstimatedFees shpuld be refactored to accept account object
    const { suggestedMaxFee: maxFee, resourceBounds } = await getEstimatedFees(
      this.network,
      address,
      privateKey,
      publicKey,
      [
        {
          type: TransactionType.INVOKE,
          payload: calls,
        },
      ],
      details,
    );

    const accountDeployed = await this.account.accountContract.isDeployed();

    const {
      selectedFeeToken,
      maxFee: updatedMaxFee,
      resourceBounds: updatedResouceBounds,
    } = await this.confirmTransaction({
      txnVersion: details?.version as unknown as constants.TRANSACTION_VERSION,
      calls: callsArray,
      maxFee,
      resourceBounds,
    });

    const updatedTxnVersion = feeTokenToTransactionVersion(selectedFeeToken);

    let txnHashForDeploy: string | undefined;

    if (!accountDeployed) {
      txnHashForDeploy = await this.deployAccount({
        txnVersion: updatedTxnVersion,
      });
    }

    const txnHashForExecute = await this.sendTransaction({
      calls: callsArray,
      abis,
      details: {
        ...details,
        version: updatedTxnVersion,
        // Aways repect the input, unless the account is not deployed
        // TODO: we may also need to increment the nonce base on the input, if the account is not deployed
        nonce: accountDeployed ? details?.nonce : 1,
        maxFee,
        resourceBounds: updatedResouceBounds,
      },
    });

    await this.saveDataToState({
      txnHashForDeploy,
      txnHashForExecute,
      txnVersion: updatedTxnVersion,
      maxFee: updatedMaxFee,
      calls: callsArray,
    });

    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      transaction_hash: txnHashForExecute,
    };
  }

  protected async confirmTransaction({
    calls,
    maxFee,
    resourceBounds,
    txnVersion,
  }: ConfirmTransactionParams): Promise<TransactionRequest> {
    const requestId = uuidv4();
    const { chainId, name: networkName } = this.network;
    const { hdIndex: addressIndex, address } = this.account;

    const formattedCalls = await Promise.all(
      calls.map(async (call) =>
        callToTransactionReqCall(
          call,
          chainId,
          address,
          this.tokenStateManager,
        ),
      ),
    );

    const request: TransactionRequest = {
      chainId,
      networkName,
      id: requestId,
      interfaceId: '',
      type: TransactionType.INVOKE,
      signer: address,
      addressIndex,
      maxFee,
      calls: formattedCalls,
      resourceBounds,
      selectedFeeToken: transactionVersionToFeeToken(txnVersion),
      includeDeploy: !(await this.account.accountContract.isDeployed()),
    };

    const interfaceId = await generateExecuteTxnFlow(request);

    request.interfaceId = interfaceId;

    await this.reqStateManager.upsertTransactionRequest(request);

    try {
      if (!(await createInteractiveConfirmDialog(interfaceId))) {
        throw new UserRejectedOpError() as unknown as Error;
      }

      // Retrieve the updated transaction request,
      // the transaction request may have been updated during the confirmation process.
      const updatedRequest = await this.reqStateManager.getTransactionRequest({
        requestId,
      });

      if (!updatedRequest) {
        throw new Error('Failed to retrieve the updated transaction request');
      }

      return updatedRequest;
    } finally {
      // Remove the transaction request from the state without throwing an error
      await this.removeTransactionRequestSafe(requestId);
    }
  }

  protected async removeTransactionRequestSafe(requestId: string) {
    try {
      await this.reqStateManager.removeTransactionRequest(requestId);
    } catch (error) {
      logger.error('Failed to remove transaction request', error);
    }
  }

  protected async deployAccount({
    txnVersion,
  }: DeployAccountParams): Promise<string> {
    const {
      privateKey,
      address,
      publicKey,
      accountContract: { callData },
    } = this.account;

    // FIXME: deployAccount shpuld be refactored to accept account object
    const {
      contract_address: contractAddress,
      transaction_hash: transactionHash,
    } = await deployAccount(
      this.network,
      address,
      callData,
      publicKey,
      privateKey,
      CAIRO_VERSION,
      { version: txnVersion },
    );

    if (contractAddress !== address) {
      logger.warn(`
        contract address is not match with the desired address\n contract address: ${contractAddress}, desired address: ${address}
        `);
    }

    if (!transactionHash) {
      throw new Error(`Failed to deploy account`);
    }

    return transactionHash;
  }

  protected async sendTransaction({
    calls,
    abis,
    details,
  }: SendTransactionParams): Promise<string> {
    const { privateKey, address } = this.account;

    const executeTxnResp = await executeTxnUtil(
      this.network,
      address,
      privateKey,
      calls,
      abis,
      details,
    );

    if (!executeTxnResp?.transaction_hash) {
      throw new Error('Failed to execute transaction');
    }

    return executeTxnResp.transaction_hash;
  }

  protected async saveDataToState({
    txnHashForDeploy,
    txnHashForExecute,
    txnVersion,
    maxFee,
    calls,
  }: SaveDataToStateParamas) {
    const txnVersionInNumber = transactionVersionToNumber(txnVersion);
    const { chainId } = this.network;
    const { address } = this.account;

    if (txnHashForDeploy) {
      await this.txnStateManager.addTransaction(
        newDeployTransaction({
          senderAddress: address,
          txnHash: txnHashForDeploy,
          chainId,
          txnVersion: txnVersionInNumber,
        }),
      );
      await this.accStateManager.updateAccountAsDeploy({
        address,
        chainId,
        transactionHash: txnHashForDeploy,
      });
    }

    await this.txnStateManager.addTransaction(
      newInvokeTransaction({
        senderAddress: address,
        txnHash: txnHashForExecute,
        chainId,
        maxFee,
        txnVersion: txnVersionInNumber,
        calls,
      }),
    );
  }
}

export const executeTxn = new ExecuteTxnRpc({
  showInvalidAccountAlert: true,
});
