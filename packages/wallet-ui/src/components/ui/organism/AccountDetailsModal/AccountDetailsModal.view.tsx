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
import { useMultiLanguage, useStarkNetSnap } from 'services';

interface Props {
  address: string;
}

export const AccountDetailsModalView = ({ address }: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const { getPrivateKeyFromAddress } = useStarkNetSnap();
  const { translate } = useMultiLanguage();

  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  return (
    <div>
      <AccountImageDiv>
        <AccountImageStyled size={64} address={address} />
      </AccountImageDiv>
      <Wrapper>
        <TitleDiv>
          <Title>{translate('myAccount')}</Title>
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
          {translate('viewOnExplorer').toUpperCase()}
        </ButtonStyled>
        <ButtonStyled
          backgroundTransparent
          borderVisible
          onClick={() => getPrivateKeyFromAddress(address, chainId)}
        >
          {translate('exportPrivateKey')}
        </ButtonStyled>
      </ButtonDiv>
    </div>
  );
};
