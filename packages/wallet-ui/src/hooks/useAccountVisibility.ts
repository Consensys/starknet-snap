import { useMemo } from 'react';

import { Account } from 'types';
import { useAppSelector } from './redux';

/**
 * A hook to get the list of visible and hidden accounts.
 *
 * @returns the list of visible and hidden accounts and a boolean indicating if an account can be hidden
 */
export const useAccountVisibility = () => {
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

  return { visibleAccounts, hiddenAccounts, canHideAccount };
};
