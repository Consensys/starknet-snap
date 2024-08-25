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
  boolean,
  enums,
  optional,
  array,
  any,
  union,
  number,
} from 'superstruct';

import { createAccount } from '../createAccount';
import type { ApiParamsWithKeyDeriver } from '../types/snapApi';
import { SnapState } from '../types/snapState';
import {
  AddressStruct,
  BaseRequestStruct,
  AccountRpcController,
  createStructWithAdditionalProperties,
  AuthorizableStruct,
  getStateData,
  confirmDialog,
} from '../utils';
import { ACCOUNT_CLASS_HASH, TRANSACTION_VERSION } from '../utils/constants';
import { addDialogTxt, getTxnSnapTxt } from '../utils/snapUtils';
import {
  executeTxn as executeTxnUtil,
  getAccContractAddressAndCallData,
  getEstimatedFees,
  isAccountDeployed,
} from '../utils/starknetUtils';

// Define the types you expect for additional properties
const additionalPropertyTypes = union([string(), number(), any()]);

const DeclarePayloadStruct = createStructWithAdditionalProperties(
  object({
    contract: union([any(), string()]),
    classHash: optional(string()),
    casm: optional(any()),
    compiledClassHash: optional(string()),
  }),
  additionalPropertyTypes,
);

const InvokePayloadStruct = createStructWithAdditionalProperties(
  object({
    contractAddress: string(),
    calldata: optional(any()), // Assuming RawArgs or Calldata can be represented as any or string
    entrypoint: optional(string()), // Making entrypoint optional as it was mentioned in the example
  }),
  additionalPropertyTypes,
);

const DeclareTransactionStruct = object({
  type: enums([TransactionType.DECLARE]),
  payload: optional(DeclarePayloadStruct),
});

const DeployTransactionStruct = object({
  type: enums([TransactionType.DEPLOY]),
  payload: optional(any()),
});

const DeployAccountTransactionStruct = object({
  type: enums([TransactionType.DEPLOY_ACCOUNT]),
  payload: optional(any()),
});

const InvokeTransactionStruct = object({
  type: enums([TransactionType.INVOKE]),
  payload: optional(InvokePayloadStruct),
});

const InvocationStruct = union([
  DeclareTransactionStruct,
  DeployTransactionStruct,
  DeployAccountTransactionStruct,
  InvokeTransactionStruct,
]);

const UniversalDetailsStruct = object({
  nonce: optional(any()),
  blockIdentifier: optional(any()),
  maxFee: optional(any()),
  tip: optional(any()),
  paymasterData: optional(array(any())),
  accountDeploymentData: optional(array(any())),
  nonceDataAvailabilityMode: optional(any()),
  feeDataAvailabilityMode: optional(any()),
  version: optional(enums(['0x2', '0x3'])),
  resourceBounds: optional(any()),
  skipValidate: optional(boolean()),
});

export const ExecuteTxnRequestStruct = assign(
  object({
    address: AddressStruct,
    invocations: array(InvocationStruct),
    details: optional(UniversalDetailsStruct),
    abis: optional(any()),
  }),
  AuthorizableStruct,
  BaseRequestStruct,
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
   * @param params.invocations - The invocations to execute.
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

    let snapComponents: Component[] = [];
    // const createAccountApiParams = {} as ApiParamsWithKeyDeriver;
    if (!accountDeployed) {
      snapComponents.push(heading(`The account will be deployed`));
      addDialogTxt(snapComponents, 'Address', address);
      addDialogTxt(snapComponents, 'Public Key', this.account.publicKey);
      addDialogTxt(
        snapComponents,
        'Address Index',
        this.account.addressIndex.toString(),
      );
      snapComponents.push(divider());
      //   const state = await getStateData<SnapState>();
      //   createAccountApiParams = {
      //     state,
      //     wallet: params.wallet,
      //     saveMutex: saveMutex,
      //     keyDeriver,
      //     requestParams: {
      //       addressIndex: this.account.addressIndex,
      //       deploy: true,
      //       chainId: this.network.chainId,
      //     },
      //   };
    }

    snapComponents = snapComponents.concat(
      getTxnSnapTxt(address, this.network, calls, abis, details),
    );

    if (
      // Get Starknet expected not to show the confirm dialog, therefore, `enableAuthorize` will set to false to bypass the confirmation
      // TODO: enableAuthorize should set default to true
      enableAuthorize &&
      !(await this.getExecuteTxnConsensus(snapComponents))
    ) {
      throw new UserRejectedRequestError() as unknown as Error;
    }

    // if (!accountDeployed) {
    //   await createAccount(createAccountApiParams, true, true);
    // }
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

  protected async getExecuteTxnConsensus(snapComponents: Component[]) {
    return await confirmDialog(snapComponents);
  }
}

export const executeTxn = new ExecuteTxnRpc({
  showInvalidAccountAlert: false,
});
