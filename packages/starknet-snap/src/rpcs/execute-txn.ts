import { type Json } from '@metamask/snaps-sdk';
import type { Call, Calldata } from 'starknet';
import { constants, TransactionStatus, TransactionType } from 'starknet';
import type { Infer } from 'superstruct';
import { object, string, assign, optional, any } from 'superstruct';
import { v4 as uuidv4 } from 'uuid';

import { AccountStateManager } from '../state/account-state-manager';
import { TransactionRequestStateManager } from '../state/request-state-manager';
import { TokenStateManager } from '../state/token-state-manager';
import { TransactionStateManager } from '../state/transaction-state-manager';
import { FeeToken } from '../types/snapApi';
import type { TransactionRequest } from '../types/snapState';
import { VoyagerTransactionType, type Transaction } from '../types/snapState';
import { generateExecuteTxnFlow } from '../ui/utils';
import type { AccountRpcControllerOptions } from '../utils';
import {
  AddressStruct,
  BaseRequestStruct,
  AccountRpcController,
  UniversalDetailsStruct,
  CallsStruct,
  mapDeprecatedParams,
  createInteractiveConfirmDialog,
  callToTransactionReqCall,
} from '../utils';
import { UserRejectedOpError } from '../utils/exceptions';
import {
  createAccount,
  executeTxn as executeTxnUtil,
  getEstimatedFees,
} from '../utils/starknetUtils';

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
    const requestId = uuidv4();

    try {
      const { address, calls, abis, details } = params;
      const { privateKey, publicKey } = this.account;
      const callsArray = Array.isArray(calls) ? calls : [calls];

      const { includeDeploy, suggestedMaxFee, estimateResults } =
        await getEstimatedFees(
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

      const accountDeployed = !includeDeploy;
      const version =
        details?.version as unknown as constants.TRANSACTION_VERSION;

      const formattedCalls = await Promise.all(
        callsArray.map(async (call) =>
          callToTransactionReqCall(
            call,
            this.network.chainId,
            address,
            this.tokenStateManager,
          ),
        ),
      );

      const request: TransactionRequest = {
        chainId: this.network.chainId,
        networkName: this.network.name,
        id: requestId,
        interfaceId: '',
        type: TransactionType.INVOKE,
        signer: address,
        addressIndex: this.account.addressIndex,
        maxFee: suggestedMaxFee,
        calls: formattedCalls,
        resourceBounds: estimateResults.map((result) => result.resourceBounds),
        selectedFeeToken:
          version === constants.TRANSACTION_VERSION.V3
            ? FeeToken.STRK
            : FeeToken.ETH,
        includeDeploy,
      };

      const interfaceId = await generateExecuteTxnFlow(request);

      request.interfaceId = interfaceId;

      await this.reqStateManager.upsertTransactionRequest(request);

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

      if (!accountDeployed) {
        await createAccount({
          network: this.network,
          address,
          publicKey,
          privateKey,
          waitMode: false,
          callback: async (
            contractAddress: string,
            transactionHash: string,
          ) => {
            await this.updateAccountAsDeploy(contractAddress, transactionHash);
          },
          version:
            updatedRequest.selectedFeeToken === FeeToken.STRK
              ? constants.TRANSACTION_VERSION.V3
              : constants.TRANSACTION_VERSION.V1,
        });
      }

      const invocationDetails = {
        ...details,
        // Aways repect the input, unless the account is not deployed
        // TODO: we may also need to increment the nonce base on the input, if the account is not deployed
        nonce: accountDeployed ? details?.nonce : 1,
        maxFee: updatedRequest.maxFee,
        resourceBounds:
          updatedRequest.resourceBounds[
            updatedRequest.resourceBounds.length - 1
          ],
        version:
          updatedRequest.selectedFeeToken === FeeToken.STRK
            ? constants.TRANSACTION_VERSION.V3
            : constants.TRANSACTION_VERSION.V1,
      };

      const executeTxnResp = await executeTxnUtil(
        this.network,
        address,
        privateKey,
        calls,
        abis,
        invocationDetails,
      );

      if (!executeTxnResp?.transaction_hash) {
        throw new Error('Failed to execute transaction');
      }

      // Since the RPC supports the `calls` parameter either as a single `call` object or an array of `call` objects,
      // and the current state data structure does not yet support multiple `call` objects in a single transaction,
      // we need to convert `calls` into a single `call` object as a temporary fix.
      const call = Array.isArray(calls) ? calls[0] : calls;

      await this.txnStateManager.addTransaction(
        this.createInvokeTxn(address, executeTxnResp.transaction_hash, call),
      );

      return executeTxnResp;
    } finally {
      await this.reqStateManager.removeTransactionRequest(requestId);
    }
  }

  protected async updateAccountAsDeploy(
    address: string,
    transactionHash: string,
  ): Promise<void> {
    if (!transactionHash) {
      throw new Error(`Failed to deploy account for address ${address}`);
    }

    await this.txnStateManager.addTransaction(
      this.createDeployTxn(address, transactionHash),
    );

    await this.accStateManager.updateAccountAsDeploy({
      address,
      chainId: this.network.chainId,
      transactionHash,
    });
  }

  protected createDeployTxn(
    address: string,
    transactionHash: string,
  ): Transaction {
    return {
      txnHash: transactionHash,
      txnType: VoyagerTransactionType.DEPLOY_ACCOUNT,
      chainId: this.network.chainId,
      senderAddress: address,
      contractAddress: address,
      contractFuncName: '',
      contractCallData: [],
      finalityStatus: TransactionStatus.RECEIVED,
      executionStatus: TransactionStatus.RECEIVED,
      status: '',
      failureReason: '',
      eventIds: [],
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  protected createInvokeTxn(
    address: string,
    transactionHash: string,
    callData: Call,
  ): Transaction {
    const { contractAddress, calldata, entrypoint } = callData;
    return {
      txnHash: transactionHash,
      txnType: VoyagerTransactionType.INVOKE,
      chainId: this.network.chainId,
      senderAddress: address,
      contractAddress,
      contractFuncName: entrypoint,
      contractCallData: (calldata as unknown as Calldata)?.map(
        (data: string) => `0x${BigInt(data).toString(16)}`,
      ),
      finalityStatus: TransactionStatus.RECEIVED,
      executionStatus: TransactionStatus.RECEIVED,
      status: '',
      failureReason: '',
      eventIds: [],
      timestamp: Math.floor(Date.now() / 1000),
    };
  }
}

export const executeTxn = new ExecuteTxnRpc({
  showInvalidAccountAlert: true,
});
