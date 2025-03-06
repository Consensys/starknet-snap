import { useMemo } from 'react';

import { useStarkNetSnap } from 'services';
import { Account } from 'types';
import { setAccountVisibility } from 'slices/walletSlice';
import { useAppDispatch, useAppSelector } from './redux';
import { useCurrentNetwork } from './useCurrentNetwork';
import { useCurrentAccount } from './useCurrentAccount';
import { useAccountList } from './useAccountList';

export class MinAccountToHideError extends Error {}

export class SwitchAccountError extends Error {}

export class NoAvailableAccount extends Error {}

/**
 * Verify if the account is visible or not
 *
 * @param account - The account to verify.
 * @param visibilities - The visibility record set.
 * @returns - true if the account is visible, false otherwise.
 */
const isVisible = (account: Account, visibilities: Record<string, boolean>) => {
  // If the account index not found in the visibility record set, default to visible.
  return visibilities[account.addressIndex] ?? true;
};

/**
 * Get the next visible account with the following rules:
 * - return the first visible account that has larger addressIndex if there is one.
 * - return the first visible account if above condition not fit.
 * @param account - The current account.
 * @param accounts - The list of accounts.
 * @param visibilities - The visibility record set.
 * @returns - next visible account.
 * @throws - NoAvailableAccount error if no visible account found.
 */
const getNextVisibleAccount = ({
  account,
  accounts,
  visibilities,
}: {
  account: Account;
  accounts: Account[];
  visibilities: Record<string, boolean>;
}): Account => {
  for (const nextAccount of accounts) {
    // pick the first visible account that has larger addressIndex that the current
    if (
      nextAccount.addressIndex > account.addressIndex &&
      isVisible(nextAccount, visibilities)
    ) {
      return nextAccount;
    }
  }
  // Otherwise, return the first visible account
  if (accounts.length > 0 && isVisible(accounts[0], visibilities)) {
    return accounts[0];
  }
  // If no visible account found, throw an error
  throw new NoAvailableAccount();
};

/**
 * A hook to manage account visibility
 *
 * @returns {visibleAccounts, hiddenAccounts, showAccount, hideAccount}
 */
export const useAccountVisibility = () => {
  const dispatch = useAppDispatch();
  const { switchAccount } = useStarkNetSnap();
  const currentNework = useCurrentNetwork();
  const currentAccount = useCurrentAccount();
  const visibilities = useAppSelector(
    (state) => state.wallet.visibility[currentNework.chainId],
  );
  const accounts = useAccountList();
  const chainId = currentNework?.chainId;

  // Use useMemo to avoid re-rendering the component when the state changes
  const [visibleAccounts, hiddenAccounts] = useMemo(() => {
    const visibleAccounts: Account[] = [];
    const hiddenAccounts: Account[] = [];
    for (const account of accounts) {
      if (isVisible(account, visibilities)) {
        visibleAccounts.push(account);
      } else {
        hiddenAccounts.push(account);
      }
    }
    return [visibleAccounts, hiddenAccounts];
  }, [accounts, visibilities]);

  const canHideAccount = visibleAccounts.length > 1;

  const hideAccount = async (account: Account) => {
    if (!canHideAccount) {
      throw new MinAccountToHideError();
    }

    toggleAccountVisibility(account, false);

    if (account.addressIndex === currentAccount.addressIndex) {
      const nextAccount = getNextVisibleAccount({
        account,
        accounts,
        visibilities,
      });

      if ((await switchAccount(chainId, nextAccount.address)) === undefined) {
        // `switchAccount` will not return an account if it fails / error
        // Therefore, when account switch fails, we need to rollback the state
        toggleAccountVisibility(account, true);
        throw new SwitchAccountError();
      }
    }
  };

  const showAccount = async (account: Account) => {
    toggleAccountVisibility(account, true);
  };

  const toggleAccountVisibility = (account: Account, visibility: boolean) => {
    dispatch(
      setAccountVisibility({
        chainId,
        index: account.addressIndex,
        visibility: visibility,
      }),
    );
  };

  return {
    canHideAccount,
    visibleAccounts,
    hiddenAccounts,
    showAccount,
    hideAccount,
  };
};
