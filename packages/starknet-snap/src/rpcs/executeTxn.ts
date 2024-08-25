import type { Component, Json } from '@metamask/snaps-sdk';
import {
  heading,
  divider,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import type { Call, Invocations } from 'starknet';
import { TransactionType } from 'starknet';
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
import { addDialogTxt, getTxnSnapTxt } from '../utils/snapUtils';
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
      details: optional(UniversalDetailsStruct),
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
    for (const invocation of value.invocations) {
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

    const estimateFeeResp = await getEstimatedFees(
      this.network,
      address,
      this.account.privateKey,
      this.account.publicKey,
      invocations as unknown as Invocations,
      details?.version ?? TRANSACTION_VERSION,
      !accountDeployed,
    );

    const maxFee = estimateFeeResp.suggestedMaxFee;

    if (
      // Get Starknet expected not to show the confirm dialog, therefore, `enableAuthorize` will set to false to bypass the confirmation
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
    const nonceSendTransaction = accountDeployed ? undefined : 1;

    return await executeTxnUtil(
      this.network,
      address,
      this.account.privateKey,
      calls,
      abis,
      { maxFee, nonce: nonceSendTransaction },
    );
  }

  protected async getExecuteTxnConsensus(
    address: string,
    calls,
    abis,
    details,
    accountDeployed: boolean,
  ) {
    const components: Component[] = [];
    if (!accountDeployed) {
      components.push(heading(`The account will be deployed`));
      addDialogTxt(components, 'Address', address);
      addDialogTxt(components, 'Public Key', this.account.publicKey);
      addDialogTxt(
        components,
        'Address Index',
        this.account.addressIndex.toString(),
      );
      components.push(divider());
    }
    return await confirmDialog(
      components.concat(
        getTxnSnapTxt(address, this.network, calls, abis, details),
      ),
    );
  }
}

export const executeTxn = new ExecuteTxnRpc({
  showInvalidAccountAlert: true,
});
