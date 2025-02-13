import { useAppSelector } from 'hooks/redux';
import { FC, useEffect, useRef } from 'react';
import { useStarkNetSnap } from 'services';
import { Transaction } from 'types';
import { TRANSACTIONS_REFRESH_FREQUENCY } from 'utils/constants';
import { IListProps } from '../List/List.view';
import { TransactionListItem } from './TransactionListItem';
import { Wrapper } from './TransactionsList.style';

interface Props {
  transactions: Transaction[];
}

export const TransactionsListView = ({ transactions }: Props) => {
  const { getTransactions } = useStarkNetSnap();
  const networks = useAppSelector((state) => state.networks);
  const currentAccount = useAppSelector((state) => state.wallet.currentAccount);
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );
  const walletTransactions = useAppSelector(
    (state) => state.wallet.transactions,
  );
  const timeoutHandle = useRef(setTimeout(() => {}));
  const chainId = networks.items[networks.activeNetwork]?.chainId;

  useEffect(() => {
    if (chainId && erc20TokenBalanceSelected.address) {
      clearTimeout(timeoutHandle.current); // cancel the timeout that was in-flight
      timeoutHandle.current = setTimeout(
        () =>
          getTransactions(
            currentAccount.address,
            erc20TokenBalanceSelected.address,
            10,
            chainId,
            false,
            true,
          ),
        TRANSACTIONS_REFRESH_FREQUENCY,
      );
      return () => clearTimeout(timeoutHandle.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletTransactions]);

  useEffect(
    () => {
      if (chainId && erc20TokenBalanceSelected.address) {
        clearTimeout(timeoutHandle.current); // cancel the timeout that was in-flight
        getTransactions(
          currentAccount.address,
          erc20TokenBalanceSelected.address,
          10,
          chainId,
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // eslint-disable-next-line react-hooks/exhaustive-deps
      erc20TokenBalanceSelected.address,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      erc20TokenBalanceSelected.chainId,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      currentAccount.address,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      currentAccount.chainId,
      chainId,
    ],
  );

  return (
    <Wrapper<FC<IListProps<Transaction>>>
      data={transactions.length > 0 ? transactions : walletTransactions}
      render={(transaction) => (
        <TransactionListItem transaction={transaction} />
      )}
      keyExtractor={(transaction) => transaction.txnHash.toString()}
    />
  );
};
