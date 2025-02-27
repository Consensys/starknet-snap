import { useMemo } from 'react';

import { Account } from 'types';
import { useStarkNetSnap } from 'services';
import { useAppSelector } from './redux';
import { useCurrentAccount } from './useCurrentAccount';
import { useCurrentNetwork } from './useCurrentNetwork';

/**
 * A hook to get the list of visible and hidden accounts.
 *
 * @returns An object containing the visible accounts, hidden accounts, and functions to hide and show accounts.
 */
export const useAccountVisibility = () => {
  const { hideAccount: hideSnapAccount, unHideAccount: showSnapAccount } =
    useStarkNetSnap();
  const { address: currentAddress } = useCurrentAccount();
  const currentNetwork = useCurrentNetwork();
  const accounts = useAppSelector((state) => state.wallet.accounts);

  // Use useMemo to avoid re-rendering the component when the state changes
  const [visibleAccounts, hiddenAccounts] = useMemo(() => {
    const visibleAccounts: Account[] = [];
    const hiddenAccounts: Account[] = [];
    for (const account of accounts) {
      // account.visibility = `undefined` refer to the case when previous account state doesnt include this field
      // hence we consider it is `visible`
      if (account.visibility === undefined || account.visibility === true) {
        visibleAccounts.push(account);
      } else {
        hiddenAccounts.push(account);
      }
    }
    return [visibleAccounts, hiddenAccounts];
  }, [accounts]);

  // An account can be hidden only if there are more than one visible account
  const canHideAccount = visibleAccounts.length > 1;

  const chainId = currentNetwork?.chainId;

  const hideAccount = async (account: Account) => {
    if (canHideAccount) {
      await hideSnapAccount({
        chainId,
        address: account.address,
        currentAddress,
      });
    }
  };

  const showAccount = async (account: Account) => {
    await showSnapAccount({
      chainId,
      address: account.address,
    });
  };

  return {
    visibleAccounts,
    hiddenAccounts,
    canHideAccount,
    hideAccount,
    showAccount,
  };
};
