import type { Component, Json } from '@metamask/snaps-sdk';
import {
  heading,
  divider,
  row,
  UserRejectedRequestError,
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
import type { Transaction } from '../types/snapState';
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
  isAccountDeployed,
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

    const calls = getInvokeCalls(invocations as Invocations);

    const accountDeployed = await isAccountDeployed(this.network, address);

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

    const estimateFeeResp = await getEstimatedFees(
      this.network,
      address,
      this.account.privateKey,
      this.account.publicKey,
      invocations as unknown as Invocations,
      details?.version ?? TRANSACTION_VERSION,
    );

    const resp = await executeTxnUtil(
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

    if (resp.transaction_hash) {
      const callData = calls[0].calldata as Calldata;

      const txn: Transaction = {
        txnHash: resp.transaction_hash,
        txnType: TransactionType.INVOKE,
        chainId: this.network.chainId,
        senderAddress: address,
        contractAddress: calls[0].contractAddress,
        contractFuncName: calls[0].entrypoint,
        contractCallData: callData.map((data: string) => {
          try {
            return `0x${BigInt(data).toString(16)}`;
          } catch (error) {
            // data is already send to chain, hence we should not throw error
            return '0x0';
          }
        }),
        finalityStatus: TransactionStatus.RECEIVED,
        executionStatus: TransactionStatus.RECEIVED,
        status: '', // DEPRECATED LATER
        failureReason: '',
        eventIds: [],
        timestamp: Math.floor(Date.now() / 1000),
      };

      const stateManager = new TransactionStateManager();
      await stateManager.addTransaction(txn);
    }

    return resp;
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
      components.push(row('Address', address));
      components.push(row('Public Key', this.account.publicKey));
      components.push(
        row('Address Index', this.account.addressIndex.toString()),
      );
      components.push(divider());
      signHeadingStr = `Do you want to sign these transactions ?`;
    }
    components.push(heading(signHeadingStr));
    components.push(row('Network', this.network.name));
    components.push(row('Signer Address', address));
    components.push(
      row('Transaction Invocation', JSON.stringify(calls, null, 2)),
    );
    if (abis && abis.length > 0) {
      components.push(row('Abis', JSON.stringify(abis, null, 2)));
    }

    if (details?.maxFee) {
      components.push(
        row('Max Fee(ETH)', convert(details.maxFee, 'wei', 'ether')),
      );
    }
    if (details?.nonce) {
      components.push(row('Nonce', details.nonce.toString()));
    }
    if (details?.version) {
      components.push(row('Version', details.version.toString()));
    }
    return await confirmDialog(components);
  }
}

export const executeTxn = new ExecuteTxnRpc({
  showInvalidAccountAlert: true,
});
