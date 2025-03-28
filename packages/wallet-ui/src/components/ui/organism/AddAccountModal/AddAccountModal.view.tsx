import { useState, useEffect, ChangeEvent } from 'react';

import { useAppSelector, useCurrentNetwork } from 'hooks';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { getDefaultAccountName } from 'utils/utils';
import { ACCOUNT_NAME_LENGTH } from 'utils/constants';
import { InputWithLabel } from 'components/ui/molecule/InputWithLabel';
import { ButtonStyled, ErrorMsg, FormGroup } from './AddAccountModal.style';
import { Modal } from 'components/ui/atom/Modal';
import Toastr from 'toastr2';

const toastr = new Toastr({
  closeDuration: 10000000,
  showDuration: 1000000000,
  positionClass: 'toast-top-center',
});

interface Props {
  onClose: () => void;
}

export const AddAccountModalView = ({ onClose }: Props) => {
  const [minLength, maxLength] = ACCOUNT_NAME_LENGTH;
  const { addNewAccount } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const currentNework = useCurrentNetwork();
  const accounts = useAppSelector((state) => state.wallet.accounts);
  const [enabled, setEnabled] = useState(true);
  const [accountName, setAccountName] = useState('');
  const chainId = currentNework?.chainId;

  useEffect(() => {
    const trimedAccountName = accountName.trim();
    setEnabled(
      !trimedAccountName ||
        (trimedAccountName.length <= maxLength &&
          trimedAccountName.length >= minLength),
    );
  }, [accountName, minLength, maxLength]);

  const onAccountNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAccountName(event.target.value);
  };

  const onAddAccount = async () => {
    const trimedAccountName = accountName.trim();

    // Check if the account name already exists
    const accountExists = accounts.some(
      (account) => account.accountName.trim() === trimedAccountName,
    );

    if (accountExists) {
      // Show toastr message if account name already exists
      toastr.error(translate('accountNameExistsError'));
      return;
    }

    // The UX is better if we close the modal before adding the account
    onClose();

    // Reset account name to undefined if it is empty,
    // so that the default account name is used in Snap
    await addNewAccount(
      chainId,
      trimedAccountName === '' ? undefined : trimedAccountName,
    );
  };

  return (
    <Modal>
      <Modal.Title>{translate('addAccount')}</Modal.Title>
      <Modal.Body>
        <FormGroup>
          <InputWithLabel
            label={translate('accountName')}
            placeholder={getDefaultAccountName(accounts.length)}
            onChange={onAccountNameChange}
            maxLength={maxLength}
          />
          {!enabled && (
            <ErrorMsg>
              {translate(
                'accountNameLengthError',
                minLength.toString(),
                maxLength.toString(),
              )}
            </ErrorMsg>
          )}
        </FormGroup>
      </Modal.Body>
      <Modal.Buttons>
        <ButtonStyled
          onClick={() => onClose()}
          backgroundTransparent
          borderVisible
        >
          {translate('cancel')}
        </ButtonStyled>
        <ButtonStyled enabled={enabled} onClick={() => onAddAccount()}>
          {translate('add')}
        </ButtonStyled>
      </Modal.Buttons>
    </Modal>
  );
};
