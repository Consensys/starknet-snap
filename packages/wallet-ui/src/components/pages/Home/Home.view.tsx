import { TransactionsList } from 'components/ui/molecule/TransactionsList';
import { Header } from 'components/ui/organism/Header';
import { SideBar } from 'components/ui/organism/SideBar';
import { RightPart, Wrapper, NoTransactions } from './Home.style';
import { useAppSelector } from 'hooks/redux';
interface Props {
  address: string;
}

export const HomeView = ({ address }: Props) => {
  const { erc20TokenBalanceSelected, transactions } = useAppSelector(
    (state) => state.wallet,
  );
  const loader = useAppSelector((state) => state.UI.loader);
  const { upgradeModalVisible } = useAppSelector((state) => state.modals);

  return (
    <Wrapper>
      <SideBar address={address} />
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
