import { useEffect, useState } from 'react';
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

  const [newAccountName, setNewAccountName] = useState(
    currentAccount.accountName,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const accountName = newAccountName.trim();
    setIsEnabled(accountName.length >= 1 && accountName.length <= 20);
  }, [newAccountName]);

  const handleSaveName = async () => {
    if (isEnabled) {
      const accountName = newAccountName.trim();
      await setAccountName(chainId, address, accountName);
      setIsEditing(false);
    }
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
                onChange={(event) => setNewAccountName(event.target.value)}
                autoFocus
              />
              <IconButton
                onClick={handleSaveName}
                disabled={!isEnabled}
                style={{
                  opacity: isEnabled ? 1 : 0.5, // Makes the button translucent when disabled
                  cursor: isEnabled ? 'pointer' : 'not-allowed', // Changes cursor to 'not-allowed' when disabled
                }}
              >
                <FontAwesomeIcon icon={faCheck} />
              </IconButton>
              <IconButton
                disabled={false}
                onClick={() => {
                  setNewAccountName(currentAccount.accountName);
                  setIsEditing(false);
                }}
              >
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
