import { useAppSelector } from 'hooks/redux';
import { FC, useEffect, useRef, useState, useCallback } from 'react';
import { useStarkNetSnap } from 'services';
import { Transaction } from 'types';
import {
  defaultAccount,
  TRANSACTIONS_REFRESH_FREQUENCY,
} from 'utils/constants';
import { IListProps } from '../List/List.view';
import { TransactionListItem } from './TransactionListItem';
import { Wrapper } from './TransactionsList.style';

interface Props {
  transactions: Transaction[];
}

export const TransactionsListView = ({ transactions }: Props) => {
  const { getTransactions } = useStarkNetSnap();
  const seenCursors = useRef<Set<{ txnHash: string; blockNumber: number }>>(
    new Set(),
  );
  const networks = useAppSelector((state) => state.networks);
  const currentAccount = useAppSelector((state) => state.wallet.currentAccount);
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );
  const walletTransactions = useAppSelector(
    (state) => state.wallet.transactions,
  );
  const walletTransactionsCursor = useAppSelector(
    (state) => state.wallet.transactionCursor,
  );
  const timeoutHandle = useRef(setTimeout(() => {}));
  const chainId = networks.items[networks.activeNetwork]?.chainId;

  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchMore = useCallback(async () => {
    if (
      walletTransactionsCursor &&
      !seenCursors.current.has({
        txnHash: walletTransactionsCursor.txnHash,
        blockNumber: walletTransactionsCursor.blockNumber,
      })
    ) {
      seenCursors.current.add({
        txnHash: walletTransactionsCursor.txnHash,
        blockNumber: walletTransactionsCursor.blockNumber,
      });
      setIsFetchingMore(true);

      await getTransactions(
        currentAccount.address,
        erc20TokenBalanceSelected.address,
        chainId,
        false,
        walletTransactionsCursor,
      );

      setIsFetchingMore(false);
    }
  }, [
    walletTransactionsCursor,
    getTransactions,
    currentAccount.address,
    erc20TokenBalanceSelected.address,
    chainId,
  ]);

  const checkIfShouldFetchMore = (
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number,
  ) => {
    return scrollTop + clientHeight >= scrollHeight - 10;
  };

  const handleScroll = useCallback(
    async (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

      if (
        checkIfShouldFetchMore(scrollTop, scrollHeight, clientHeight) &&
        !isFetchingMore
      ) {
        await fetchMore();
      }
    },
    [isFetchingMore, fetchMore],
  );

  useEffect(() => {
    if (chainId && erc20TokenBalanceSelected.address) {
      clearTimeout(timeoutHandle.current); // cancel the timeout that was in-flight
      timeoutHandle.current = setTimeout(
        () =>
          getTransactions(
            currentAccount.address,
            erc20TokenBalanceSelected.address,
            chainId,
            false,
          ),
        TRANSACTIONS_REFRESH_FREQUENCY,
      );
      return () => clearTimeout(timeoutHandle.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletTransactions]);

  useEffect(
    () => {
      if (
        chainId &&
        erc20TokenBalanceSelected.address &&
        currentAccount.address !== defaultAccount.address
      ) {
        clearTimeout(timeoutHandle.current); // cancel the timeout that was in-flight
        getTransactions(
          currentAccount.address,
          erc20TokenBalanceSelected.address,
          chainId,
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      erc20TokenBalanceSelected.address,
      erc20TokenBalanceSelected.chainId,
      currentAccount.address,
      currentAccount.chainId,
      chainId,
    ],
  );

  return (
    <Wrapper<FC<IListProps<Transaction>>>
      onScroll={handleScroll}
      data={transactions.length > 0 ? transactions : walletTransactions}
      render={(transaction) => (
        <TransactionListItem transaction={transaction} />
      )}
      keyExtractor={(transaction) => transaction.txnHash.toString()}
    />
  );
};
