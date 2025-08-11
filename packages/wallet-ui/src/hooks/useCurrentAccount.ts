import { Account } from 'types';
import { useAppSelector } from './redux';

/**
 * A hook to get the current account
 *
 * @returns the current account
 */
export const useCurrentAccount = (): Account => {
  const currentAccount = useAppSelector((state) => state.wallet.currentAccount);
  return currentAccount;
};
