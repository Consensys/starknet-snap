import {
  setInfoModalVisible,
  setMinVersionModalVisible,
  setUpgradeModalVisible,
  setDeployModalVisible,
} from 'slices/modalSlice';
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
  setLocale,
  setTranslations,
} from '../slices/walletSlice';
import Toastr from 'toastr2';
import {
  hexToString,
  retry,
  isGTEMinVersion,
  getTokenBalanceWithDetails,
  isUserDenyError,
} from '../utils/utils';
import { setWalletConnection } from '../slices/walletSlice';
import { Network } from '../types';
import { Account } from '../types';
import { Erc20TokenBalance, Erc20Token } from '../types';
import { disableLoading, enableLoadingWithMessage } from '../slices/UISlice';
import { Transaction } from 'types';
import { BigNumber, ethers } from 'ethers';
import { getAssetPriceUSD } from './coinGecko';
import semver from 'semver/preload';
import { setActiveNetwork } from 'slices/networkSlice';
import {
  Call,
  constants,
  Invocations,
  TransactionType,
  UniversalDetails,
} from 'starknet';

export const useStarkNetSnap = () => {
  const dispatch = useAppDispatch();
  const { loader } = useAppSelector((state) => state.UI);
  const { transactions, erc20TokenBalances, provider } = useAppSelector(
    (state) => state.wallet,
  );

  const snapId = process.env.REACT_APP_SNAP_ID
    ? process.env.REACT_APP_SNAP_ID
    : 'local:http://localhost:8081';
  const snapVersion = process.env.REACT_APP_SNAP_VERSION
    ? process.env.REACT_APP_SNAP_VERSION
    : '*';
  const minSnapVersion = process.env.REACT_APP_MIN_SNAP_VERSION
    ? process.env.REACT_APP_MIN_SNAP_VERSION
    : '2.0.1';
  const START_SCAN_INDEX = 0;
  const MAX_SCANNED = 1;
  const MAX_MISSED = 1;

  const defaultParam = {};

  const connectToSnap = () => {
    dispatch(enableLoadingWithMessage('Connecting...'));
    provider
      .request({
        method: 'wallet_requestSnaps',
        params: {
          [snapId]: { version: snapVersion },
        },
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
    provider
      .request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'ping',
            params: {
              ...defaultParam,
            },
          },
        },
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

  const loadLocale = async () => {
    try {
      const { locale } = await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_getPreferences',
          },
        },
      });
      const messages = await import(`../assets/locales/${locale}.json`);
      dispatch(setLocale(locale));
      dispatch(setTranslations(messages.messages));
    } catch (error) {
      console.error(
        'Failed to load user preferences. Falling back to default locale.',
        error,
      );
    }
  };

  const getNetworks = async () => {
    const data = (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: {
          method: 'starkNet_getStoredNetworks',
          params: {
            ...defaultParam,
          },
        },
      },
    })) as Network[];
    return data;
  };

  const getTokens = async (chainId: string) => {
    const tokens = (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: {
          method: 'starkNet_getStoredErc20Tokens',
          params: {
            ...defaultParam,
            chainId,
          },
        },
      },
    })) as Erc20Token[];
    return tokens;
  };

  const recoverAccounts = async (
    chainId: string,
    start: number = START_SCAN_INDEX,
    maxScan: number = MAX_SCANNED,
    maxMiss: number = MAX_MISSED,
  ) => {
    const scannedAccounts = (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: {
          method: 'starkNet_recoverAccounts',
          params: {
            ...defaultParam,
            startScanIndex: start,
            maxScanned: maxScan,
            maxMissed: maxMiss,
            chainId,
          },
        },
      },
    })) as Account[];
    return scannedAccounts;
  };

  const getAccounts = async (chainId: string) => {
    const data = (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: {
          method: 'starkNet_getStoredUserAccounts',
          params: {
            ...defaultParam,
            chainId,
          },
        },
      },
    })) as Account[];
    return data;
  };

  const addAccount = async (chainId: string) => {
    const data = (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: {
          method: 'starkNet_createAccount',
          params: {
            ...defaultParam,
            addressIndex: START_SCAN_INDEX,
            chainId,
            deploy: false,
          },
        },
      },
    })) as Account;
    return data;
  };

  const oldVersionDetected = async () => {
    const snaps = await provider.request({ method: 'wallet_getSnaps' });
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
      const net = await getCurrentNetwork();
      const idx = nets.findIndex((e) => e.chainId === net.chainId);
      dispatch(setActiveNetwork(idx));
      const chainId = net.chainId;
      await getWalletData(chainId, nets);
    } catch (err: any) {
      if (err.code && err.code === 4100) {
        const toastr = new Toastr();
        toastr.error('Snap is unaccessible or unauthorized');
        dispatch(setWalletConnection(false));
      }
      if (err.code && err.code === -32603) {
        //We have to make the user reinstall the snap after the flask update to 10.25.0
        //following the breaking change : snap_manageState now uses SIP-6 algorithm for encryption
        //This change breaks the old snap state, hence the reinstallation
        dispatch(setMinVersionModalVisible(true));
      }
      //eslint-disable-next-line no-console
      console.error('Error while Initializing wallet', err);
    } finally {
      dispatch(disableLoading());
    }
  };

  const getWalletData = async (chainId: string, networks?: Network[]) => {
    if (!loader.isLoading && !networks) {
      dispatch(enableLoadingWithMessage('Getting network data ...'));
    }
    const tokens = await getTokens(chainId);
    let acc: Account[] | Account = await recoverAccounts(chainId);
    let upgradeRequired = false;
    let deployRequired = false;
    deployRequired =
      (Array.isArray(acc)
        ? acc[0].deployRequired
        : (acc as Account).deployRequired) ?? false;
    if (!acc || acc.length === 0 || (!acc[0].publicKey && !deployRequired)) {
      acc = await addAccount(chainId);
    } else {
      upgradeRequired =
        (Array.isArray(acc)
          ? acc[0].upgradeRequired
          : (acc as Account).upgradeRequired) ?? false;
    }

    const accountAddr = Array.isArray(acc) ? acc[0].address : acc.address;

    // Get all tokens balance, USD value, and format them into Erc20TokenBalance type
    const tokensWithBalances: Erc20TokenBalance[] = await Promise.all(
      tokens.map(async (token) => {
        const balance = await getTokenBalance(
          token.address,
          accountAddr,
          chainId,
        );
        const usdPrice = await getAssetPriceUSD(token);
        return await getTokenBalanceWithDetails(balance, token, usdPrice);
      }),
    );
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
    dispatch(setUpgradeModalVisible(upgradeRequired && !deployRequired));
    dispatch(setDeployModalVisible(deployRequired));
    dispatch(disableLoading());
  };

  const setErc20TokenBalance = (erc20TokenBalance: Erc20TokenBalance) => {
    dispatch(setErc20TokenBalanceSelected(erc20TokenBalance));
  };

  async function getPrivateKeyFromAddress(address: string, chainId: string) {
    try {
      await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_displayPrivateKey',
            params: {
              ...defaultParam,
              address: address,
              chainId,
            },
          },
        },
      });
    } catch (err) {
      if (!isUserDenyError(err)) {
        throw err;
      }
    }
  }

  async function estimateFees(
    contractAddress: string,
    contractFuncName: string,
    contractCallData: string,
    address: string,
    chainId: string,
    transactionVersion?: typeof constants.TRANSACTION_VERSION.V3,
  ) {
    try {
      const invocations: Invocations = [
        {
          type: TransactionType.INVOKE,
          payload: {
            contractAddress,
            entrypoint: contractFuncName,
            calldata: contractCallData.split(',').map((ele) => ele.trim()),
          },
        },
      ];
      const response = await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_estimateFee',
            params: {
              ...defaultParam,
              address,
              invocations,
              details: { version: transactionVersion },
              chainId,
            },
          },
        },
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
    address: string,
    maxFee: string,
    chainId: string,
    feeToken: string,
  ) {
    dispatch(enableLoadingWithMessage('Sending transaction...'));
    try {
      const calls: Call[] = [
        {
          contractAddress,
          entrypoint: contractFuncName,
          calldata: contractCallData.split(',').map((ele) => ele.trim()),
        },
      ];
      const response = await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_executeTxn',
            params: {
              ...defaultParam,
              address,
              calls,
              details: {
                version:
                  feeToken === 'STRK'
                    ? constants.TRANSACTION_VERSION.V3
                    : undefined,
                maxFee,
              } as UniversalDetails,
              chainId,
            },
          },
        },
      });

      return response;
    } catch (err) {
      if (!isUserDenyError(err)) {
        throw err;
      }
    } finally {
      dispatch(disableLoading());
    }
  }

  const getTransactionStatus = async (
    transactionHash: string,
    chainId: string,
  ) => {
    try {
      const response = await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_getTransactionStatus',
            params: {
              ...defaultParam,
              transactionHash,
              chainId,
            },
          },
        },
      });
      return response;
    } catch (err) {
      //eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const readContract = async (
    contractAddress: string,
    contractFuncName: string,
  ) => {
    try {
      const response = await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_getValue',
            params: {
              ...defaultParam,
              contractAddress,
              contractFuncName,
            },
          },
        },
      });
      return response;
    } catch (err) {
      //eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const deployAccount = async (
    contractAddress: string,
    maxFee: string,
    chainId: string,
  ) => {
    dispatch(enableLoadingWithMessage('Deploying account...'));
    try {
      const response = await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_createAccountLegacy',
            params: {
              ...defaultParam,
              contractAddress,
              maxFee,
              chainId,
              deploy: true,
            },
          },
        },
      });
      return response;
    } catch (err) {
      if (!isUserDenyError(err)) {
        throw err;
      }
      return false;
    } finally {
      dispatch(disableLoading());
    }
  };

  const upgradeAccount = async (
    contractAddress: string,
    maxFee: string,
    chainId: string,
  ) => {
    dispatch(enableLoadingWithMessage('Upgrading account...'));
    try {
      const response = await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_upgradeAccContract',
            params: {
              ...defaultParam,
              contractAddress,
              maxFee,
              chainId,
            },
          },
        },
      });

      return response;
    } catch (err) {
      if (!isUserDenyError(err)) {
        throw err;
      }
      return false;
    } finally {
      dispatch(disableLoading());
    }
  };

  const getTransactions = async (
    senderAddress: string,
    contractAddress: string,
    txnsInLastNumOfDays: number,
    chainId: string,
    showLoading: boolean = true,
    onlyFromState: boolean = false,
  ) => {
    if (showLoading) {
      dispatch(enableLoadingWithMessage('Retrieving transactions...'));
    }

    try {
      const data = await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_getTransactions',
            params: {
              ...defaultParam,
              senderAddress,
              contractAddress,
              txnsInLastNumOfDays,
              chainId,
            },
          },
        },
      });

      let storedTxns = data;
      if (onlyFromState) {
        // Filter out stored txns that are not found in the retrieved txns
        const filteredTxns = transactions.filter((txn: Transaction) => {
          return !storedTxns.find((storedTxn: Transaction) =>
            ethers.BigNumber.from(storedTxn.txnHash).eq(
              ethers.BigNumber.from(txn.txnHash),
            ),
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
          txn.txnType === TransactionType.DEPLOY ||
          txn.txnType === TransactionType.DEPLOY_ACCOUNT,
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
    try {
      await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_addErc20Token',
            params: {
              ...defaultParam,
              tokenAddress,
              tokenName,
              tokenSymbol,
              tokenDecimals,
              chainId,
            },
          },
        },
      });

      const token = {
        address: tokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
        chainId,
      };

      const tokenBalance = await getTokenBalance(
        tokenAddress,
        accountAddress,
        chainId,
      );

      const usdPrice = await getAssetPriceUSD(token);
      const tokenWithBalance: Erc20TokenBalance = getTokenBalanceWithDetails(
        tokenBalance,
        token,
        usdPrice,
      );
      dispatch(upsertErc20TokenBalance(tokenWithBalance));
      return tokenWithBalance;
    } catch (err) {
      if (!isUserDenyError(err)) {
        throw err;
      }
      return null;
    } finally {
      dispatch(disableLoading());
    }
  };

  const updateTokenBalance = async (
    tokenAddress: string,
    accountAddress: string,
    chainId: string,
  ) => {
    const foundTokenWithBalance = erc20TokenBalances.find(
      (tokenBalance) =>
        ethers.BigNumber.from(tokenBalance.address).eq(
          ethers.BigNumber.from(tokenAddress),
        ) &&
        ethers.BigNumber.from(tokenBalance.chainId).eq(
          ethers.BigNumber.from(chainId),
        ),
    );
    if (foundTokenWithBalance) {
      const tokenBalance = await getTokenBalance(
        tokenAddress,
        accountAddress,
        chainId,
      );
      const usdPrice = await getAssetPriceUSD(foundTokenWithBalance);
      const tokenWithBalance: Erc20TokenBalance = getTokenBalanceWithDetails(
        tokenBalance,
        foundTokenWithBalance,
        usdPrice,
      );
      dispatch(upsertErc20TokenBalance(tokenWithBalance));
    }
  };

  const getTokenBalance = async (
    tokenAddress: string,
    userAddress: string,
    chainId: string,
  ) => {
    try {
      const response = await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_getErc20TokenBalance',
            params: {
              ...defaultParam,
              tokenAddress,
              userAddress,
              chainId,
            },
          },
        },
      });
      return {
        balance: BigNumber.from(response.balancePending),
      };
    } catch (err) {
      //eslint-disable-next-line no-console
      console.error(err);
      return {
        balance: BigNumber.from('0x0'),
      };
    }
  };

  const refreshTokensUSDPrice = async () => {
    if (erc20TokenBalances.length > 0) {
      const tokenUSDPrices = await Promise.all(
        erc20TokenBalances.map(async (token) => {
          return await getAssetPriceUSD(token);
        }),
      );

      const tokensRefreshed = erc20TokenBalances.map(
        (token, index): Erc20TokenBalance => {
          return {
            ...token,
            usdPrice: tokenUSDPrices[index],
          };
        },
      );
      dispatch(setErc20TokenBalances(tokensRefreshed));
    }
  };

  const waitForTransaction = async (
    transactionHash: string,
    chainId: string,
  ) => {
    let txStatus;
    const successStates = ['ACCEPTED_ON_L2', 'ACCEPTED_ON_L1'];
    const errorStates = ['REJECTED', 'NOT_RECEIVED'];

    const executeFn = async () => {
      txStatus = await getTransactionStatus(transactionHash, chainId);

      if (
        !txStatus ||
        !('executionStatus' in txStatus) ||
        !('finalityStatus' in txStatus)
      ) {
        return false;
      }

      if (
        txStatus.finalityStatus &&
        successStates.includes(txStatus.finalityStatus)
      ) {
        return true;
      } else if (
        txStatus.executionStatus &&
        errorStates.includes(txStatus.executionStatus)
      ) {
        const message = txStatus.executionStatus;
        throw new Error(message);
      }

      return false;
    };

    await retry(executeFn);

    return txStatus;
  };

  const waitForAccountCreation = async (
    transactionHash: string,
    accountAddress: string,
    chainId: string,
  ) => {
    dispatch(
      enableLoadingWithMessage('Waiting for transaction to be finalised.'),
    );
    const toastr = new Toastr();
    let result = false;

    try {
      // read transaction to check if the txn is ready
      await waitForTransaction(transactionHash, chainId);
    } catch (e) {
      //eslint-disable-next-line no-console
      console.log(`error while wait for transaction: ${e}`);
    }

    try {
      const executeFn = async (): Promise<boolean> => {
        // read contract to check if upgrade is required
        const resp = await readContract(accountAddress, 'getVersion');
        if (!resp || !resp[0]) {
          return false;
        }

        // recover accounts to update snap state
        await recoverAccounts(chainId);
        return true;
      };

      result = await retry(executeFn, {
        maxAttempts: 20,
      });
    } catch (e: any) {
      //eslint-disable-next-line no-console
      console.log(`error while processing waitForAccountDeploy: ${e}`);
      toastr.error('Snap is unable to verify the contract deploy process');
    }

    dispatch(disableLoading());

    return result;
  };

  const waitForAccountUpdate = async (
    transactionHash: string,
    accountAddress: string,
    chainId: string,
  ) => {
    dispatch(
      enableLoadingWithMessage('Waiting for transaction to be finalised.'),
    );
    const toastr = new Toastr();
    let result = false;

    try {
      // read transaction to check if the txn is ready
      await waitForTransaction(transactionHash, chainId);
    } catch (e) {
      //eslint-disable-next-line no-console
      console.log(`error while wait for transaction: ${e}`);
    }

    try {
      const executeFn = async (): Promise<boolean> => {
        // read contract to check if upgrade is required
        const resp = await readContract(accountAddress, 'getVersion');
        if (!resp || !resp[0]) {
          return false;
        }

        if (!isGTEMinVersion(hexToString(resp[0]))) {
          return false;
        }

        // recover accounts to update snap state
        await recoverAccounts(chainId);
        return true;
      };

      result = await retry(executeFn, {
        maxAttempts: 20,
      });
    } catch (e: any) {
      //eslint-disable-next-line no-console
      console.log(`error while processing waitForAccountUpdate: ${e}`);
      toastr.error('Snap is unable to verify the contract upgrade process');
    }

    dispatch(disableLoading());

    return result;
  };

  const switchNetwork = async (chainId: string) => {
    dispatch(enableLoadingWithMessage('Switching Network...'));
    try {
      const result = await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_switchNetwork',
            params: {
              ...defaultParam,
              chainId,
            },
          },
        },
      });
      dispatch(disableLoading());
      return result;
    } catch (err) {
      dispatch(disableLoading());
      return false;
    }
  };

  const getCurrentNetwork = async () => {
    try {
      return await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_getCurrentNetwork',
            params: {
              ...defaultParam,
            },
          },
        },
      });
    } catch (err) {
      throw err;
    }
  };

  const getStarkName = async (userAddress: string, chainId: string) => {
    try {
      return await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_getStarkName',
            params: {
              ...defaultParam,
              userAddress,
              chainId,
            },
          },
        },
      });
    } catch (err) {
      throw err;
    }
  };

  const getAddrFromStarkName = async (starkName: string, chainId: string) => {
    try {
      return await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_getAddrFromStarkName',
            params: {
              ...defaultParam,
              starkName,
              chainId,
            },
          },
        },
      });
    } catch (err) {
      throw err;
    }
  };

  return {
    connectToSnap,
    loadLocale,
    getNetworks,
    getAccounts,
    addAccount,
    setErc20TokenBalance,
    getPrivateKeyFromAddress,
    estimateFees,
    sendTransaction,
    upgradeAccount,
    deployAccount,
    getTransactions,
    getTransactionStatus,
    recoverAccounts,
    waitForTransaction,
    waitForAccountUpdate,
    waitForAccountCreation,
    updateTokenBalance,
    getTokenBalance,
    addErc20Token,
    getTokens,
    checkConnection,
    initSnap,
    getWalletData,
    refreshTokensUSDPrice,
    readContract,
    switchNetwork,
    getCurrentNetwork,
    getStarkName,
    getAddrFromStarkName,
    satisfiesVersion: oldVersionDetected,
  };
};
