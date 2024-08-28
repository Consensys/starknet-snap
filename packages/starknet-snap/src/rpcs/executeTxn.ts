import type { Component, Json } from '@metamask/snaps-sdk';
import {
  heading,
  divider,
  row,
  UserRejectedRequestError,
  text,
} from '@metamask/snaps-sdk';
import convert from 'ethereum-unit-converter';
import type { Calldata, Invocations } from 'starknet';
import { TransactionStatus, TransactionType } from 'starknet';
import type { Infer } from 'superstruct';
import {
  object,
  string,
  assign,
  optional,
  any,
  refine,
  array,
} from 'superstruct';

import { TransactionStateManager } from '../state/transaction-state-manager';
import { VoyagerTransactionType, type Transaction } from '../types/snapState';
import {
  AddressStruct,
  BaseRequestStruct,
  AccountRpcController,
  confirmDialog,
  UniversalDetailsStruct,
  CallDataStruct,
} from '../utils';
import { CAIRO_VERSION, TRANSACTION_VERSION } from '../utils/constants';
import {
  createAccount,
  executeTxn as executeTxnUtil,
  getEstimatedFees,
} from '../utils/starknetUtils';

export const ExecuteTxnRequestStruct = refine(
  assign(
    object({
      address: AddressStruct,
      calls: array(CallDataStruct),
      details: UniversalDetailsStruct,
      abis: optional(any()),
    }),
    BaseRequestStruct,
  ),
  'ExecuteTxnRequestStruct',
  (value) => {
    if (value.calls.length === 0) {
      return 'Calls cannot be empty';
    }
    return true;
  },
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

    const invocations: Invocations = calls.map((call) => {
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
        calls,
        abis,
        details,
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
        true,
      );
    }

    const executeTxnResp = await executeTxnUtil(
      this.network,
      address,
      this.account.privateKey,
      calls,
      abis,
      {
        nonce: accountDeployed ? undefined : 1,
        maxFee: estimateFeeResp.suggestedMaxFee,
      },
    );

    if (
      executeTxnResp === undefined ||
      executeTxnResp.transaction_hash === undefined
    ) {
      throw new Error('Unable to execute transaction');
    }

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
    calls,
    abis,
    details,
    accountDeployed: boolean,
  ) {
    const components: Component[] = [];
    let signHeadingStr = `Do you want to sign this transaction ?`;
    if (!accountDeployed) {
      components.push(heading(`The account will be deployed`));
      components.push(
        row(
          'Address',
          text({
            value: address,
            markdown: false,
          }),
        ),
      );
      components.push(
        row(
          'Public Key',
          text({
            value: this.account.publicKey,
            markdown: false,
          }),
        ),
      );
      components.push(
        row(
          'Address Index',
          text({
            value: this.account.addressIndex.toString(),
            markdown: false,
          }),
        ),
      );
      components.push(divider());
      signHeadingStr = `Do you want to sign these transactions ?`;
    }
    components.push(heading(signHeadingStr));
    components.push(
      row(
        'Network',
        text({
          value: this.network.name,
          markdown: false,
        }),
      ),
    );
    components.push(
      row(
        'Signer Address',
        text({
          value: address,
          markdown: false,
        }),
      ),
    );
    components.push(
      row(
        'Transaction Invocation',
        text({
          value: JSON.stringify(calls, null, 2),
          markdown: false,
        }),
      ),
    );
    if (abis && abis.length > 0) {
      components.push(
        row(
          'Abis',
          text({
            value: JSON.stringify(abis, null, 2),
            markdown: false,
          }),
        ),
      );
    }

    if (details?.maxFee) {
      components.push(
        row(
          'Max Fee(ETH)',
          text({
            value: convert(details.maxFee, 'wei', 'ether'),
            markdown: false,
          }),
        ),
      );
    }
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
    return await confirmDialog(components);
  }
}

export const executeTxn = new ExecuteTxnRpc({
  showInvalidAccountAlert: true,
});
