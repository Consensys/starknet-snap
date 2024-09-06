import type { Component, Json } from '@metamask/snaps-sdk';
import {
  heading,
  row,
  UserRejectedRequestError,
  text,
  divider,
} from '@metamask/snaps-sdk';
import convert from 'ethereum-unit-converter';
import type { Call, Calldata } from 'starknet';
import { constants, TransactionStatus, TransactionType } from 'starknet';
import type { Infer } from 'superstruct';
import { object, string, assign, optional, any } from 'superstruct';

import { AccountStateManager } from '../state/account-state-manager';
import { TokenStateManager } from '../state/token-state-manager';
import { TransactionStateManager } from '../state/transaction-state-manager';
import { FeeToken } from '../types/snapApi';
import { VoyagerTransactionType, type Transaction } from '../types/snapState';
import type { AccountRpcControllerOptions } from '../utils';
import {
  AddressStruct,
  BaseRequestStruct,
  AccountRpcController,
  confirmDialog,
  UniversalDetailsStruct,
  CallsStruct,
} from '../utils';
import { logger } from '../utils/logger';
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

  protected accStateManager: AccountStateManager;

  protected tokenStateManager: TokenStateManager;

  protected requestStruct = ExecuteTxnRequestStruct;

  protected responseStruct = ExecuteTxnResponseStruct;

  constructor(options?: AccountRpcControllerOptions) {
    super(options);
    this.txnStateManager = new TransactionStateManager();
    this.accStateManager = new AccountStateManager();
    this.tokenStateManager = new TokenStateManager();
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

    if (
      !(await this.getExecuteTxnConsensus(
        address,
        accountDeployed,
        calls,
        suggestedMaxFee,
        version,
      ))
    ) {
      throw new UserRejectedRequestError() as unknown as Error;
    }

    if (!accountDeployed) {
      await createAccount({
        network: this.network,
        address,
        publicKey,
        privateKey,
        waitMode: false,
        callback: async (contractAddress: string, transactionHash: string) => {
          await this.updateAccountAsDeploy(contractAddress, transactionHash);
        },
        version,
      });
    }

    const resourceBounds = estimateResults.map(
      (result) => result.resourceBounds,
    );

    const executeTxnResp = await executeTxnUtil(
      this.network,
      address,
      privateKey,
      calls,
      abis,
      {
        ...details,
        // Aways repect the input, unless the account is not deployed
        // TODO: we may also need to increment the nonce base on the input, if the account is not deployed
        nonce: accountDeployed ? details?.nonce : 1,
        maxFee: suggestedMaxFee,
        resourceBounds: resourceBounds[resourceBounds.length - 1],
      },
    );

    if (!executeTxnResp?.transaction_hash) {
      throw new Error('Failed to execute transaction');
    }

    await this.txnStateManager.addTransaction(
      this.createInvokeTxn(address, executeTxnResp.transaction_hash, calls[0]),
    );

    return executeTxnResp;
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

  protected async getExecuteTxnConsensus(
    address: string,
    accountDeployed: boolean,
    calls: Call[] | Call,
    maxFee: string,
    version?: constants.TRANSACTION_VERSION,
  ) {
    const callsArray = Array.isArray(calls) ? calls : [calls];

    const components: Component[] = [];
    const feeToken: FeeToken =
      version === constants.TRANSACTION_VERSION.V3
        ? FeeToken.STRK
        : FeeToken.ETH;

    components.push(
      row(
        'Signer Address',
        text({
          value: address,
          markdown: false,
        }),
      ),
    );

    // Display a message to indicate the signed transaction will include an account deployment
    if (!accountDeployed) {
      components.push(heading(`The account will be deployed`));
      components.push(divider());
    }

    components.push(
      row(
        `Estimated Gas Fee (${feeToken})`,
        text({
          value: convert(maxFee, 'wei', 'ether'),
          markdown: false,
        }),
      ),
    );

    components.push(
      row(
        'Network',
        text({
          value: this.network.name,
          markdown: false,
        }),
      ),
    );
    components.push(divider());

    // Iterate over each call in the calls array
    for (const call of callsArray) {
      const { contractAddress, calldata, entrypoint } = call;

      components.push(
        row(
          'Contract',
          text({
            value: contractAddress,
            markdown: false,
          }),
        ),
      );

      components.push(
        row(
          'Call Data',
          text({
            value: JSON.stringify(calldata, null, 2),
            markdown: false,
          }),
        ),
      );

      // If the contract is an ERC20 token and the function is 'transfer', display sender, recipient, and amount
      const token = await this.tokenStateManager.getToken({
        address: contractAddress,
        chainId: this.network.chainId,
      });
      if (token && entrypoint === 'transfer' && calldata) {
        try {
          const senderAddress = address;
          const recipientAddress = calldata[0]; // Assuming the first element in calldata is the recipient
          let amount = '';

          if ([3, 6, 9, 12, 15, 18].includes(token.decimals)) {
            amount = convert(calldata[1], -1 * token.decimals, 'ether');
          } else {
            amount = (
              Number(calldata[1]) * Math.pow(10, -1 * token.decimals)
            ).toFixed(token.decimals);
          }

          components.push(
            row(
              'Sender Address',
              text({
                value: senderAddress,
                markdown: false,
              }),
            ),
            row(
              'Recipient Address',
              text({
                value: recipientAddress,
                markdown: false,
              }),
            ),
            row(
              `Amount (${token.symbol})`,
              text({
                value: amount,
                markdown: false,
              }),
            ),
          );
        } catch (error) {
          logger.warn(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `error found in amount conversion: ${error}`,
          );
        }
      }
      components.push(divider());
    }

    return await confirmDialog(components);
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
