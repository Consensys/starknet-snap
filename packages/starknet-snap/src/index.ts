import { toJson } from './utils/serializer';
import { getAddressKeyDeriver } from './utils/keyPair';
import { createAccount } from './createAccount';
import { signMessage } from './signMessage';
import { signTransaction } from './signTransaction';
import { getErc20TokenBalance } from './getErc20TokenBalance';
import { getTransactionStatus } from './getTransactionStatus';
import { sendTransaction } from './sendTransaction';
import { verifySignedMessage } from './verifySignedMessage';
import { getValue } from './getValue';
import { addErc20Token } from './addErc20Token';
import { getStoredErc20Tokens } from './getStoredErc20Tokens';
import { estimateFee } from './estimateFee';
import { getStoredUserAccounts } from './getStoredUserAccounts';
import { SnapState } from './types/snapState';
import { extractPrivateKey } from './extractPrivateKey';
import { extractPublicKey } from './extractPublicKey';
import { addNetwork } from './addNetwork';
import { switchNetwork } from './switchNetwork';
import { getCurrentNetwork } from './getCurrentNetwork';
import {
  PRELOADED_TOKENS,
  STARKNET_INTEGRATION_NETWORK,
  STARKNET_MAINNET_NETWORK,
  STARKNET_TESTNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from './utils/constants';
import { upsertErc20Token, upsertNetwork } from './utils/snapUtils';
import { getStoredNetworks } from './getStoredNetworks';
import { getStoredTransactions } from './getStoredTransactions';
import { getTransactions } from './getTransactions';
import { recoverAccounts } from './recoverAccounts';
import { Mutex } from 'async-mutex';
import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { ApiParams, ApiRequestParams } from './types/snapApi';
import { estimateAccDeployFee } from './estimateAccountDeployFee';
import { executeTxn } from './executeTxn';
import { estimateFees } from './estimateFees';
import { declareContract } from './declareContract';
import { signDeclareTransaction } from './signDeclareTransaction';
import { signDeployAccountTransaction } from './signDeployAccountTransaction';
import { logger } from './utils/logger';

declare const snap;
const saveMutex = new Mutex();

export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  const requestParams = request?.params as unknown as ApiRequestParams;
  const isDev = !!requestParams?.isDev;
  const debugLevel = requestParams?.debugLevel;

  logger.init(debugLevel);
  console.log(`debugLevel: ${logger.getLogLevel()}`);
  // Switch statement for methods not requiring state to speed things up a bit
  logger.log(origin, request);
  if (request.method === 'ping') {
    logger.log('pong');
    return 'pong';
  }

  let state: SnapState = await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'get',
    },
  });

  if (!state) {
    state = {
      accContracts: [],
      erc20Tokens: [],
      networks: [],
      transactions: [],
    };
    // initialize state if empty and set default data
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state,
      },
    });
  }

  // pre-inserted the default networks and tokens
  await upsertNetwork(STARKNET_MAINNET_NETWORK, snap, saveMutex, state);
  if (isDev) {
    await upsertNetwork(STARKNET_INTEGRATION_NETWORK, snap, saveMutex, state);
  } else {
    await upsertNetwork(STARKNET_TESTNET_NETWORK, snap, saveMutex, state);
    await upsertNetwork(STARKNET_SEPOLIA_TESTNET_NETWORK, snap, saveMutex, state);
  }
  for (const token of PRELOADED_TOKENS) {
    await upsertErc20Token(token, snap, saveMutex, state);
  }

  logger.log(`${request.method}:\nrequestParams: ${toJson(requestParams)}`);

  const apiParams: ApiParams = {
    state,
    requestParams,
    wallet: snap,
    saveMutex,
  };

  switch (request.method) {
    case 'starkNet_createAccount':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return createAccount(apiParams);

    case 'starkNet_getStoredUserAccounts':
      return getStoredUserAccounts(apiParams);

    case 'starkNet_extractPrivateKey':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return extractPrivateKey(apiParams);

    case 'starkNet_extractPublicKey':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return extractPublicKey(apiParams);

    case 'starkNet_signMessage':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return signMessage(apiParams);

    case 'starkNet_signTransaction':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return signTransaction(apiParams);

    case 'starkNet_signDeclareTransaction':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return signDeclareTransaction(apiParams);

    case 'starkNet_signDeployAccountTransaction':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return signDeployAccountTransaction(apiParams);

    case 'starkNet_verifySignedMessage':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return verifySignedMessage(apiParams);

    case 'starkNet_getErc20TokenBalance':
      return getErc20TokenBalance(apiParams);

    case 'starkNet_getTransactionStatus':
      return getTransactionStatus(apiParams);

    case 'starkNet_sendTransaction':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return sendTransaction(apiParams);

    case 'starkNet_getValue':
      return getValue(apiParams);

    case 'starkNet_estimateFee':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return estimateFee(apiParams);

    case 'starkNet_estimateAccountDeployFee':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return estimateAccDeployFee(apiParams);

    case 'starkNet_addErc20Token':
      return addErc20Token(apiParams);

    case 'starkNet_getStoredErc20Tokens':
      return getStoredErc20Tokens(apiParams);

    case 'starkNet_addNetwork':
      return addNetwork(apiParams);

    case 'starkNet_switchNetwork':
      return switchNetwork(apiParams);

    case 'starkNet_getCurrentNetwork':
      return getCurrentNetwork(apiParams);

    case 'starkNet_getStoredNetworks':
      return getStoredNetworks(apiParams);

    case 'starkNet_getStoredTransactions':
      return getStoredTransactions(apiParams);

    case 'starkNet_getTransactions':
      return getTransactions(apiParams);

    case 'starkNet_recoverAccounts':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return recoverAccounts(apiParams);

    case 'starkNet_executeTxn':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return executeTxn(apiParams);

    case 'starkNet_estimateFees':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return estimateFees(apiParams);

    case 'starkNet_declareContract':
      apiParams.keyDeriver = await getAddressKeyDeriver(snap);
      return declareContract(apiParams);

    default:
      throw new Error('Method not found.');
  }
};
