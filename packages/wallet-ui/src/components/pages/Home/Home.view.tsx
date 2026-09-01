import { useState } from 'react';
import Toastr from 'toastr2';
import { TransactionsList } from 'components/ui/molecule/TransactionsList';
import { Header } from 'components/ui/organism/Header';
import { SideBar } from 'components/ui/organism/SideBar';
import { Button } from 'components/ui/atom/Button';
import {
  RightPart,
  Wrapper,
  NoTransactions,
  DeprecationBox,
  DeprecationTitle,
  DeprecationBody,
  DeprecationLink,
  DeprecationDeployButton,
} from './Home.style';
import { useAppSelector, useCurrentAccount } from 'hooks';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { STARKNET_WALLETS_URL } from 'utils/constants';

export const HomeView = () => {
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );
  const transactions = useAppSelector((state) => state.wallet.transactions);
  const { address, addressIndex, isDeployed } = useCurrentAccount();
  const loader = useAppSelector((state) => state.UI.loader);
  const { upgradeModalVisible } = useAppSelector((state) => state.modals);
  const networks = useAppSelector((state) => state.networks);
  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const { translate } = useMultiLanguage();
  const { deployAccount, waitForAccountCreation, initWalletData } =
    useStarkNetSnap();
  const [isDeploying, setIsDeploying] = useState(false);
  const hideUndeployedAccount = isDeployed !== true;
  const toastr = new Toastr();

  const onDeployAccount = async () => {
    if (!chainId || isDeploying) {
      return;
    }

    setIsDeploying(true);
    try {
      const resp = await deployAccount(chainId, { addressIndex });

      if (resp === false) {
        return;
      }

      if (!resp.transaction_hash) {
        throw new Error('no transaction hash');
      }

      const deployed = await waitForAccountCreation(
        resp.transaction_hash,
        address,
        chainId,
      );

      if (!deployed) {
        toastr.error(translate('deployAccountFailed'));
        return;
      }

      toastr.success(translate('accountDeployedSuccessfully'));
      await initWalletData({ chainId });
    } catch (err) {
      //eslint-disable-next-line no-console
      console.error(err);
      toastr.error(translate('deployAccountFailed'));
    } finally {
      setIsDeploying(false);
    }
  };

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
            <DeprecationBody>
              {translate('deployAccountRiskWarning')}
            </DeprecationBody>
            <DeprecationDeployButton>
              <Button
                onClick={() => {
                  void onDeployAccount();
                }}
                enabled={!isDeploying}
                variant="primary"
              >
                {translate('deployAccountRiskAccept')}
              </Button>
            </DeprecationDeployButton>
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
