import { TransactionsList } from 'components/ui/molecule/TransactionsList';
import { Header } from 'components/ui/organism/Header';
import { SideBar } from 'components/ui/organism/SideBar';
import { RightPart, Wrapper, NoTransactions } from './Home.style';
import { useAppSelector } from 'hooks/redux';
import { useMultiLanguage } from 'services';

export const HomeView = () => {
  const { erc20TokenBalanceSelected, transactions } = useAppSelector(
    (state) => state.wallet,
  );
  const loader = useAppSelector((state) => state.UI.loader);
  const currentAccount = useAppSelector((state) => state.wallet.currentAccount);
  const address = currentAccount.address;
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
