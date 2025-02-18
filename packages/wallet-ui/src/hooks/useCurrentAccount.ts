import { Account } from 'types';
import { useAppSelector } from './redux';

export const useCurrentAccount = (): Account => {
  const currentAccount = useAppSelector((state) => state.wallet.currentAccount);
  return currentAccount;
};
