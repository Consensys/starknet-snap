import type { Component, Json } from '@metamask/snaps-sdk';
import {
  heading,
  divider,
  row,
  UserRejectedRequestError,
  text,
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
import {
  object,
  string,
  assign,
  optional,
  array,
  any,
  refine,
} from 'superstruct';

import { AccountStateManager } from '../state/account-state-manager';
import { TransactionStateManager } from '../state/transaction-state-manager';
import { FeeToken } from '../types/snapApi';
import type { Network } from '../types/snapState';
import { VoyagerTransactionType, type Transaction } from '../types/snapState';
import type { TransactionVersion } from '../types/starknet';
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
  deployAccount,
  executeTxn as executeTxnUtil,
  getAccContractAddressAndCallData,
  getEstimatedFees,
  waitForTransaction,
} from '../utils/starknetUtils';

/**
 *
 * @param deployResp
 * @param network
 */
async function handleAccountDeployment(
  deployResp: DeployContractResponse, // Adjust type as needed
  network: Network,
) {
  const accountStateManager = new AccountStateManager(false);
  const account = await accountStateManager.getAccount({
    address: deployResp.contract_address,
    chainId: network.chainId,
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
    chainId: network.chainId,
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

export const createAccount = async (
  network: Network,
  publicKey: string,
  privateKey: string,
  transactionVersion: TransactionVersion,
  waitMode = false,
) => {
  const { address, callData } = getAccContractAddressAndCallData(publicKey);
  // Deploy account will auto estimate the fee from the network if not provided
  const deployResp = await deployAccount(
    network,
    address,
    callData,
    publicKey,
    privateKey,
    transactionVersion,
    CAIRO_VERSION,
  );

  if (deployResp.contract_address && deployResp.transaction_hash) {
    await handleAccountDeployment(deployResp, network);
  }

  if (waitMode) {
    await waitForTransaction(
      network,
      deployResp.contract_address,
      privateKey,
      deployResp.transaction_hash,
    );
  }

  return {
    address: deployResp.contract_address,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_hash: deployResp.transaction_hash,
  };
};

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
        details.version ?? TRANSACTION_VERSION,
        true,
      );
    }

    const executeTxnResp = await executeTxnUtil(
      this.network,
      address,
      this.account.privateKey,
      calls,
      details.version,
      abis,
      {
        nonce: accountDeployed ? undefined : 1,
        maxFee: estimateFeeResp.suggestedMaxFee,
      } as UniversalDetails,
      CAIRO_VERSION,
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
    // Only show the first call in the dialog
    for (const key of Object.keys(calls[0])) {
      components.push(
        row(
          key,
          text({
            value: JSON.stringify(calls[0][key], null, 2),
            markdown: false,
          }),
        ),
      );
    }

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
      const feeToken =
        details.version === constants.TRANSACTION_VERSION.V2
          ? FeeToken.ETH
          : FeeToken.STRK;
      components.push(
        row(
          `Max Fee(${feeToken})`,
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
