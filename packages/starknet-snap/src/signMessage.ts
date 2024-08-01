import type { Component } from '@metamask/snaps-sdk';
import {
  heading,
  row,
  text,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import type { Infer } from 'superstruct';
import { array, object, string, assign } from 'superstruct';

import type { SnapState } from './types/snapState';
import {
  confirmDialog,
  getBip44Deriver,
  isSnapRpcError,
  AddressStruct,
  logger,
  toJson,
  validateRequest,
  validateResponse,
  TypeDataStruct,
  AuthorizableStruct,
  BaseRequestStruct,
} from './utils';
import {
  getNetworkFromChainId,
  verifyIfAccountNeedUpgradeOrDeploy,
} from './utils/snapUtils';
import {
  signMessage as signMessageUtil,
  getKeysFromAddress,
} from './utils/starknetUtils';

export const SignMessageRequestStruct = assign(
  object({
    signerAddress: AddressStruct,
    typedDataMessage: TypeDataStruct,
  }),
  AuthorizableStruct,
  BaseRequestStruct,
);

export const SignMessageResponseStruct = array(string());

export type SignMessageParams = Infer<typeof SignMessageRequestStruct>;

export type SignMessageResponse = Infer<typeof SignMessageResponseStruct>;

/**
 * Signs a message.
 *
 * @param requestParams - The request parameters of the sign message request.
 * @param state - The current state of the snap.
 */
export async function signMessage(
  requestParams: SignMessageParams,
  // TODO: the state should be re-fetching in the rpc, rather than pass in to avoid object mutation. we will refactor it with a proper state management.
  state: SnapState,
) {
  try {
    validateRequest(requestParams, SignMessageRequestStruct);

    const deriver = await getBip44Deriver();
    const { signerAddress, typedDataMessage, chainId, enableAuthorize } =
      requestParams;
    // TODO: getNetworkFromChainId is not needed, as the network doesnt need to fetch from state
    const network = getNetworkFromChainId(state, chainId);

    const { privateKey, publicKey } = await getKeysFromAddress(
      deriver,
      network,
      state,
      signerAddress,
    );

    await verifyIfAccountNeedUpgradeOrDeploy(network, signerAddress, publicKey);

    if (
      // Get Starknet expected not to show the confirm dialog, therefore, `enableAuthorize` will set to false to bypass the confirmation
      // TODO: enableAuthorize should set default to true
      enableAuthorize &&
      !(await getSignMessageConsensus(typedDataMessage, signerAddress))
    ) {
      throw new UserRejectedRequestError() as unknown as Error;
    }

    const response = await signMessageUtil(
      privateKey,
      typedDataMessage,
      signerAddress,
    );

    validateResponse(response, SignMessageResponseStruct);

    return response;
  } catch (error) {
    logger.error('Failed to sign the message', error);

    if (isSnapRpcError(error)) {
      throw error as unknown as Error;
    }

    throw new Error('Failed to sign the message');
  }
}

/**
 * Gets the consensus to sign a message.
 *
 * @param typedDataMessage - The type data to sign.
 * @param signerAddress - The address of the signer.
 */
export async function getSignMessageConsensus(
  typedDataMessage: Infer<typeof TypeDataStruct>,
  signerAddress: string,
) {
  const components: Component[] = [];
  components.push(heading('Do you want to sign this message?'));
  components.push(
    row(
      'Message',
      text({
        value: toJson(typedDataMessage),
        markdown: false,
      }),
    ),
  );
  components.push(
    row(
      'Signer Address',
      text({
        value: signerAddress,
        markdown: false,
      }),
    ),
  );

  return await confirmDialog(components);
}
