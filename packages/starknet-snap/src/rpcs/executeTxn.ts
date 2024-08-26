import type { Component, Json } from '@metamask/snaps-sdk';
import {
  heading,
  divider,
  row,
  UserRejectedRequestError,
  text,
} from '@metamask/snaps-sdk';
import convert from 'ethereum-unit-converter';
import type { Call, Calldata, Invocations } from 'starknet';
import { TransactionStatus, TransactionType } from 'starknet';
import type { Infer } from 'superstruct';
import {
  object,
  string,
  assign,
  optional,
  array,
  any,
  refine,
} from 'superstruct';

import { TransactionStateManager } from '../state/transaction-state-manager';
import { VoyagerTransactionType, type Transaction } from '../types/snapState';
import {
  AddressStruct,
  BaseRequestStruct,
  AccountRpcController,
  AuthorizableStruct,
  confirmDialog,
  InvocationStruct,
  UniversalDetailsStruct,
} from '../utils';
import {
  ACCOUNT_CLASS_HASH,
  CAIRO_VERSION,
  TRANSACTION_VERSION,
} from '../utils/constants';
import {
  createAccount,
  executeTxn as executeTxnUtil,
  getAccContractAddressAndCallData,
  getEstimatedFees,
} from '../utils/starknetUtils';

export const ExecuteTxnRequestStruct = refine(
  assign(
    object({
      address: AddressStruct,
      invocations: array(InvocationStruct),
      details: UniversalDetailsStruct,
      abis: optional(any()),
    }),
    AuthorizableStruct,
    BaseRequestStruct,
  ),
  'ExecuteTxnRequestStruct',
  (value) => {
    if (value.invocations.length === 0) {
      return 'Invocations cannot be empty';
    }
    for (const invocation of value.invocations as Invocations) {
      if (invocation.type !== TransactionType.INVOKE) {
        return `Invocations should be of type ${TransactionType.INVOKE} received ${invocation.type}`;
      }
      try {
        const payload = (invocation as any).payload as Call;
        const callData = payload.calldata as string[];
        for (const data of callData) {
          BigInt(data).toString(16);
        }
      } catch (error) {
        // data is already send to chain, hence we should not throw error
        return 'calldata must be an array of string that can derive to array of bigint';
      }
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

const getInvokeCalls = (invocations: Invocations): Call[] => {
  return invocations
    .filter((invocation) => invocation.type === TransactionType.INVOKE)
    .map((invocation: any) => invocation.payload as Call);
};

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
   * @param params.invocations - The invocations to execute (only invocations of type TransactionType.INVOKE)
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
    const { address, invocations, abis, details, enableAuthorize } = params;

    const estimateFeeResp = await getEstimatedFees(
      this.network,
      address,
      this.account.privateKey,
      this.account.publicKey,
      invocations as unknown as Invocations,
      details?.version ?? TRANSACTION_VERSION,
    );

    const calls = getInvokeCalls(invocations as Invocations);

    const accountDeployed = !estimateFeeResp.includeDeploy;

    if (!accountDeployed) {
      const { callData } = getAccContractAddressAndCallData(
        this.account.publicKey,
      );

      const deployAccountpayload = {
        classHash: ACCOUNT_CLASS_HASH,
        contractAddress: address,
        constructorCalldata: callData,
        addressSalt: this.account.publicKey,
      };

      invocations.unshift({
        type: TransactionType.DEPLOY_ACCOUNT,
        payload: deployAccountpayload,
      });
    }

    if (
      // Get Starknet expected not to show the confirm dialog, therefore,
      // `enableAuthorize` will set to false to bypass the confirmation
      // TODO: enableAuthorize should set default to true
      enableAuthorize &&
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
        version: details.version ?? TRANSACTION_VERSION,
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
