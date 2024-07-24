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
  CAIRO_VERSION_LEGACY,
  ETHER_MAINNET,
  ETHER_SEPOLIA_TESTNET,
  PRELOADED_TOKENS,
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  STARKNET_TESTNET_NETWORK,
} from './utils/constants';
import { dappUrl, upsertErc20Token, upsertNetwork, removeNetwork } from './utils/snapUtils';
import { getStoredNetworks } from './getStoredNetworks';
import { getStoredTransactions } from './getStoredTransactions';
import { getTransactions } from './getTransactions';
import { recoverAccounts } from './recoverAccounts';
import { Mutex } from 'async-mutex';
import { ApiParams, ApiRequestParams } from './types/snapApi';
import { estimateAccDeployFee } from './estimateAccountDeployFee';
import { executeTxn } from './executeTxn';
import { estimateFees } from './estimateFees';
import { declareContract } from './declareContract';
import { signDeclareTransaction } from './signDeclareTransaction';
import { signDeployAccountTransaction } from './signDeployAccountTransaction';
import { upgradeAccContract } from './upgradeAccContract';
import { logger } from './utils/logger';
import { getStarkName } from './getStarkName';

import type { OnRpcRequestHandler, OnHomePageHandler, OnInstallHandler, OnUpdateHandler } from '@metamask/snaps-sdk';
import { InternalError, panel, row, divider, text, copyable } from '@metamask/snaps-sdk';
import { ethers } from 'ethers';
import { getBalance, getCorrectContractAddress, getKeysFromAddressIndex } from './utils/starknetUtils';

declare const snap;
const saveMutex = new Mutex();

export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  try {
    const requestParams = request?.params as unknown as ApiRequestParams;
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
    await upsertNetwork(STARKNET_SEPOLIA_TESTNET_NETWORK, snap, saveMutex, state);

    // remove the testnet network (migration)
    await removeNetwork(STARKNET_TESTNET_NETWORK, snap, saveMutex, state);

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

      case 'starkNet_createAccountLegacy':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return createAccount(apiParams, false, true, CAIRO_VERSION_LEGACY);

      case 'starkNet_getStoredUserAccounts':
        return await getStoredUserAccounts(apiParams);

      case 'starkNet_extractPrivateKey':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await extractPrivateKey(apiParams);

      case 'starkNet_extractPublicKey':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await extractPublicKey(apiParams);

      case 'starkNet_signMessage':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await signMessage(apiParams);

      case 'starkNet_signTransaction':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await signTransaction(apiParams);

      case 'starkNet_signDeclareTransaction':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await signDeclareTransaction(apiParams);

      case 'starkNet_signDeployAccountTransaction':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await signDeployAccountTransaction(apiParams);

      case 'starkNet_verifySignedMessage':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await verifySignedMessage(apiParams);

      case 'starkNet_getErc20TokenBalance':
        return await getErc20TokenBalance(apiParams);

      case 'starkNet_getTransactionStatus':
        return await getTransactionStatus(apiParams);

      case 'starkNet_sendTransaction':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await sendTransaction(apiParams);

      case 'starkNet_getValue':
        return await getValue(apiParams);

      case 'starkNet_estimateFee':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await estimateFee(apiParams);

      case 'starkNet_estimateAccountDeployFee':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await estimateAccDeployFee(apiParams);

      case 'starkNet_addErc20Token':
        return await addErc20Token(apiParams);

      case 'starkNet_getStoredErc20Tokens':
        return await getStoredErc20Tokens(apiParams);

      case 'starkNet_addNetwork':
        return await addNetwork(apiParams);

      case 'starkNet_switchNetwork':
        return await switchNetwork(apiParams);

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
        return await recoverAccounts(apiParams);

      case 'starkNet_executeTxn':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await executeTxn(apiParams);

      case 'starkNet_estimateFees':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await estimateFees(apiParams);

      case 'starkNet_upgradeAccContract':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return upgradeAccContract(apiParams);

      case 'starkNet_declareContract':
        apiParams.keyDeriver = await getAddressKeyDeriver(snap);
        return await declareContract(apiParams);

      case 'starkNet_getStarkName':
        return await getStarkName(apiParams);

      default:
        throw new Error('Method not found.');
    }
  } catch (err) {
    throw new InternalError(err);
  }
};

export const onInstall: OnInstallHandler = async () => {
  const component = panel([
    text('Your MetaMask wallet is now compatible with Starknet!'),
    text(
      `To manage your Starknet account and send and receive funds, visit the [companion dapp for Starknet](${dappUrl(
        process.env.SNAP_ENV,
      )}).`,
    ),
  ]);

  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: component,
    },
  });
};

export const onUpdate: OnUpdateHandler = async () => {
  const component = panel([text('Features released with this update:'), text('Cairo contract upgrade support.')]);

  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: component,
    },
  });
};

export const onHomePage: OnHomePageHandler = async () => {
  try {
    const state: SnapState = await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'get',
      },
    });

    if (!state) {
      throw new Error('State not found.');
    }

    // default network is testnet
    let network = STARKNET_SEPOLIA_TESTNET_NETWORK;

    if (state.currentNetwork && state.currentNetwork.chainId !== STARKNET_TESTNET_NETWORK.chainId) {
      network = state.currentNetwork;
    }

    // we only support 1 address at this moment
    const idx = 0;
    const keyDeriver = await getAddressKeyDeriver(snap);
    const { publicKey } = await getKeysFromAddressIndex(keyDeriver, network.chainId, state, idx);
    const { address } = await getCorrectContractAddress(network, publicKey);

    const ethToken = network.chainId === ETHER_SEPOLIA_TESTNET.chainId ? ETHER_SEPOLIA_TESTNET : ETHER_MAINNET;
    const balance = (await getBalance(address, ethToken.address, network)) ?? BigInt(0);
    const displayBalance = ethers.utils.formatUnits(ethers.BigNumber.from(balance), ethToken.decimals);

    const panelItems = [];
    panelItems.push(text('Address'));
    panelItems.push(copyable(`${address}`));
    panelItems.push(row('Network', text(`${network.name}`)));
    panelItems.push(row('Balance', text(`${displayBalance} ETH`)));
    panelItems.push(divider());
    panelItems.push(
      text(`Visit the [companion dapp for Starknet](${dappUrl(process.env.SNAP_ENV)}) to manage your account.`),
    );

    return {
      content: panel(panelItems),
    };
  } catch (err) {
    throw new InternalError(err);
  }
};
