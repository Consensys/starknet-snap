import {
  AccountImageDiv,
  AccountImageStyled,
  AddressCopy,
  AddressQrCode,
  ButtonDiv,
  ButtonStyled,
  Title,
  TitleDiv,
  Wrapper,
} from './AccountDetailsModal.style';
import { openExplorerTab } from 'utils/utils';
import { useAppSelector } from 'hooks/redux';
import { useStarkNetSnap } from 'services';

export const AccountDetailsModalView = () => {
  const networks = useAppSelector((state) => state.networks);
  const currentAccount = useAppSelector((state) => state.wallet.currentAccount);
  const { getPrivateKeyFromAddress } = useStarkNetSnap();
  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const address = currentAccount.address;
  const addressIndex = currentAccount?.addressIndex ?? 0;
  return (
    <div>
      <AccountImageDiv>
        <AccountImageStyled size={64} address={address} />
      </AccountImageDiv>
      <Wrapper>
        <TitleDiv>
          <Title>Account {addressIndex + 1}</Title>
          {/* <ModifyIcon /> */}
        </TitleDiv>
        <AddressQrCode value={address} />
        <AddressCopy address={address} />
      </Wrapper>
      <ButtonDiv>
        <ButtonStyled
          backgroundTransparent
          borderVisible
          onClick={() => openExplorerTab(address, 'contract', chainId)}
        >
          VIEW ON EXPLORER
        </ButtonStyled>
        <ButtonStyled
          backgroundTransparent
          borderVisible
          onClick={() => getPrivateKeyFromAddress(address, chainId)}
        >
          EXPORT PRIVATE KEY
        </ButtonStyled>
      </ButtonDiv>
    </div>
  );
};
