import { BigNumber, ethers } from 'ethers';
import Toastr from 'toastr2';
import {
  Call,
  constants,
  Invocations,
  TransactionType,
  UniversalDetails,
} from 'starknet';

import { useAppDispatch, useAppSelector } from 'hooks/redux';
import {
  setMinVersionModalVisible,
  setUpgradeModalVisible,
  setDeployModalVisible,
  setForceReconnectModalVisible,
} from 'slices/modalSlice';
import {
  setErc20TokenBalanceSelected,
  upsertErc20TokenBalance,
  setErc20TokenBalances,
  setAccounts,
  setCurrentAccount,
  setTransactions,
  setTransactionDeploy,
  setForceReconnect,
  setLocale,
  setTranslations,
  updateAccount,
  updateCurrentAccount,
  setWalletConnection,
} from 'slices/walletSlice';
import { setNetworksAndActiveNetwork } from 'slices/networkSlice';
import { disableLoading, enableLoadingWithMessage } from 'slices/UISlice';
import {
  Transaction,
  Account,
  FeeToken,
  FeeTokenUnit,
  Network,
  Erc20TokenBalance,
  Erc20Token,
} from 'types';
import {
  hexToString,
  retry,
  isGTEMinVersion,
  getTokenBalanceWithDetails,
  isUserDenyError,
  shortenAddress,
} from 'utils/utils';
import { getAssetPriceUSD } from './coinGecko';
import { useSnap } from './useSnap';

export const useStarkNetSnap = () => {
  const dispatch = useAppDispatch();
  const { invokeSnap, isSnapRequireUpdate, requestSnap, ping } = useSnap();
  const { loader } = useAppSelector((state) => state.UI);
  const erc20TokenBalances = useAppSelector(
    (state) => state.wallet.erc20TokenBalances,
  );
  const accounts = useAppSelector((state) => state.wallet.accounts);

  const connectToSnap = async () => {
    dispatch(enableLoadingWithMessage('Connecting...'));
    try {
      await requestSnap();
      dispatch(setWalletConnection(true));
      dispatch(setForceReconnect(false));
    } catch (error) {
      dispatch(setWalletConnection(false));
    } finally {
      dispatch(disableLoading());
    }
  };

  const checkConnection = async () => {
    dispatch(enableLoadingWithMessage('checking connection...'));
    try {
      await ping();
      dispatch(setWalletConnection(true));
    } catch (error) {
      dispatch(setWalletConnection(false));
    } finally {
      dispatch(disableLoading());
    }
  };

  const loadLocale = async () => {
    try {
      const { locale } = await invokeSnap<{
        locale: string;
      }>({
        method: 'starkNet_getPreferences',
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
    return await invokeSnap<Network[]>({
      method: 'starkNet_getStoredNetworks',
      params: {},
    });
  };

  const getTokens = async (chainId: string) => {
    return await invokeSnap<Erc20Token[]>({
      method: 'starkNet_getStoredErc20Tokens',
      params: {
        chainId,
      },
    });
  };

  const getAccounts = async (chainId: string) => {
    return await invokeSnap<Account[]>({
      method: 'starkNet_listAccounts',
      params: {
        chainId,
      },
    });
  };

  const requestUpgradeSnap = () => {
    dispatch(setMinVersionModalVisible(true));
  };

  const completeUpgradeSnap = async () => {
    dispatch(setMinVersionModalVisible(false));
    await connectToSnap();
    await initSnap();
  };

  const initSnap = async () => {
    if (await isSnapRequireUpdate()) {
      requestUpgradeSnap();
      return;
    }

    if (!loader.isLoading) {
      dispatch(enableLoadingWithMessage('Initializing wallet ...'));
    }
    try {
      await loadLocale();

      const networks = await getNetworks();
      if (networks.length === 0) {
        console.error('No networks found');
        return;
      }

      const currentNetwork = await getCurrentNetwork();
      const idx = networks.findIndex(
        (network) => network.chainId === currentNetwork.chainId,
      );

      dispatch(
        setNetworksAndActiveNetwork({
          networks,
          activeNetwork: idx,
        }),
      );

      await initWalletData({
        chainId: currentNetwork.chainId,
      });
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
        dispatch(setForceReconnectModalVisible(true));
      }
      //eslint-disable-next-line no-console
      console.error('Error while Initializing wallet', err);
    } finally {
      dispatch(disableLoading());
    }
  };

  const initWalletData = async ({
    account,
    chainId,
  }: {
    account?: Account;
    chainId: string;
  }) => {
    if (!loader.isLoading) {
      dispatch(enableLoadingWithMessage('Getting network data ...'));
    }

    let currentAccount = account;
    if (!currentAccount) {
      currentAccount = await getCurrentAccount(chainId);
    }

    await setAccount(chainId, currentAccount);

    const { address } = currentAccount;

    await initTokensAndBalances(chainId, address);

    dispatch(disableLoading());
  };

  const setAccount = async (chainId: string, currentAccount: Account) => {
    const { upgradeRequired, deployRequired } = currentAccount;

    dispatch(setCurrentAccount(currentAccount));

    // if no accounts from state, we fetch the accounts from snap
    if (!accounts || accounts.length === 0) {
      const accounts = await getAccounts(chainId);
      dispatch(setAccounts(accounts));
    }

    // TODO: hardcode to set the info modal visible,
    // but it should only visible when the account is not deployed
    // dispatch(setInfoModalVisible(true));
    dispatch(setUpgradeModalVisible(upgradeRequired));
    dispatch(setDeployModalVisible(deployRequired));
  };

  const setErc20TokenBalance = (erc20TokenBalance: Erc20TokenBalance) => {
    dispatch(setErc20TokenBalanceSelected(erc20TokenBalance));
  };

  const initTokensAndBalances = async (chainId: string, address: string) => {
    const tokens = await getTokens(chainId);

    // Get all tokens balance, USD value, and format them into Erc20TokenBalance type
    const tokensWithBalances: Erc20TokenBalance[] = await Promise.all(
      tokens.map(async (token) => {
        const balance = await getTokenBalance(token.address, address, chainId);
        const usdPrice = await getAssetPriceUSD(token);
        return await getTokenBalanceWithDetails(balance, token, usdPrice);
      }),
    );

    dispatch(setErc20TokenBalances(tokensWithBalances));

    if (tokensWithBalances.length > 0) {
      setErc20TokenBalance(tokensWithBalances[0]);
    }
  };

  async function getPrivateKeyFromAddress(address: string, chainId: string) {
    try {
      await invokeSnap<null>({
        method: 'starkNet_displayPrivateKey',
        params: {
          address: address,
          chainId,
        },
      });
    } catch (error) {
      if (!isUserDenyError(error)) {
        throw error;
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

    return await invokeSnap<{
      suggestedMaxFee: string;
      unit: FeeTokenUnit;
      includeDeploy: boolean;
    }>({
      method: 'starkNet_estimateFee',
      params: {
        address,
        invocations,
        details: { version: transactionVersion },
        chainId,
      },
    });
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

      const response = await invokeSnap<{
        transaction_hash: string;
      }>({
        method: 'starkNet_executeTxn',
        params: {
          address,
          calls,
          details: {
            version:
              feeToken === FeeToken.STRK
                ? constants.TRANSACTION_VERSION.V3
                : undefined,
            maxFee,
          } as UniversalDetails,
          chainId,
        },
      });

      return response;
    } catch (error) {
      if (!isUserDenyError(error)) {
        throw error;
      }
    } finally {
      dispatch(disableLoading());
    }
  }

  const getTransactionStatus = async (
    transactionHash: string,
    chainId: string,
  ) => {
    return await invokeSnap<{
      executionStatus?: string;
      finalityStatus?: string;
    }>({
      method: 'starkNet_getTransactionStatus',
      params: {
        transactionHash,
        chainId,
      },
    });
  };

  const readContract = async <Resp>(
    contractAddress: string,
    contractFuncName: string,
  ) => {
    return await invokeSnap<Resp>({
      method: 'starkNet_getValue',
      params: {
        contractAddress,
        contractFuncName,
      },
    });
  };

  const deployAccount = async (
    contractAddress: string,
    maxFee: string,
    chainId: string,
  ) => {
    dispatch(enableLoadingWithMessage('Deploying account...'));
    try {
      const response = await invokeSnap<{
        transaction_hash: string;
      }>({
        method: 'starkNet_createAccountLegacy',
        params: {
          contractAddress,
          maxFee,
          chainId,
          deploy: true,
        },
      });
      return response;
    } catch (error) {
      if (!isUserDenyError(error)) {
        throw error;
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
      const response = await invokeSnap<{
        transaction_hash: string;
      }>({
        method: 'starkNet_upgradeAccContract',
        params: {
          contractAddress,
          maxFee,
          chainId,
        },
      });
      return response;
    } catch (error) {
      if (!isUserDenyError(error)) {
        throw error;
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
      const data = await invokeSnap<Array<Transaction>>({
        method: 'starkNet_getTransactions',
        params: {
          senderAddress,
          contractAddress,
          txnsInLastNumOfDays,
          chainId,
        },
      });

      let storedTxns = data;

      //Set the deploy transaction
      const deployTransaction = storedTxns.find(
        (txn: Transaction) =>
          txn.txnType === TransactionType.DEPLOY ||
          txn.txnType === TransactionType.DEPLOY_ACCOUNT,
      );
      dispatch(setTransactionDeploy(deployTransaction));

      dispatch(setTransactions(storedTxns));

      return data;
    } catch (error) {
      dispatch(setTransactions([]));
    } finally {
      if (showLoading) {
        dispatch(disableLoading());
      }
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
      await invokeSnap<null>({
        method: 'starkNet_addErc20Token',
        params: {
          tokenAddress,
          tokenName,
          tokenSymbol,
          tokenDecimals,
          chainId,
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
    } catch (error) {
      if (!isUserDenyError(error)) {
        throw error;
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
      const response = await invokeSnap<{
        balancePending: string;
      }>({
        method: 'starkNet_getErc20TokenBalance',
        params: {
          tokenAddress,
          userAddress,
          chainId,
        },
      });
      return {
        balance: BigNumber.from(response.balancePending),
      };
    } catch (error) {
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
        const resp = await readContract<string[]>(accountAddress, 'getVersion');
        if (!resp || !resp[0]) {
          return false;
        }

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
        const resp = await readContract<string[]>(accountAddress, 'getVersion');
        if (!resp || !resp[0]) {
          return false;
        }

        if (!isGTEMinVersion(hexToString(resp[0]))) {
          return false;
        }

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
      return await invokeSnap<boolean>({
        method: 'starkNet_switchNetwork',
        params: {
          chainId,
        },
      });
    } catch (error) {
      dispatch(disableLoading());
      return false;
    }
  };

  const getCurrentNetwork = async () => {
    return await invokeSnap<Network>({
      method: 'starkNet_getCurrentNetwork',
    });
  };

  const getStarkName = async (userAddress: string, chainId: string) => {
    return await invokeSnap<string>({
      method: 'starkNet_getStarkName',
      params: {
        userAddress,
        chainId,
      },
    });
  };

  const getAddrFromStarkName = async (starkName: string, chainId: string) => {
    return await invokeSnap<string>({
      method: 'starkNet_getAddrFromStarkName',
      params: {
        starkName,
        chainId,
      },
    });
  };

  const addNewAccount = async (chainId: string, accountName?: string) => {
    dispatch(enableLoadingWithMessage('Adding new account...'));
    try {
      const account = await invokeSnap<Account>({
        method: 'starkNet_addAccount',
        params: {
          chainId,
          accountName,
        },
      });

      await initWalletData({
        account,
        chainId,
      });

      // push the current account into state
      dispatch(setAccounts(account));

      return account;
    } catch (err: any) {
      const toastr = new Toastr();
      toastr.error(err.message as unknown as string);
    } finally {
      dispatch(disableLoading());
    }
  };

  const getCurrentAccount = async (chainId: string) => {
    return await invokeSnap<Account>({
      method: 'starkNet_getCurrentAccount',
      params: {
        chainId,
      },
    });
  };

  const toggleAccountVisibility = async (
    chainId: string,
    address: string,
    visibility: boolean,
  ) => {
    return await invokeSnap<Account>({
      method: 'starkNet_toggleAccountVisibility',
      params: {
        chainId,
        address,
        visibility,
      },
    });
  };

  const updateAccountName = async (
    chainId: string,
    address: string,
    accountName: string,
  ) => {
    try {
      dispatch(enableLoadingWithMessage('Changing Account Name...'));
      await invokeSnap<Account>({
        method: 'starkNet_setAccountName',
        params: {
          chainId,
          address,
          accountName,
        },
      });
      dispatch(updateAccount({ address, updates: { accountName } }));
      dispatch(updateCurrentAccount({ accountName }));
    } catch (err: any) {
      const toastr = new Toastr();
      toastr.error(err.message as unknown as string);
    } finally {
      dispatch(disableLoading());
    }
  };

  const switchAccount = async (chainId: string, address: string) => {
    dispatch(
      enableLoadingWithMessage(
        `Switching Account to ${shortenAddress(address)}`,
      ),
    );
    try {
      const account = await invokeSnap<Account>({
        method: 'starkNet_switchAccount',
        params: {
          chainId,
          address,
        },
      });

      await initWalletData({
        account,
        chainId,
      });

      return account;
    } catch (err: any) {
      const toastr = new Toastr();
      toastr.error(err.message as unknown as string);
    } finally {
      dispatch(disableLoading());
    }
  };

  return {
    completeUpgradeSnap,
    connectToSnap,
    loadLocale,
    getNetworks,
    getAccounts,
    switchAccount,
    getCurrentAccount,
    addNewAccount,
    toggleAccountVisibility,
    updateAccountName,
    setAccount,
    setErc20TokenBalance,
    getPrivateKeyFromAddress,
    estimateFees,
    sendTransaction,
    upgradeAccount,
    deployAccount,
    getTransactions,
    getTransactionStatus,
    waitForTransaction,
    waitForAccountUpdate,
    waitForAccountCreation,
    updateTokenBalance,
    getTokenBalance,
    addErc20Token,
    getTokens,
    checkConnection,
    initSnap,
    initWalletData,
    refreshTokensUSDPrice,
    readContract,
    switchNetwork,
    getCurrentNetwork,
    getStarkName,
    getAddrFromStarkName,
  };
};
