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

import { Config } from './config';
import { createAccount } from './createAccount';
import { extractPublicKey } from './extractPublicKey';
import { getCurrentNetwork } from './getCurrentNetwork';
import { getErc20TokenBalance } from './getErc20TokenBalance';
import { getStarkName } from './getStarkName';
import { getStoredErc20Tokens } from './getStoredErc20Tokens';
import { getStoredNetworks } from './getStoredNetworks';
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
  GetAddrFromStarkNameParams,
  GetTransactionStatusParams,
  ListTransactionsParams,
  AddAccountParams,
  GetCurrentAccountParams,
  ListAccountsParams,
  SwitchAccountParams,
  SetAccountNameParams,
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
  getAddrFromStarkName,
  getTransactionStatus,
  listTransactions,
  addAccount,
  getCurrentAccount,
  listAccounts,
  switchAccount,
  setAccountName,
} from './rpcs';
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
import { getTranslator, loadLocale } from './utils/locale';
import { acquireLock } from './utils/lock';
import { logger } from './utils/logger';
import { RpcMethod, validateOrigin } from './utils/permission';
import { toJson } from './utils/serializer';
import {
  upsertErc20Token,
  upsertNetwork,
  removeNetwork,
} from './utils/snapUtils';

declare const snap;
logger.logLevel = parseInt(Config.logLevel, 10);

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  await loadLocale();
  const requestParams = request?.params as unknown as ApiRequestParams;

  logger.log(`${request.method}:\nrequestParams: ${toJson(requestParams)}`);

  try {
    validateOrigin(origin, request.method);

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
      case RpcMethod.GetPreferences: {
        const { locale } = await snap.request({
          method: 'snap_getPreferences',
        });
        return { locale };
      }

      case RpcMethod.CreateAccount:
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await createAccount(
          apiParams as unknown as ApiParamsWithKeyDeriver,
        );

      case RpcMethod.DeployCario0Account:
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await createAccount(
          apiParams as unknown as ApiParamsWithKeyDeriver,
          false,
          true,
          CAIRO_VERSION_LEGACY,
        );

      case RpcMethod.ListAccounts:
        return await listAccounts.execute(
          requestParams as unknown as ListAccountsParams,
        );

      case RpcMethod.DisplayPrivateKey:
        return await displayPrivateKey.execute(
          apiParams.requestParams as unknown as DisplayPrivateKeyParams,
        );

      case RpcMethod.ExtractPublicKey:
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await extractPublicKey(
          apiParams as unknown as ApiParamsWithKeyDeriver,
        );

      case RpcMethod.SignMessage:
        return await signMessage.execute(
          apiParams.requestParams as unknown as SignMessageParams,
        );

      case RpcMethod.SignTransaction:
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await signTransaction.execute(
          apiParams.requestParams as unknown as SignTransactionParams,
        );

      case RpcMethod.SignDeclareTransaction:
        return await signDeclareTransaction.execute(
          apiParams.requestParams as unknown as SignDeclareTransactionParams,
        );

      case RpcMethod.SignDeployAccountTransaction:
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await signDeployAccountTransaction(
          apiParams as unknown as ApiParamsWithKeyDeriver,
        );

      case RpcMethod.VerifySignedMessage:
        return await verifySignature.execute(
          apiParams.requestParams as unknown as VerifySignatureParams,
        );

      case RpcMethod.GetErc20TokenBalance:
        return await getErc20TokenBalance(apiParams);

      case RpcMethod.GetTransactionStatus:
        return await getTransactionStatus.execute(
          apiParams.requestParams as unknown as GetTransactionStatusParams,
        );

      case RpcMethod.ReadContract:
        return await getValue(apiParams);

      case RpcMethod.EstimateFee:
        return await estimateFee.execute(
          apiParams.requestParams as unknown as EstimateFeeParams,
        );

      case RpcMethod.AddErc20Token:
        return await watchAsset.execute(
          apiParams.requestParams as unknown as WatchAssetParams,
        );

      case RpcMethod.GetStoredErc20Tokens:
        return await getStoredErc20Tokens(apiParams);

      case RpcMethod.SwitchNetwork:
        return await switchNetwork.execute(
          apiParams.requestParams as unknown as SwitchNetworkParams,
        );

      case RpcMethod.GetCurrentNetwork:
        return await getCurrentNetwork(apiParams);

      case RpcMethod.GetStoredNetworks:
        return await getStoredNetworks(apiParams);

      case RpcMethod.GetTransactions:
        return await listTransactions.execute(
          apiParams.requestParams as unknown as ListTransactionsParams,
        );

      case RpcMethod.RecoverAccounts:
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await recoverAccounts(
          apiParams as unknown as ApiParamsWithKeyDeriver,
        );

      case RpcMethod.ExecuteTxn:
        return await executeTxn.execute(
          apiParams.requestParams as unknown as ExecuteTxnParams,
        );

      case RpcMethod.UpgradeAccContract:
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return upgradeAccContract(
          apiParams as unknown as ApiParamsWithKeyDeriver,
        );

      case RpcMethod.DeclareContract:
        return await declareContract.execute(
          apiParams.requestParams as unknown as DeclareContractParams,
        );

      case RpcMethod.GetStarkName:
        return await getStarkName(apiParams);

      case RpcMethod.GetDeploymentData:
        return await getDeploymentData.execute(
          apiParams.requestParams as unknown as GetDeploymentDataParams,
        );

      case RpcMethod.GetAddressByStarkName:
        return await getAddrFromStarkName.execute(
          apiParams.requestParams as unknown as GetAddrFromStarkNameParams,
        );

      case RpcMethod.AddAccount:
        return await addAccount.execute(
          requestParams as unknown as AddAccountParams,
        );

      case RpcMethod.GetCurrentAccount:
        return await getCurrentAccount.execute(
          requestParams as unknown as GetCurrentAccountParams,
        );

      case RpcMethod.SwitchAccount:
        return await switchAccount.execute(
          requestParams as unknown as SwitchAccountParams,
        );

      case RpcMethod.SetAccountName:
        return await setAccountName.execute(
          requestParams as unknown as SetAccountNameParams,
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
  await loadLocale();
  const translate = getTranslator();
  await ensureJsxSupport(
    <Box>
      <Text>{translate('walletIsCompatible')}</Text>
      <Text>
        {translate('accountManagementIntro')}{' '}
        <Link href={getDappUrl()}>{translate('companionDapp')}</Link>.
      </Text>
    </Box>,
  );
};

export const onUpdate: OnUpdateHandler = async () => {
  await loadLocale();
  const translate = getTranslator();
  await ensureJsxSupport(
    <Box>
      <Text>{translate('snapIsUpToDate')}</Text>
      <Text>
        {translate('accountManagementReminder')}{' '}
        <Link href={getDappUrl()}>{translate('companionDapp')}</Link>.
      </Text>
    </Box>,
  );
};

export const onHomePage: OnHomePageHandler = async () => {
  await loadLocale();
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
