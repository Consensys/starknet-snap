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
import { useEffect, useState } from 'react';

interface Props {
  address: string;
}

export const AccountDetailsModalView = ({ address }: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const { getPrivateKeyFromAddress, getStarkName } = useStarkNetSnap();
  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const [starkName, setStarkName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (address) {
      getStarkName(address, chainId)
        .then((name) => {
          setStarkName(name);
        })
        .catch(() => {
          setStarkName(undefined);
        });
    }
  }, [address]);

  return (
    <div>
      <AccountImageDiv>
        <AccountImageStyled size={64} address={address} />
      </AccountImageDiv>
      <Wrapper>
        <TitleDiv>
          <Title>My account</Title>
          {/* <ModifyIcon /> */}
        </TitleDiv>
        <AddressQrCode value={address} />
        <AddressCopy address={address} starkName={starkName} />
      </Wrapper>
      <ButtonDiv>
        <ButtonStyled backgroundTransparent borderVisible onClick={() => openExplorerTab(address, 'contract', chainId)}>
          VIEW ON EXPLORER
        </ButtonStyled>
        <ButtonStyled backgroundTransparent borderVisible onClick={() => getPrivateKeyFromAddress(address, chainId)}>
          EXPORT PRIVATE KEY
        </ButtonStyled>
      </ButtonDiv>
    </div>
  );
};
