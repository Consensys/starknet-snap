import { TransactionsList } from 'components/ui/molecule/TransactionsList';
import { Header } from 'components/ui/organism/Header';
import { SideBar } from 'components/ui/organism/SideBar';
import { RightPart, Wrapper, NoTransactions } from './Home.style';
import { useAppSelector } from 'hooks/redux';
import { DUMMY_ADDRESS } from 'utils/constants';

export const HomeView = () => {
  const { erc20TokenBalanceSelected, transactions } = useAppSelector(
    (state) => state.wallet,
  );
  const loader = useAppSelector((state) => state.UI.loader);
  const currentAccount = useAppSelector((state) => state.wallet.currentAccount);
  const address = currentAccount?.address ?? DUMMY_ADDRESS;
  const { upgradeModalVisible } = useAppSelector((state) => state.modals);

  return (
    <Wrapper>
      <SideBar />
      <RightPart>
        {!upgradeModalVisible &&
          Object.keys(erc20TokenBalanceSelected).length > 0 && (
            <Header address={address} />
          )}
        {!upgradeModalVisible && <TransactionsList transactions={[]} />}
        {!upgradeModalVisible &&
          Object.keys(transactions).length === 0 &&
          !loader.isLoading && (
            <NoTransactions> You have no transactions</NoTransactions>
          )}
      </RightPart>
    </Wrapper>
  );
};
