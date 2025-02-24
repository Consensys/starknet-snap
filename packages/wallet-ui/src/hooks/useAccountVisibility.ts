import { useMemo } from 'react';

import { useStarkNetSnap } from 'services';
import { Account } from 'types';
import { setAccountVisibility } from 'slices/walletSlice';
import { useAppDispatch, useAppSelector } from './redux';
import { useCurrentNetwork } from './useCurrentNetwork';
import { useCurrentAccount } from './useCurrentAccount';

export class MinAccountToHideError extends Error {}

export class SwitchAccountError extends Error {}

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
  const accounts = useAppSelector((state) => state.wallet.accounts);
  const chainId = currentNework?.chainId;

  // Use useMemo to avoid re-rendering the component when the state changes
  const [visibleAccounts, hiddenAccounts] = useMemo(() => {
    const visibleAccounts: Account[] = [];
    const hiddenAccounts: Account[] = [];
    for (const account of accounts) {
      // account.visibility = `undefined` refer to the case when previous account state doesnt include this field
      // hence we consider it is `visible`
      if (
        !Object.prototype.hasOwnProperty.call(
          visibilities,
          account.addressIndex,
        ) ||
        visibilities[account.addressIndex] === true
      ) {
        visibleAccounts.push(account);
      } else {
        hiddenAccounts.push(account);
      }
    }
    return [visibleAccounts, hiddenAccounts];
  }, [accounts, visibilities, chainId]);

  const hideAccount = async (account: Account) => {
    if (visibleAccounts.length < 2) {
      throw new MinAccountToHideError();
    }

    toggleAccountVisibility(account, false);

    if (account.addressIndex === currentAccount.addressIndex) {
      // Find the next account by using the next ascending addressIndex.
      const nextAccount = visibleAccounts
        .sort((a, b) => a.addressIndex - b.addressIndex)
        .find(
          (account) => account.addressIndex !== currentAccount.addressIndex,
        );

      if (nextAccount) {
        if ((await switchAccount(chainId, account.address)) === undefined) {
          // `switchAccount` will not return an account if it fails / error
          // Therefore, when account switch fails, we need to rollback the state
          toggleAccountVisibility(account, true);
          throw new SwitchAccountError();
        }
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
    visibleAccounts,
    hiddenAccounts,
    showAccount,
    hideAccount,
  };
};
