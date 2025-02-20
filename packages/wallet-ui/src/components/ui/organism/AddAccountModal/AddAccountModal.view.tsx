import { useState, useEffect, ChangeEvent } from 'react';

import { useAppSelector, useCurrentNetwork } from 'hooks';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { getDefaultAccountName } from 'utils/utils';
import { ACCOUNT_NAME_LENGTH } from 'utils/constants';
import { InputWithLabel } from 'components/ui/molecule/InputWithLabel';
import {
  ButtonStyled,
  ButtonsWrapper,
  ErrorMsg,
  FormGroup,
  Title,
  Wrapper,
} from './AddAccountModal.style';

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
    // The UX is better if we close the modal before adding the account
    onClose();

    const trimedAccountName = accountName.trim();
    // Reset account name to undefined if it is empty,
    // so that the default account name is used in Snap
    await addNewAccount(
      chainId,
      trimedAccountName === '' ? undefined : trimedAccountName,
    );
  };

  return (
    <>
      <Wrapper>
        <Title>{translate('addAccount')}</Title>
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
      </Wrapper>
      <ButtonsWrapper>
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
      </ButtonsWrapper>
    </>
  );
};
