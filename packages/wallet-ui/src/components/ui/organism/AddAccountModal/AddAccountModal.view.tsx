import { useState, useEffect, ChangeEvent } from 'react';
import { useAppSelector } from 'hooks/redux';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { InputWithLabel } from 'components/ui/molecule/InputWithLabel';
import {
  ButtonStyled,
  ButtonsWrapper,
  ErrorMsg,
  FormGroup,
  Space,
  Title,
  Wrapper,
} from './AddAccountModal.style';
import { getDefaultAccountName } from 'utils/utils';
import { ACCOUNT_NAME_LENGTH } from 'utils/constants';

interface Props {
  onClose: () => void;
}

export const AddAccountModalView = ({ onClose }: Props) => {
  const [minLength, maxLength] = ACCOUNT_NAME_LENGTH;
  const { addNewAccount } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const networks = useAppSelector((state) => state.networks);
  const accounts = useAppSelector((state) => state.wallet.accounts);
  const [enabled, setEnabled] = useState(true);
  const [accountName, setAccountName] = useState('');
  const chainId = networks?.items[networks.activeNetwork].chainId;

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
    // Reset account name to undefined if it is empty,
    // so that the default account name is used in Snap
    await addNewAccount(
      chainId,
      trimedAccountName === '' ? undefined : trimedAccountName,
    );
    onClose();
  };

  return (
    <>
      <Wrapper>
        <Title>{translate('addAccount')}</Title>
        <Space />
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
        <ButtonStyled enabled={enabled} onClick={onAddAccount}>
          {translate('add')}
        </ButtonStyled>
      </ButtonsWrapper>
    </>
  );
};
