import { useEffect } from 'react';
import './App.css';
import GlobalStyle from 'theme/GlobalStyles';
import { library } from '@fortawesome/fontawesome-svg-core';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { Home } from 'components/pages/Home';
import { FrameworkView } from 'components/ui/Framework/Framework.view';
import { useAppSelector } from 'hooks/redux';
import { useStarkNetSnap } from 'services';
import { ThemeProvider } from 'styled-components';
import { theme } from 'theme/default';
import { ConnectModal } from 'components/ui/organism/ConnectModal';
import { PopIn } from 'components/ui/molecule/PopIn';
import { LoadingBackdrop } from 'components/ui/molecule/LoadingBackdrop';
import { ConnectInfoModal } from 'components/ui/organism/ConnectInfoModal';
import { UpgradeModel } from 'components/ui/organism/UpgradeModel';
import 'toastr2/dist/toastr.min.css';
import { NoMetamaskModal } from 'components/ui/organism/NoMetamaskModal';
import { MinVersionModal } from './components/ui/organism/MinVersionModal';
import { useHasMetamask } from 'hooks/useHasMetamask';
import { DeployModal } from 'components/ui/organism/DeployModal';
import { MinMetamaskVersionModal } from 'components/ui/organism/MinMetamaskVersionModal';

library.add(fas, far);

function App() {
  const { initSnap, initWalletData, checkConnection, loadLocale } =
    useStarkNetSnap();
  const { connected, forceReconnect, provider } = useAppSelector(
    (state) => state.wallet,
  );
  const {
    infoModalVisible,
    minVersionModalVisible,
    minMMVersionModalVisible,
    upgradeModalVisible,
    deployModalVisible,
  } = useAppSelector((state) => state.modals);
  const { loader } = useAppSelector((state) => state.UI);
  const networks = useAppSelector((state) => state.networks);
  const { currentAccount } = useAppSelector((state) => state.wallet);
  const { hasMetamask } = useHasMetamask();
  const chainId = networks.items?.[networks.activeNetwork]?.chainId;
  const address = currentAccount.address;

  useEffect(() => {
    if (!provider) {
      return;
    }
    if (connected) {
      initSnap();
    }
    if (hasMetamask && !connected && !forceReconnect) {
      checkConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, forceReconnect, hasMetamask, provider]);

  useEffect(() => {
    if (provider && networks.items.length > 0 && chainId) {
      initWalletData({ chainId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networks.activeNetwork, provider, chainId]);

  useEffect(() => {
    if (connected) {
      loadLocale();
    }
  }, [connected, loadLocale]);

  const loading = loader.isLoading;
  const isModalEligibleToShow =
    !minVersionModalVisible && !minMMVersionModalVisible;

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <FrameworkView connected={connected}>
        <PopIn isOpen={!connected && !loading} showClose={false}>
          <NoMetamaskModal />
        </PopIn>
        <PopIn isOpen={minVersionModalVisible} showClose={false}>
          <MinVersionModal />
        </PopIn>
        <PopIn isOpen={minMMVersionModalVisible} showClose={false}>
          <MinMetamaskVersionModal />
        </PopIn>
        <PopIn
          isOpen={!loading && !!hasMetamask && !connected}
          showClose={false}
        >
          <ConnectModal />
        </PopIn>
        <PopIn
          isOpen={isModalEligibleToShow && infoModalVisible}
          showClose={false}
        >
          <ConnectInfoModal address={address} />
        </PopIn>
        <PopIn
          isOpen={isModalEligibleToShow && upgradeModalVisible}
          showClose={false}
        >
          <UpgradeModel address={address} />
        </PopIn>
        <PopIn
          isOpen={isModalEligibleToShow && deployModalVisible}
          showClose={false}
        >
          <DeployModal address={address} />
        </PopIn>
        <Home />
        <PopIn isOpen={loading}>
          {loading && (
            <LoadingBackdrop>{loader.loadingMessage}</LoadingBackdrop>
          )}
        </PopIn>
      </FrameworkView>
    </ThemeProvider>
  );
}

export default App;
