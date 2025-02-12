import { useState } from 'react';
import {
  AccountImageDiv,
  AccountImageStyled,
  AccountNameInput,
  AddressCopy,
  AddressQrCode,
  ButtonDiv,
  ButtonStyled,
  EditIcon,
  IconButton,
  Title,
  TitleDiv,
  Wrapper,
} from './AccountDetailsModal.style';
import { openExplorerTab } from 'utils/utils';
import { useAppSelector } from 'hooks/redux';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

export const AccountDetailsModalView = () => {
  const networks = useAppSelector((state) => state.networks);
  const currentAccount = useAppSelector((state) => state.wallet.currentAccount);
  const { getPrivateKeyFromAddress, setAccountName } = useStarkNetSnap();
  const { translate } = useMultiLanguage();

  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const address = currentAccount.address;

  const [isEditing, setIsEditing] = useState(false);
  const [newAccountName, setNewAccountName] = useState(
    currentAccount.accountName,
  );

  const handleSaveName = async () => {
    if (
      newAccountName.trim() &&
      newAccountName !== currentAccount.accountName
    ) {
      await setAccountName(chainId, address, newAccountName);
    }
    setIsEditing(false);
  };

  return (
    <div>
      <AccountImageDiv>
        <AccountImageStyled size={64} address={address} />
      </AccountImageDiv>
      <Wrapper>
        <TitleDiv>
          {isEditing ? (
            <>
              <AccountNameInput
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                autoFocus
              />
              <IconButton onClick={handleSaveName}>
                <FontAwesomeIcon icon={faCheck} />
              </IconButton>
              <IconButton onClick={() => setIsEditing(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </IconButton>
            </>
          ) : (
            <>
              <Title>{currentAccount.accountName}</Title>
              <EditIcon onClick={() => setIsEditing(true)}>
                <FontAwesomeIcon icon={faPen} />
              </EditIcon>
            </>
          )}
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
