import { ChangeEvent, useEffect, useState } from 'react';
import {
  AccountImageDiv,
  AccountImageStyled,
  AccountNameInput,
  AddressCopy,
  AddressQrCode,
  ButtonDiv,
  ButtonStyled,
  EditIcon,
  ErrorMsg,
  IconButton,
  RowDiv,
  Title,
  TitleDiv,
  Wrapper,
} from './AccountDetailsModal.style';
import { openExplorerTab } from 'utils/utils';
import { useAppSelector } from 'hooks/redux';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faCheck } from '@fortawesome/free-solid-svg-icons';
import { ACCOUNT_NAME_LENGTH } from 'utils/constants';

export const AccountDetailsModalView = () => {
  const [minLength, maxLength] = ACCOUNT_NAME_LENGTH;
  const { getPrivateKeyFromAddress, updateAccountName } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const networks = useAppSelector((state) => state.networks);
  const currentAccount = useAppSelector((state) => state.wallet.currentAccount);
  const [accountName, setAccountName] = useState(currentAccount.accountName);
  const [isEditing, setIsEditing] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const { address, accountName: currentAccountName } = currentAccount;

  useEffect(() => {
    const trimedAccountName = accountName.trim();
    setEnabled(
      trimedAccountName.length <= maxLength &&
        trimedAccountName.length >= minLength,
    );
  }, [accountName]);

  const onAccountNameUpdate = async () => {
    const trimedAccountName = accountName.trim();

    if (trimedAccountName === currentAccountName) {
      setIsEditing(false);
      return;
    }
    if (enabled) {
      await updateAccountName(chainId, address, trimedAccountName);
      setIsEditing(false);
    }
  };

  const onAccountNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAccountName(event.target.value);
  };

  const onEditStart = () => {
    setIsEditing(true);
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
              <RowDiv>
                <AccountNameInput
                  type="text"
                  value={accountName}
                  onChange={onAccountNameChange}
                  autoFocus
                  maxLength={maxLength}
                />
                {/* Save edit button */}
                <IconButton onClick={onAccountNameUpdate} disabled={!enabled}>
                  <FontAwesomeIcon icon={faCheck} />
                </IconButton>
              </RowDiv>
              {!enabled && (
                <ErrorMsg>
                  {translate(
                    'accountNameLengthError',
                    minLength.toString(),
                    maxLength.toString(),
                  )}
                </ErrorMsg>
              )}
            </>
          ) : (
            <RowDiv>
              {/* Edit button */}
              <Title>{currentAccountName}</Title>
              <EditIcon onClick={onEditStart}>
                <FontAwesomeIcon icon={faPen} />
              </EditIcon>
            </RowDiv>
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
