import type { DialogResult } from '@metamask/snaps-sdk';
import {
  heading,
  row,
  text,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import type { Call, InvocationsSignerDetails } from 'starknet';
import type { Infer } from 'superstruct';
import { array, object, string, assign, any } from 'superstruct';

import {
  confirmDialog,
  AddressStruct,
  AuthorizableStruct,
  BaseRequestStruct,
  AccountRpcController,
  CallDataStruct,
  toJson,
  mapDeprecatedParams,
} from '../utils';
import { signTransactions } from '../utils/starknetUtils';

export const SignTransactionRequestStruct = assign(
  object({
    address: AddressStruct,
    transactions: array(CallDataStruct),
    transactionsDetail: any(), // TODO: refine this to InvocationsSignerDetails
  }),
  AuthorizableStruct,
  BaseRequestStruct,
);

export const SignTransactionResponseStruct = array(string());

export type SignTransactionParams = Infer<typeof SignTransactionRequestStruct>;

export type SignTransactionResponse = Infer<
  typeof SignTransactionResponseStruct
>;

/**
 * The RPC handler to sign a transaction.
 */
export class SignTransactionRpc extends AccountRpcController<
  SignTransactionParams,
  SignTransactionResponse
> {
  protected requestStruct = SignTransactionRequestStruct;

  protected responseStruct = SignTransactionResponseStruct;

  protected async preExecute(params: SignTransactionParams): Promise<void> {
    // Define mappings to ensure backward compatibility with previous versions of the API.
    // These mappings replace deprecated parameter names with the updated equivalents,
    // allowing older integrations to function without changes
    const paramMappings: Record<string, string> = {
      signerAddress: 'address',
    };

    // Apply the mappings to params
    mapDeprecatedParams(params, paramMappings);
    await super.preExecute(params);
  }

  /**
   * Execute the sign transaction request handler.
   * It will show a confirmation dialog to the user before signing the transaction.
   *
   * @param params - The parameters of the request.
   * @param params.address - The address of the signer.
   * @param params.transactions - The list of transactions to be signed. Reference: https://www.starknetjs.com/docs/API/namespaces/types#call
   * @param params.transactionsDetail - The InvocationsSignerDetails of the transactions to be signed. Reference: https://www.starknetjs.com/docs/API/namespaces/types#invocationssignerdetails
   * @param [params.enableAuthorize] - Optional, a flag to enable or bypass the confirmation dialog.
   * @returns the signature of the transaction in a string array.
   */
  async execute(
    params: SignTransactionParams,
  ): Promise<SignTransactionResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: SignTransactionParams,
  ): Promise<SignTransactionResponse> {
    const { enableAuthorize, transactions, address } = params;
    if (
      // Get Starknet expected not to show the confirm dialog, therefore, `enableAuthorize` will set to false to bypass the confirmation
      // TODO: enableAuthorize should set default to true
      enableAuthorize &&
      !(await this.getSignTransactionConsensus(
        address,
        transactions as unknown as Call[],
      ))
    ) {
      throw new UserRejectedRequestError() as unknown as Error;
    }

    return (await signTransactions(
      this.account.privateKey,
      transactions,
      params.transactionsDetail as unknown as InvocationsSignerDetails,
    )) as SignTransactionResponse;
  }

  protected async getSignTransactionConsensus(
    address: string,
    transactions: Call[],
  ): Promise<DialogResult> {
    return await confirmDialog([
      heading('Do you want to sign this transaction?'),
      row(
        'Network',
        text({
          value: this.network.name,
          markdown: false,
        }),
      ),
      row(
        'Signer Address',
        text({
          value: address,
          markdown: false,
        }),
      ),
      row(
        'Transactions',
        text({
          value: toJson(transactions),
          markdown: false,
        }),
      ),
    ]);
  }
}

export const signTransaction = new SignTransactionRpc();
