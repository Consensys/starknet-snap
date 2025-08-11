import { TransactionsList } from 'components/ui/molecule/TransactionsList';
import { Header } from 'components/ui/organism/Header';
import { SideBar } from 'components/ui/organism/SideBar';
import { RightPart, Wrapper, NoTransactions } from './Home.style';
import { useAppSelector } from 'hooks/redux';
import { useMultiLanguage } from 'services';

export const HomeView = () => {
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );
  const transactions = useAppSelector((state) => state.wallet.transactions);
  const { address } = useAppSelector((state) => state.wallet.currentAccount);
  const loader = useAppSelector((state) => state.UI.loader);
  const { upgradeModalVisible } = useAppSelector((state) => state.modals);
  const { translate } = useMultiLanguage();

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
            <NoTransactions>{translate('noTransactions')}</NoTransactions>
          )}
      </RightPart>
    </Wrapper>
  );
};
