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
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faCheck } from '@fortawesome/free-solid-svg-icons';
import { ACCOUNT_NAME_LENGTH } from 'utils/constants';
import { useCurrentAccount, useCurrentNetwork, useAppSelector } from 'hooks';
import Toastr from 'toastr2';

const toastr = new Toastr({
  closeDuration: 10000000,
  showDuration: 1000000000,
  positionClass: 'toast-top-center',
});

export const AccountDetailsModalView = () => {
  const [minLength, maxLength] = ACCOUNT_NAME_LENGTH;
  const { getPrivateKeyFromAddress, updateAccountName } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const currentNetwork = useCurrentNetwork();
  const currentAccount = useCurrentAccount();
  const accounts = useAppSelector((state) => state.wallet.accounts);
  // Assign an empty string to accountName if it is undefined, to prevent the JS error from the trim() function
  const [accountName, setAccountName] = useState(
    currentAccount.accountName ?? '',
  );
  const [isEditing, setIsEditing] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const chainId = currentNetwork?.chainId;
  const { address, accountName: currentAccountName } = currentAccount;

  useEffect(() => {
    const trimedAccountName = accountName.trim();
    setEnabled(
      trimedAccountName.length <= maxLength &&
        trimedAccountName.length >= minLength,
    );
  }, [accountName, minLength, maxLength]);

  const onAccountNameUpdate = async () => {
    const trimedAccountName = accountName.trim();

    if (trimedAccountName === currentAccountName) {
      setIsEditing(false);
      return;
    }

    // Check if the account name already exists
    const accountExists = accounts.some(
      (account) => account.accountName.trim() === trimedAccountName,
    );

    if (accountExists) {
      // Show toastr message if account name already exists
      toastr.error(translate('accountNameExistsError'));
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
