import type {
  OnRpcRequestHandler,
  OnHomePageHandler,
  OnInstallHandler,
  OnUpdateHandler,
  OnUserInputHandler,
  UserInputEvent,
  InterfaceContext,
} from '@metamask/snaps-sdk';
import { MethodNotFoundError } from '@metamask/snaps-sdk';
import { Box, Link, Text } from '@metamask/snaps-sdk/jsx';

import { addNetwork } from './addNetwork';
import { Config } from './config';
import { createAccount } from './createAccount';
import { estimateAccDeployFee } from './estimateAccountDeployFee';
import { estimateFees } from './estimateFees';
import { extractPublicKey } from './extractPublicKey';
import { getCurrentNetwork } from './getCurrentNetwork';
import { getErc20TokenBalance } from './getErc20TokenBalance';
import { getStarkName } from './getStarkName';
import { getStoredErc20Tokens } from './getStoredErc20Tokens';
import { getStoredNetworks } from './getStoredNetworks';
import { getStoredTransactions } from './getStoredTransactions';
import { getStoredUserAccounts } from './getStoredUserAccounts';
import { getTransactions } from './getTransactions';
import { getTransactionStatus } from './getTransactionStatus';
import { getValue } from './getValue';
import { homePageController } from './on-home-page';
import { recoverAccounts } from './recoverAccounts';
import type {
  DisplayPrivateKeyParams,
  EstimateFeeParams,
  ExecuteTxnParams,
  SignMessageParams,
  SignTransactionParams,
  SignDeclareTransactionParams,
  VerifySignatureParams,
  SwitchNetworkParams,
  GetDeploymentDataParams,
  DeclareContractParams,
  WatchAssetParams,
} from './rpcs';
import {
  displayPrivateKey,
  estimateFee,
  executeTxn,
  declareContract,
  signMessage,
  signTransaction,
  signDeclareTransaction,
  verifySignature,
  switchNetwork,
  getDeploymentData,
  watchAsset,
} from './rpcs';
import { sendTransaction } from './sendTransaction';
import { signDeployAccountTransaction } from './signDeployAccountTransaction';
import type {
  ApiParams,
  ApiParamsWithKeyDeriver,
  ApiRequestParams,
} from './types/snapApi';
import type { SnapState } from './types/snapState';
import { UserInputEventController } from './ui/controllers/user-input-event-controller';
import { upgradeAccContract } from './upgradeAccContract';
import {
  ensureJsxSupport,
  getDappUrl,
  getStateData,
  isSnapRpcError,
  setStateData,
} from './utils';
import {
  CAIRO_VERSION_LEGACY,
  PRELOADED_TOKENS,
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  STARKNET_TESTNET_NETWORK,
} from './utils/constants';
import { UnknownError } from './utils/exceptions';
import { getAddressKeyDeriver } from './utils/keyPair';
import { acquireLock } from './utils/lock';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import {
  upsertErc20Token,
  upsertNetwork,
  removeNetwork,
} from './utils/snapUtils';

declare const snap;
logger.logLevel = parseInt(Config.logLevel, 10);

export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  const requestParams = request?.params as unknown as ApiRequestParams;

  logger.log(`${request.method}:\nrequestParams: ${toJson(requestParams)}`);

  try {
    if (request.method === 'ping') {
      logger.log('pong');
      return 'pong';
    }

    // TODO: this will causing racing condition, need to be fixed
    let state: SnapState = await getStateData<SnapState>();
    if (!state) {
      state = {
        accContracts: [],
        erc20Tokens: [],
        networks: [],
        transactions: [],
      };
      // initialize state if empty and set default data
      await setStateData(state);
    }

    // TODO: this can be remove, after state manager is implemented
    const saveMutex = acquireLock();

    // pre-inserted the default networks and tokens
    await upsertNetwork(STARKNET_MAINNET_NETWORK, snap, saveMutex, state);
    await upsertNetwork(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      snap,
      saveMutex,
      state,
    );

    // remove the testnet network (migration)
    await removeNetwork(STARKNET_TESTNET_NETWORK, snap, saveMutex, state);

    for (const token of PRELOADED_TOKENS) {
      await upsertErc20Token(token, snap, saveMutex, state);
    }

    const apiParams: ApiParams = {
      state,
      requestParams,
      wallet: snap,
      saveMutex,
    };

    switch (request.method) {
      case 'starkNet_createAccount':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await createAccount(
          apiParams as unknown as ApiParamsWithKeyDeriver,
        );

      case 'starkNet_createAccountLegacy':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await createAccount(
          apiParams as unknown as ApiParamsWithKeyDeriver,
          false,
          true,
          CAIRO_VERSION_LEGACY,
        );

      case 'starkNet_getStoredUserAccounts':
        return await getStoredUserAccounts(apiParams);

      case 'starkNet_displayPrivateKey':
        return await displayPrivateKey.execute(
          apiParams.requestParams as unknown as DisplayPrivateKeyParams,
        );

      case 'starkNet_extractPublicKey':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await extractPublicKey(
          apiParams as unknown as ApiParamsWithKeyDeriver,
        );

      case 'starkNet_signMessage':
        return await signMessage.execute(
          apiParams.requestParams as unknown as SignMessageParams,
        );

      case 'starkNet_signTransaction':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await signTransaction.execute(
          apiParams.requestParams as unknown as SignTransactionParams,
        );

      case 'starkNet_signDeclareTransaction':
        return await signDeclareTransaction.execute(
          apiParams.requestParams as unknown as SignDeclareTransactionParams,
        );

      case 'starkNet_signDeployAccountTransaction':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await signDeployAccountTransaction(
          apiParams as unknown as ApiParamsWithKeyDeriver,
        );

      case 'starkNet_verifySignedMessage':
        return await verifySignature.execute(
          apiParams.requestParams as unknown as VerifySignatureParams,
        );

      case 'starkNet_getErc20TokenBalance':
        return await getErc20TokenBalance(apiParams);

      case 'starkNet_getTransactionStatus':
        return await getTransactionStatus(apiParams);

      case 'starkNet_sendTransaction':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await sendTransaction(
          apiParams as unknown as ApiParamsWithKeyDeriver,
        );

      case 'starkNet_getValue':
        return await getValue(apiParams);

      case 'starkNet_estimateFee':
        return await estimateFee.execute(
          apiParams.requestParams as unknown as EstimateFeeParams,
        );

      case 'starkNet_estimateAccountDeployFee':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await estimateAccDeployFee(
          apiParams as unknown as ApiParamsWithKeyDeriver,
        );

      case 'starkNet_addErc20Token':
        return await watchAsset.execute(
          apiParams.requestParams as unknown as WatchAssetParams,
        );

      case 'starkNet_getStoredErc20Tokens':
        return await getStoredErc20Tokens(apiParams);

      case 'starkNet_addNetwork':
        return await addNetwork(apiParams);

      case 'starkNet_switchNetwork':
        return await switchNetwork.execute(
          apiParams.requestParams as unknown as SwitchNetworkParams,
        );

      case 'starkNet_getCurrentNetwork':
        return await getCurrentNetwork(apiParams);

      case 'starkNet_getStoredNetworks':
        return await getStoredNetworks(apiParams);

      case 'starkNet_getStoredTransactions':
        return await getStoredTransactions(apiParams);

      case 'starkNet_getTransactions':
        return await getTransactions(apiParams);

      case 'starkNet_recoverAccounts':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await recoverAccounts(
          apiParams as unknown as ApiParamsWithKeyDeriver,
        );

      case 'starkNet_executeTxn':
        return await executeTxn.execute(
          apiParams.requestParams as unknown as ExecuteTxnParams,
        );

      case 'starkNet_estimateFees':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await estimateFees(
          apiParams as unknown as ApiParamsWithKeyDeriver,
        );

      case 'starkNet_upgradeAccContract':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return upgradeAccContract(
          apiParams as unknown as ApiParamsWithKeyDeriver,
        );

      case 'starkNet_declareContract':
        return await declareContract.execute(
          apiParams.requestParams as unknown as DeclareContractParams,
        );

      case 'starkNet_getStarkName':
        return await getStarkName(apiParams);

      case 'starkNet_getDeploymentData':
        return await getDeploymentData.execute(
          apiParams.requestParams as unknown as GetDeploymentDataParams,
        );

      default:
        throw new MethodNotFoundError() as unknown as Error;
    }
  } catch (error) {
    let snapError = error;

    if (!isSnapRpcError(error)) {
      // To ensure the error meets both the SnapError format and WalletRpc format.
      snapError = new UnknownError('Unable to execute the rpc request');
    }
    logger.error(
      `onRpcRequest error: ${JSON.stringify(snapError.toJSON(), null, 2)}`,
    );
    throw snapError;
  }
};

export const onInstall: OnInstallHandler = async () => {
  await ensureJsxSupport(
    <Box>
      <Text>Your MetaMask wallet is now compatible with Starknet!</Text>
      <Text>
        To manage your Starknet account and send and receive funds, visit the{' '}
        <Link href={getDappUrl()}>companion dapp for Starknet</Link>.
      </Text>
    </Box>,
  );
};

export const onUpdate: OnUpdateHandler = async () => {
  await ensureJsxSupport(
    <Box>
      <Text>Your Starknet Snap is now up-to-date !</Text>
      <Text>
        As usual, to manage your Starknet account and send and receive funds,
        visit the <Link href={getDappUrl()}>companion dapp for Starknet</Link>.
      </Text>
    </Box>,
  );
};

export const onHomePage: OnHomePageHandler = async () => {
  return await homePageController.execute();
};

/**
 * Handle incoming user events coming from the MetaMask clients open interfaces.
 *
 * @param params - The event parameters.
 * @param params.id - The Snap interface ID where the event was fired.
 * @param params.event - The event object containing the event type, name, and
 * value.
 * @param params.context
 * @see https://docs.metamask.io/snaps/reference/exports/#onuserinput
 */
export const onUserInput: OnUserInputHandler = async ({
  id,
  event,
  context,
}: {
  id: string;
  event: UserInputEvent;
  context: InterfaceContext | null;
}): Promise<void> => {
  const controller = new UserInputEventController(id, event, context);
  await controller.handleEvent();
};
