import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';

import { useAppSelector, useCurrentAccount, useCurrentNetwork } from 'hooks';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { RoundedIcon } from 'components/ui/atom/RoundedIcon';
import { AssetsList } from 'components/ui/molecule/AssetsList';
import { PopIn } from 'components/ui/molecule/PopIn';
import { PopperTooltip } from 'components/ui/molecule/PopperTooltip';
import { openExplorerTab } from 'utils/utils';
import { defaultAccount } from 'utils/constants';
import { AccountDrawer } from '../AccountDrawer';
import { AddTokenModal } from '../AddTokenModal';
import { AccountDetailsModal } from '../AccountDetailsModal';
import { ConnectInfoModal } from '../ConnectInfoModal';
import {
  AccountDetailButton,
  AccountDetails,
  AccountDetailsContent,
  AccountImageStyled,
  AccountLabel,
  CopyIcon,
  AddTokenButton,
  DivList,
  InfoIcon,
  PopInStyled,
  RowDiv,
  Wrapper,
} from './SideBar.style';

export const SideBarView = () => {
  const { getStarkName } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const currentNework = useCurrentNetwork();
  const { address, accountName, isDeployed } = useCurrentAccount();
  const erc20TokenBalances = useAppSelector(
    (state) => state.wallet.erc20TokenBalances,
  );
  const connected = useAppSelector((state) => state.wallet.connected);
  const [listOverflow, setListOverflow] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  const [addTokenOpen, setAddTokenOpen] = useState(false);
  const [starkName, setStarkName] = useState<string | undefined>(undefined);
  const ref = useRef<HTMLDivElement>();
  const chainId = currentNework?.chainId;
  const hideUndeployedAccount = isDeployed !== true;

  useEffect(() => {
    if (ref.current) {
      const clientHeight = ref.current.clientHeight;
      if (clientHeight >= 344) {
        setListOverflow(true);
      } else {
        setListOverflow(false);
      }
    }
  }, [erc20TokenBalances]);

  useEffect(() => {
    if (address && address !== defaultAccount.address && isDeployed === true) {
      getStarkName(address, chainId)
        .then((name) => {
          setStarkName(name);
        })
        .catch(() => {
          setStarkName(undefined);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId, isDeployed]);

  return (
    <Wrapper>
      <PopInStyled
        isOpen={accountDetailsOpen}
        setIsOpen={setAccountDetailsOpen}
      >
        <AccountDetailsModal />
      </PopInStyled>
      <PopIn
        isOpen={infoModalOpen}
        setIsOpen={setInfoModalOpen}
        showClose={false}
      >
        <ConnectInfoModal
          onButtonClick={() => setInfoModalOpen(false)}
          address={address}
        />
      </PopIn>
      {hideUndeployedAccount ? (
        <AccountImageStyled address={address} connected={connected} />
      ) : (
        <AccountDetails
          arrowVisible={false}
          closeTrigger="click"
          offSet={[60, 0]}
          content={
            <AccountDetailsContent>
              <AccountDetailButton
                backgroundTransparent
                iconLeft="qrcode"
                onClick={() => setAccountDetailsOpen(true)}
              >
                {translate('accountDetails')}
              </AccountDetailButton>
              <AccountDetailButton
                backgroundTransparent
                iconLeft="external-link"
                onClick={() => openExplorerTab(address, 'contract', chainId)}
              >
                {translate('viewOnExplorer')}
              </AccountDetailButton>
            </AccountDetailsContent>
          }
        >
          <AccountImageStyled address={address} connected={connected} />
        </AccountDetails>
      )}

      <AccountLabel>{accountName}</AccountLabel>
      <RowDiv>
        {!hideUndeployedAccount && (
          <InfoIcon onClick={() => setInfoModalOpen(true)}>i</InfoIcon>
        )}
        <AccountDrawer starkName={starkName} />
        {!hideUndeployedAccount && (
          <PopperTooltip content="Copied!" closeTrigger="click">
            <CopyIcon
              onClick={async () => navigator.clipboard.writeText(address)}
            >
              <FontAwesomeIcon icon="copy" />
            </CopyIcon>
          </PopperTooltip>
        )}
      </RowDiv>
      <DivList ref={ref as any}>
        <AssetsList />
      </DivList>
      <AddTokenButton
        customIconLeft={
          <RoundedIcon>
            <FontAwesomeIcon icon={['fas', 'plus']} />
          </RoundedIcon>
        }
        backgroundTransparent
        shadowVisible={listOverflow}
        onClick={() => setAddTokenOpen(true)}
      >
        {translate('addToken').toUpperCase()}
      </AddTokenButton>
      <PopIn isOpen={addTokenOpen} setIsOpen={setAddTokenOpen}>
        <AddTokenModal closeModal={() => setAddTokenOpen(false)} />
      </PopIn>
    </Wrapper>
  );
};
