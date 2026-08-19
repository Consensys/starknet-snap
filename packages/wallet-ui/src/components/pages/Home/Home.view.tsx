import { TransactionsList } from 'components/ui/molecule/TransactionsList';
import { Header } from 'components/ui/organism/Header';
import { SideBar } from 'components/ui/organism/SideBar';
import {
  RightPart,
  Wrapper,
  NoTransactions,
  DeprecationBox,
  DeprecationTitle,
  DeprecationBody,
  DeprecationLink,
} from './Home.style';
import { useAppSelector, useCurrentAccount } from 'hooks';
import { useMultiLanguage } from 'services';
import { STARKNET_WALLETS_URL } from 'utils/constants';

export const HomeView = () => {
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );
  const transactions = useAppSelector((state) => state.wallet.transactions);
  const { address, isDeployed } = useCurrentAccount();
  const loader = useAppSelector((state) => state.UI.loader);
  const { upgradeModalVisible } = useAppSelector((state) => state.modals);
  const { translate } = useMultiLanguage();
  const hideUndeployedAccount = isDeployed !== true;

  return (
    <Wrapper>
      <SideBar />
      <RightPart>
        {hideUndeployedAccount && (
          <DeprecationBox>
            <DeprecationTitle>
              {translate('accountCreationDeprecated')}
            </DeprecationTitle>
            <DeprecationBody>
              {translate('switchToDeployedAccount')}
            </DeprecationBody>
            <DeprecationBody>
              {translate('accountCreationDeprecatedDesc')}{' '}
              <DeprecationLink
                href={STARKNET_WALLETS_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                starknet.io/wallets
              </DeprecationLink>
            </DeprecationBody>
          </DeprecationBox>
        )}
        {!hideUndeployedAccount &&
          !upgradeModalVisible &&
          Object.keys(erc20TokenBalanceSelected).length > 0 && (
            <Header address={address} />
          )}
        {!hideUndeployedAccount && !upgradeModalVisible && (
          <TransactionsList transactions={[]} />
        )}
        {!hideUndeployedAccount &&
          !upgradeModalVisible &&
          Object.keys(transactions).length === 0 &&
          !loader.isLoading && (
            <NoTransactions>{translate('noTransactions')}</NoTransactions>
          )}
      </RightPart>
    </Wrapper>
  );
};
