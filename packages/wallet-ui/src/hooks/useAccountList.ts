import { useAppSelector } from './redux';
import { useCurrentNetwork } from './useCurrentNetwork';

/**
 * A hook to get the list of accounts for the current network
 *
 * @returns {Account[]}
 */
export const useAccountList = () => {
  const currentNework = useCurrentNetwork();
  const accounts = useAppSelector((state) =>
    state.wallet.accounts.filter(
      (account) => account.chainId === currentNework.chainId,
    ),
  );

  return accounts;
};
