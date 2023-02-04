import { setInfoModalVisible, setMinVersionModalVisible } from 'slices/modalSlice';
import { setNetworks } from 'slices/networkSlice';
import { useAppDispatch, useAppSelector } from 'hooks/redux';
import {
  setErc20TokenBalanceSelected,
  upsertErc20TokenBalance,
  setErc20TokenBalances,
  setAccounts,
  setTransactions,
  setTransactionDeploy,
  setForceReconnect,
} from '../slices/walletSlice';
import Toastr from 'toastr2';
import { addMissingPropertiesToToken } from '../utils/utils';
import { setWalletConnection } from '../slices/walletSlice';
import { Network, VoyagerTransactionType } from '../types';
import { Account } from '../types';
import { Erc20TokenBalance, Erc20Token } from '../types';
import { disableLoading, enableLoadingWithMessage } from '../slices/UISlice';
import { Transaction } from 'types';
import { ethers } from 'ethers';
import { getAssetPriceUSD } from './coinGecko';
import semver from 'semver/preload';

export const useStarkNetSnap = () => {
  const dispatch = useAppDispatch();
  const { loader } = useAppSelector((state) => state.UI);
  const { transactions, erc20TokenBalances } = useAppSelector((state) => state.wallet);
  const { activeNetwork } = useAppSelector((state) => state.networks);
  const { ethereum } = window as any;
  const snapId = process.env.REACT_APP_SNAP_ID ? process.env.REACT_APP_SNAP_ID : 'local:http://localhost:8081/';
  const snapVersion = process.env.REACT_APP_SNAP_VERSION ? process.env.REACT_APP_SNAP_VERSION : '*';
  const minSnapVersion = process.env.REACT_APP_MIN_SNAP_VERSION ? process.env.REACT_APP_MIN_SNAP_VERSION : '1.2.0';

  const connectToSnap = () => {
    dispatch(enableLoadingWithMessage('Connecting...'));
    ethereum
      .request({
        method: 'wallet_enable',
        params: [
          {
            wallet_snap: { [snapId]: { version: snapVersion } },
          },
        ],
      })
      .then(() => {
        dispatch(setWalletConnection(true));
        dispatch(setForceReconnect(false));
      })
      .catch(() => {
        dispatch(setWalletConnection(false));
        dispatch(disableLoading());
      });
  };

  const checkConnection = () => {
    dispatch(enableLoadingWithMessage('Connecting...'));
    ethereum
      .request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'ping',
          },
        ],
      })
      .then(() => {
        dispatch(setWalletConnection(true));
      })
      .catch((err: any) => {
        dispatch(setWalletConnection(false));
        dispatch(disableLoading());
        //eslint-disable-next-line no-console
        console.log(err);
      });
  };

  const getNetworks = async () => {
    const data = (await ethereum.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'starkNet_getStoredNetworks',
        },
      ],
    })) as Network[];
    return data;
  };

  const getTokens = async (chainId: string) => {
    const tokens = (await ethereum.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'starkNet_getStoredErc20Tokens',
          params: {
            chainId,
          },
        },
      ],
    })) as Erc20Token[];
    return tokens;
  };

  const recoverAccounts = async (chainId: string, useOldAccounts = false) => {
    const START_SCAN_INDEX = 0;
    const MAX_SCANNED = 1;
    const MAX_MISSED = 1;
    const scannedAccounts = (await ethereum.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'starkNet_recoverAccounts',
          params: {
            startScanIndex: START_SCAN_INDEX,
            maxScanned: MAX_SCANNED,
            maxMissed: MAX_MISSED,
            chainId,
            useOldAccounts,
          },
        },
      ],
    })) as Account[];
    return scannedAccounts;
  };

  const getAccounts = async (chainId: string) => {
    const data = (await ethereum.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'starkNet_getStoredUserAccounts',
          params: {
            chainId,
          },
        },
      ],
    })) as Account[];
    return data;
  };

  const addAccount = async (chainId: string, useOldAccounts = false) => {
    const data = (await ethereum.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'starkNet_createAccount',
          params: {
            addressIndex: 0,
            chainId,
            useOldAccounts,
            deploy: false,
          },
        },
      ],
    })) as Account;
    return data;
  };

  const oldVersionDetected = async () => {
    const snaps = await ethereum.request({ method: 'wallet_getSnaps' });
    if (typeof snaps[snapId]?.version !== 'undefined') {
      // console.log(`snaps[snapId][version]: ${snaps[snapId]?.version}`);
      // console.log(`snaps[snapId][version].split('_')[0]: ${snaps[snapId]?.version?.split('-')?.[0]}`);
      // console.log(`minSnapVersion: ${minSnapVersion}`);
      // console.log(`semver.lt: ${semver.lt(snaps[snapId]?.version?.split('-')?.[0], minSnapVersion)}`);
      return semver.lt(snaps[snapId]?.version?.split('-')?.[0], minSnapVersion);
    }
    return false;
  };

  const initSnap = async () => {
    if (await oldVersionDetected()) {
      dispatch(setMinVersionModalVisible(true));
      dispatch(disableLoading());
      return;
    }
    if (!loader.isLoading) {
      dispatch(enableLoadingWithMessage('Initializing wallet ...'));
    }
    try {
      const nets = await getNetworks();
      if (nets.length === 0) {
        return;
      }
      const chainId = nets[activeNetwork].chainId;
      const useOldAccounts = !!nets[activeNetwork].useOldAccounts;
      await getWalletData(chainId, useOldAccounts, nets);
    } catch (err: any) {
      if (err.code && err.code === 4100) {
        const toastr = new Toastr();
        toastr.error('Snap is unaccessible or unauthorized');
        dispatch(setWalletConnection(false));
      }
      //eslint-disable-next-line no-console
      console.error('Error while Initializing wallet', err);
    } finally {
      dispatch(disableLoading());
    }
  };

  const getWalletData = async (chainId: string, useOldAccounts = false, networks?: Network[]) => {
    if (!loader.isLoading && !networks) {
      dispatch(enableLoadingWithMessage('Getting network data ...'));
    }
    const tokens = await getTokens(chainId);
    let acc: Account[] | Account = await recoverAccounts(chainId, useOldAccounts);
    if (!acc || acc.length === 0 || !acc[0].publicKey) {
      if (useOldAccounts) {
        dispatch(enableLoadingWithMessage('Skipped deploying old version account ...'));
      } else {
        acc = await addAccount(chainId, useOldAccounts);
      }
    }
    const tokenBalances = await Promise.all(
      tokens.map(async (token) => {
        const accountAddr = Array.isArray(acc) ? acc[0].address : acc.address;
        return await getTokenBalance(token.address, accountAddr, chainId);
      }),
    );

    const tokenUSDPrices = await Promise.all(
      tokens.map(async (token) => {
        return await getAssetPriceUSD(token);
      }),
    );

    const tokensWithBalances = tokens.map((token, index): Erc20TokenBalance => {
      return addMissingPropertiesToToken(token, tokenBalances[index], tokenUSDPrices[index]);
    });
    if (networks) {
      dispatch(setNetworks(networks));
    }
    dispatch(setErc20TokenBalances(tokensWithBalances));
    dispatch(setAccounts(acc));
    if (tokensWithBalances.length > 0) {
      setErc20TokenBalance(tokensWithBalances[0]);
    }
    if (!Array.isArray(acc)) {
      dispatch(setInfoModalVisible(true));
    }
    dispatch(disableLoading());
  };

  const setErc20TokenBalance = (erc20TokenBalance: Erc20TokenBalance) => {
    dispatch(setErc20TokenBalanceSelected(erc20TokenBalance));
  };

  async function getPrivateKeyFromAddress(address: string, chainId: string, useOldAccounts = false) {
    try {
      await ethereum.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'starkNet_extractPrivateKey',
            params: {
              userAddress: address,
              chainId,
              useOldAccounts,
            },
          },
        ],
      });
    } catch (err) {
      //eslint-disable-next-line no-console
      console.error(err);
    }
  }

  async function estimateFees(
    contractAddress: string,
    contractFuncName: string,
    contractCallData: string,
    senderAddress: string,
    chainId: string,
    useOldAccounts = false,
  ) {
    try {
      const response = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'starkNet_estimateFee',
            params: {
              contractAddress,
              contractFuncName,
              contractCallData,
              senderAddress,
              chainId,
              useOldAccounts,
            },
          },
        ],
      });
      return response;
    } catch (err) {
      //eslint-disable-next-line no-console
      console.error(err);
    }
  }

  async function sendTransaction(
    contractAddress: string,
    contractFuncName: string,
    contractCallData: string,
    senderAddress: string,
    maxFee: string,
    chainId: string,
    useOldAccounts = false,
  ) {
    dispatch(enableLoadingWithMessage('Sending transaction...'));
    try {
      const response = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'starkNet_sendTransaction',
            params: {
              contractAddress,
              contractFuncName,
              contractCallData,
              senderAddress,
              maxFee,
              chainId,
              useOldAccounts,
            },
          },
        ],
      });
      dispatch(disableLoading());
      return response;
    } catch (err) {
      dispatch(disableLoading());
      //eslint-disable-next-line no-console
      console.error(err);
      throw err;
    }
  }

  const getTransactions = async (
    senderAddress: string,
    contractAddress: string,
    pageSize: number,
    txnsInLastNumOfDays: number,
    chainId: string,
    showLoading: boolean = true,
    onlyFromState: boolean = false,
  ) => {
    if (showLoading) {
      dispatch(enableLoadingWithMessage('Retrieving transactions...'));
    }

    try {
      const data = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'starkNet_getTransactions',
            params: {
              senderAddress,
              contractAddress,
              pageSize,
              txnsInLastNumOfDays,
              onlyFromState,
              withDeployTxn: true,
              chainId,
            },
          },
        ],
      });

      let storedTxns = data;
      if (onlyFromState) {
        // Filter out stored txns that are not found in the retrieved txns
        const filteredTxns = transactions.filter((txn: Transaction) => {
          return !storedTxns.find((storedTxn: Transaction) =>
            ethers.BigNumber.from(storedTxn.txnHash).eq(ethers.BigNumber.from(txn.txnHash)),
          );
        });

        // sort in timestamp descending order
        storedTxns = [...storedTxns, ...filteredTxns].sort(
          (a: Transaction, b: Transaction) => b.timestamp - a.timestamp,
        );
      }

      //Set the deploy transaction
      const deployTransaction = storedTxns.find(
        (txn: Transaction) =>
          txn.txnType.toLowerCase() === VoyagerTransactionType.DEPLOY ||
          txn.txnType.toLowerCase() === VoyagerTransactionType.DEPLOY_ACCOUNT,
      );
      dispatch(setTransactionDeploy(deployTransaction));

      dispatch(setTransactions(storedTxns));

      if (showLoading) {
        dispatch(disableLoading());
      }
      return data;
    } catch (err) {
      dispatch(disableLoading());
      dispatch(setTransactions([]));
      console.error(err);
    }
  };

  const addErc20Token = async (
    tokenAddress: string,
    tokenName: string,
    tokenSymbol: string,
    tokenDecimals: number,
    chainId: string,
    accountAddress: string,
  ) => {
    dispatch(enableLoadingWithMessage('Adding Token...'));
    const token = await ethereum.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'starkNet_addErc20Token',
          params: {
            tokenAddress,
            tokenName,
            tokenSymbol,
            tokenDecimals,
            chainId,
          },
        },
      ],
    });
    const tokenBalance = await getTokenBalance(tokenAddress, accountAddress, chainId);
    const usdPrice = await getAssetPriceUSD(token);
    const tokenWithBalance: Erc20TokenBalance = addMissingPropertiesToToken(token, tokenBalance, usdPrice);
    dispatch(upsertErc20TokenBalance(tokenWithBalance));
    dispatch(disableLoading());
    return tokenWithBalance;
  };

  const updateTokenBalance = async (tokenAddress: string, accountAddress: string, chainId: string) => {
    const foundTokenWithBalance = erc20TokenBalances.find(
      (tokenBalance) =>
        ethers.BigNumber.from(tokenBalance.address).eq(ethers.BigNumber.from(tokenAddress)) &&
        ethers.BigNumber.from(tokenBalance.chainId).eq(ethers.BigNumber.from(chainId)),
    );
    if (foundTokenWithBalance) {
      const tokenBalance = await getTokenBalance(tokenAddress, accountAddress, chainId);
      const usdPrice = await getAssetPriceUSD(foundTokenWithBalance);
      const tokenWithBalance: Erc20TokenBalance = addMissingPropertiesToToken(
        foundTokenWithBalance,
        tokenBalance,
        usdPrice,
      );
      dispatch(upsertErc20TokenBalance(tokenWithBalance));
    }
  };

  const getTokenBalance = async (tokenAddress: string, userAddress: string, chainId: string) => {
    try {
      const response = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'starkNet_getErc20TokenBalance',
            params: {
              tokenAddress,
              userAddress,
              chainId,
            },
          },
        ],
      });
      return response;
    } catch (err) {
      //eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const refreshTokensUSDPrice = async () => {
    if (erc20TokenBalances.length > 0) {
      const tokenUSDPrices = await Promise.all(
        erc20TokenBalances.map(async (token) => {
          return await getAssetPriceUSD(token);
        }),
      );

      const tokensRefreshed = erc20TokenBalances.map((token, index): Erc20TokenBalance => {
        return {
          ...token,
          usdPrice: tokenUSDPrices[index],
        };
      });
      dispatch(setErc20TokenBalances(tokensRefreshed));
    }
  };

  return {
    connectToSnap,
    getNetworks,
    getAccounts,
    addAccount,
    setErc20TokenBalance,
    getPrivateKeyFromAddress,
    estimateFees,
    sendTransaction,
    getTransactions,
    updateTokenBalance,
    getTokenBalance,
    addErc20Token,
    getTokens,
    checkConnection,
    initSnap,
    getWalletData,
    refreshTokensUSDPrice,
    satisfiesVersion: oldVersionDetected,
  };
};
