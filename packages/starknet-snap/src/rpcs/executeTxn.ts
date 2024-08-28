import type { Component, Json } from '@metamask/snaps-sdk';
import {
  heading,
  row,
  UserRejectedRequestError,
  text,
  divider,
} from '@metamask/snaps-sdk';
import convert from 'ethereum-unit-converter';
import type {
  Call,
  Calldata,
  DeployContractResponse,
  Invocations,
  UniversalDetails,
} from 'starknet';
import { constants, TransactionStatus, TransactionType } from 'starknet';
import type { Infer } from 'superstruct';
import { object, string, assign, optional, any } from 'superstruct';

import { AccountStateManager } from '../state/account-state-manager';
import { TokenStateManager } from '../state/token-state-manager';
import { TransactionStateManager } from '../state/transaction-state-manager';
import { FeeToken } from '../types/snapApi';
import { VoyagerTransactionType, type Transaction } from '../types/snapState';
import {
  AddressStruct,
  BaseRequestStruct,
  AccountRpcController,
  confirmDialog,
  UniversalDetailsStruct,
  CallsStruct,
} from '../utils';
import { CAIRO_VERSION, TRANSACTION_VERSION } from '../utils/constants';
import {
  createAccount,
  executeTxn as executeTxnUtil,
  getEstimatedFees,
} from '../utils/starknetUtils';

export const ExecuteTxnRequestStruct = assign(
  object({
    address: AddressStruct,
    calls: CallsStruct,
    details: UniversalDetailsStruct,
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
 *
 * @param deployResp
 * @param chainId
 */
async function recordAccountDeployment(
  deployResp: DeployContractResponse, // Adjust type as needed
  chainId: string,
) {
  const accountStateManager = new AccountStateManager(false);
  const account = await accountStateManager.getAccount({
    address: deployResp.contract_address,
    chainId,
  });
  if (account === null) {
    throw new Error('Account contract not found');
  }
  await accountStateManager.updateAccount({
    ...account,
    deployTxnHash: deployResp.transaction_hash,
    upgradeRequired: false,
    deployRequired: false,
  });

  const txn: Transaction = {
    txnHash: deployResp.transaction_hash,
    txnType: VoyagerTransactionType.DEPLOY_ACCOUNT,
    chainId,
    senderAddress: deployResp.contract_address,
    contractAddress: deployResp.contract_address,
    contractFuncName: '',
    contractCallData: [],
    finalityStatus: TransactionStatus.RECEIVED,
    executionStatus: TransactionStatus.RECEIVED,
    status: '',
    failureReason: '',
    eventIds: [],
    timestamp: Math.floor(Date.now() / 1000),
  };
  const transactionStateManager = new TransactionStateManager();
  await transactionStateManager.addTransaction(txn);
}

/**
 * The RPC handler to execute a transaction.
 */
export class ExecuteTxnRpc extends AccountRpcController<
  ExecuteTxnParams,
  ExecuteTxnResponse
> {
  protected requestStruct = ExecuteTxnRequestStruct;

  protected responseStruct = ExecuteTxnResponseStruct;

  /**
   * Execute the transaction request handler.
   *
   * @param params - The parameters of the request.
   * @param params.address - The address of the signer.
   * @param params.calls - The invoke calls to execute
   * @param params.abis - The abis associated to invocations.
   * @param params.details - The detail associated to the call.
   * @returns The InvokeFunctionResponse as an `ExecuteTxnResponse`.
   */
  async execute(params: ExecuteTxnParams): Promise<ExecuteTxnResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: ExecuteTxnParams,
  ): Promise<ExecuteTxnResponse> {
    const { address, calls, abis, details } = params;
    const isArray = Array.isArray(calls);
    const callsArray = isArray ? calls : [calls];
    const invocations: Invocations = callsArray.map((call) => {
      return {
        type: TransactionType.INVOKE,
        payload: call,
      };
    });

    const estimateFeeResp = await getEstimatedFees(
      this.network,
      address,
      this.account.privateKey,
      this.account.publicKey,
      invocations as unknown as Invocations,
      {
        version: details?.version ?? TRANSACTION_VERSION,
      },
    );

    const accountDeployed = !estimateFeeResp.includeDeploy;

    if (
      !(await this.getExecuteTxnConsensus(
        address,
        callsArray,
        details as UniversalDetails,
        accountDeployed,
      ))
    ) {
      throw new UserRejectedRequestError() as unknown as Error;
    }

    if (!accountDeployed) {
      await createAccount(
        this.network,
        this.account.publicKey,
        this.account.privateKey,
        CAIRO_VERSION,
        recordAccountDeployment,
        true,
      );
    }

    const transactionVersion = details?.version ?? TRANSACTION_VERSION;
    // transaction version needs to be passed in the account
    // having it also present in the details of the execution call creates
    // unpredictable behaviour. This issue is not present when estimating fee bulk.
    delete details.version;
    const executeTxnResp = await executeTxnUtil(
      this.network,
      address,
      this.account.privateKey,
      calls,
      transactionVersion,
      {
        ...details,
        nonce: accountDeployed ? undefined : 1,
        maxFee: estimateFeeResp.suggestedMaxFee,
      } as unknown as UniversalDetails,
      abis,
    );

    if (
      executeTxnResp === undefined ||
      executeTxnResp.transaction_hash === undefined
    ) {
      throw new Error('Unable to execute transaction');
    }

    // TODO should write all calls in state not just first one
    const callData = calls[0].calldata as Calldata;

    const txn: Transaction = {
      txnHash: executeTxnResp.transaction_hash,
      txnType: VoyagerTransactionType.INVOKE,
      chainId: this.network.chainId,
      senderAddress: address,
      contractAddress: calls[0].contractAddress,
      contractFuncName: calls[0].entrypoint,
      contractCallData: callData.map(
        (data: string) => `0x${BigInt(data).toString(16)}`,
      ),
      finalityStatus: TransactionStatus.RECEIVED,
      executionStatus: TransactionStatus.RECEIVED,
      status: '', // DEPRECATED LATER
      failureReason: '',
      eventIds: [],
      timestamp: Math.floor(Date.now() / 1000),
    };

    const stateManager = new TransactionStateManager();
    await stateManager.addTransaction(txn);

    return executeTxnResp;
  }

  protected async getExecuteTxnConsensus(
    address: string,
    calls: Call[],
    details: UniversalDetails,
    accountDeployed: boolean,
  ) {
    const components: Component[] = [];
    const feeToken: FeeToken =
      details.version === constants.TRANSACTION_VERSION.V3
        ? FeeToken.STRK
        : FeeToken.ETH;

    // Display signer address
    components.push(
      row(
        'Signer Address',
        text({
          value: address,
          markdown: false,
        }),
      ),
    );

    // Display a message if the account will be deployed
    if (!accountDeployed) {
      components.push(heading(`The account will be deployed`));
      // Divider after account deployment info
      components.push(divider());
    }

    // Display estimated gas fee if available
    if (details?.maxFee) {
      components.push(
        row(
          `Estimated Gas Fee (${feeToken})`,
          text({
            value: convert(details.maxFee, 'wei', 'ether'),
            markdown: false,
          }),
        ),
      );
    }

    // Display network name
    components.push(
      row(
        'Network',
        text({
          value: this.network.name,
          markdown: false,
        }),
      ),
    );

    // Divider before calls information
    components.push(divider());

    // Iterate over each call in the calls array
    for (const call of calls) {
      const { contractAddress, calldata, entrypoint } = call;
      const contractFuncName = entrypoint;

      // Display contract address
      components.push(
        row(
          'Contract',
          text({
            value: contractAddress,
            markdown: false,
          }),
        ),
      );

      // Display call data
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
      const tokenStateManager = new TokenStateManager();

      const token = await tokenStateManager.getToken({
        address: contractAddress,
        chainId: this.network.chainId,
      });
      if (token && contractFuncName === 'transfer' && calldata) {
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
              'Amount',
              text({
                value: amount,
                markdown: false,
              }),
            ),
          );
        } catch (error) {
          console.error('Error processing ERC20 transfer:', error);
        }
      }

      // Divider after each call
      components.push(divider());
    }

    // Display details such as Nonce and Version if available
    if (details?.nonce) {
      components.push(
        row(
          'Nonce',
          text({
            value: details.nonce.toString(),
            markdown: false,
          }),
        ),
      );
    }
    if (details?.version) {
      components.push(
        row(
          'Version',
          text({
            value: details.version.toString(),
            markdown: false,
          }),
        ),
      );
    }

    // Display the dialog to the user
    return await confirmDialog(components);
  }
}

export const executeTxn = new ExecuteTxnRpc({
  showInvalidAccountAlert: true,
});
