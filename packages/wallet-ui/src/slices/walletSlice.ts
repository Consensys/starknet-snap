import { createSlice } from '@reduxjs/toolkit';
import { Account, Locale } from 'types';
import { Erc20TokenBalance } from 'types';
import { Transaction } from 'types';
import { ethers } from 'ethers';
import { defaultAccount } from 'utils/constants';
import defaultLocale from '../assets/locales/en.json';
import { constants } from 'starknet';

export interface WalletState {
  connected: boolean;
  isLoading: boolean;
  locale: string;
  translations: Locale;
  forceReconnect: boolean;
  accounts: Account[];
  currentAccount: Account;
  erc20TokenBalances: Erc20TokenBalance[];
  erc20TokenBalanceSelected: Erc20TokenBalance;
  transactions: Transaction[];
  transactionDeploy?: Transaction;
  provider?: any; //TODO: metamask SDK is not export types
  visibility: {
    [key: string]: Record<string, boolean>;
  };
}

const initialState: WalletState = {
  connected: false,
  isLoading: false,
  locale: 'en',
  translations: defaultLocale.messages,
  forceReconnect: false,
  accounts: [],
  currentAccount: defaultAccount,
  erc20TokenBalances: [],
  erc20TokenBalanceSelected: {} as Erc20TokenBalance,
  transactions: [],
  transactionDeploy: undefined,
  provider: undefined,
  visibility: {
    [constants.StarknetChainId.SN_MAIN]: {},
    [constants.StarknetChainId.SN_SEPOLIA]: {},
  },
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setAccountVisibility: (state, { payload }) => {
      const { chainId, index, visibility } = payload;
      state.visibility[chainId][index] = visibility;
    },
    setLocale: (state, { payload }) => {
      state.locale = payload;
    },
    setTranslations: (state, { payload }) => {
      state.translations = payload;
    },
    setProvider: (state, { payload }) => {
      state.provider = payload;
    },
    setWalletConnection: (state, { payload }) => {
      state.connected = payload;
    },
    setForceReconnect: (state, { payload }) => {
      state.forceReconnect = payload;
    },
    setAccounts: (
      state,
      {
        payload,
      }: {
        payload: Account | Account[];
      },
    ) => {
      const accountsToInsert = Array.isArray(payload) ? payload : [payload];

      const accountSet = new Set(
        state.accounts.map((account) => account.address),
      );

      for (const account of accountsToInsert) {
        if (!accountSet.has(account.address)) {
          state.accounts.push(account);
        }
      }

      const chainId = accountsToInsert[0].chainId;
      // There may be a edge case:
      // - User delete and resintall the SNAP, but the previous visibility is still presisted.
      // When resintalling a SNAP, it will flush the SNAP data and hence only 1 account will be returned.
      // Therefore we can assuming when only 1 account exist, we should reset the visibility.
      if (state.accounts.length === 1) {
        state.visibility[chainId] = {};
      }
    },
    updateAccount: (
      state,
      { payload }: { payload: { address: string; updates: Partial<Account> } },
    ) => {
      state.accounts = state.accounts.map((account) =>
        account.address === payload.address
          ? { ...account, ...payload.updates }
          : account,
      );
    },
    setCurrentAccount: (state, { payload }: { payload: Account }) => {
      state.currentAccount = payload;
    },
    updateCurrentAccount: (
      state,
      { payload }: { payload: Partial<Account> },
    ) => {
      if (state.currentAccount) {
        state.currentAccount = { ...state.currentAccount, ...payload };
      }
    },
    setErc20TokenBalances: (state, { payload }) => {
      state.erc20TokenBalances = payload;
    },
    upsertErc20TokenBalance: (state, { payload }) => {
      // only update erc20TokenBalances if same chainId as selected token
      if (state.erc20TokenBalanceSelected.chainId === payload.chainId) {
        const foundIndex = state.erc20TokenBalances.findIndex(
          (token) =>
            ethers.BigNumber.from(token.address).eq(
              ethers.BigNumber.from(payload.address),
            ) &&
            ethers.BigNumber.from(token.chainId).eq(
              ethers.BigNumber.from(payload.chainId),
            ),
        );
        if (foundIndex < 0) {
          state.erc20TokenBalances.push(payload);
        } else {
          state.erc20TokenBalances[foundIndex].amount = payload.amount;
          state.erc20TokenBalances[foundIndex].usdPrice = payload.usdPrice;

          if (
            state.erc20TokenBalanceSelected.address ===
              state.erc20TokenBalances[foundIndex].address &&
            state.erc20TokenBalanceSelected.chainId ===
              state.erc20TokenBalances[foundIndex].chainId
          ) {
            state.erc20TokenBalanceSelected.amount =
              state.erc20TokenBalances[foundIndex].amount;
            state.erc20TokenBalanceSelected.usdPrice =
              state.erc20TokenBalances[foundIndex].usdPrice;
          }
        }
      }
    },
    setErc20TokenBalanceSelected: (state, { payload }) => {
      state.erc20TokenBalanceSelected = payload;
    },
    setTransactions: (state, { payload }) => {
      state.transactions = payload;
    },
    setTransactionDeploy: (state, { payload }) => {
      state.transactionDeploy = payload;
    },
    clearAccounts: (state) => {
      state.accounts = [];
      state.currentAccount = defaultAccount;
    },
    resetWallet: (state) => {
      return {
        ...initialState,
        provider: state.provider,
        forceReconnect: true,
      };
    },
  },
});

export const {
  setAccountVisibility,
  setWalletConnection,
  setForceReconnect,
  setCurrentAccount,
  updateCurrentAccount,
  setAccounts,
  updateAccount,
  clearAccounts,
  setErc20TokenBalances,
  setErc20TokenBalanceSelected,
  upsertErc20TokenBalance,
  setTransactions,
  setTransactionDeploy,
  resetWallet,
  setProvider,
  setTranslations,
  setLocale,
} = walletSlice.actions;

export default walletSlice.reducer;
