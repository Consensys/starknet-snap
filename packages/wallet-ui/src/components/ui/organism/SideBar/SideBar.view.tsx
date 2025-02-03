import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import { RoundedIcon } from 'components/ui/atom/RoundedIcon';
import { AccountSwitchModal } from 'components/ui/organism/AccountSwitchModal';
import { AssetsList } from 'components/ui/molecule/AssetsList';
import { PopIn } from 'components/ui/molecule/PopIn';
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
import { openExplorerTab } from 'utils/utils';
import { useAppSelector } from 'hooks/redux';
import { AddTokenModal } from '../AddTokenModal';
import { useStarkNetSnap } from 'services';
import { DUMMY_ADDRESS } from 'utils/constants';
import { PopperTooltip } from 'components/ui/molecule/PopperTooltip';

interface Props {
  address: string;
  addressIndex: number;
}

export const SideBarView = ({ address, addressIndex }: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const [listOverflow, setListOverflow] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  const wallet = useAppSelector((state) => state.wallet);
  const [addTokenOpen, setAddTokenOpen] = useState(false);
  const { getStarkName } = useStarkNetSnap();
  const [starkName, setStarkName] = useState<string | undefined>(undefined);

  const ref = useRef<HTMLDivElement>();

  useEffect(() => {
    if (ref.current) {
      const clientHeight = ref.current.clientHeight;
      if (clientHeight >= 344) {
        setListOverflow(true);
      } else {
        setListOverflow(false);
      }
    }
  }, [wallet.erc20TokenBalances]);

  useEffect(() => {
    if (address && address !== DUMMY_ADDRESS) {
      getStarkName(address, chainId)
        .then((name) => {
          setStarkName(name);
        })
        .catch(() => {
          setStarkName(undefined);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId]);

  return (
    <Wrapper>
      <PopInStyled
        isOpen={accountDetailsOpen}
        setIsOpen={setAccountDetailsOpen}
      >
        <AccountDetailsModal address={address} addressIndex={addressIndex} />
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
              Account details
            </AccountDetailButton>
            <AccountDetailButton
              backgroundTransparent
              iconLeft="external-link"
              onClick={() => openExplorerTab(address, 'contract', chainId)}
            >
              View on explorer
            </AccountDetailButton>
          </AccountDetailsContent>
        }
      >
        <AccountImageStyled address={address} connected={wallet.connected} />
      </AccountDetails>

      <AccountLabel>Account {addressIndex + 1} </AccountLabel>
      <RowDiv>
        <InfoIcon onClick={() => setInfoModalOpen(true)}>i</InfoIcon>
        <AccountSwitchModal currentAddress={address} starkName={starkName} />
        <PopperTooltip content="Copied!" closeTrigger="click">
          <CopyIcon
            onClick={async () => navigator.clipboard.writeText(address)}
          >
            <FontAwesomeIcon icon="copy" />
          </CopyIcon>
        </PopperTooltip>
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
        ADD TOKEN
      </AddTokenButton>
      <PopIn isOpen={addTokenOpen} setIsOpen={setAddTokenOpen}>
        <AddTokenModal closeModal={() => setAddTokenOpen(false)} />
      </PopIn>
    </Wrapper>
  );
};
