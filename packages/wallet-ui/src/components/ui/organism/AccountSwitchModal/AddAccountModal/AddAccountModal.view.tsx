import { useState, useEffect } from 'react';
import { useAppSelector } from 'hooks/redux';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { InputWithLabel } from 'components/ui/molecule/InputWithLabel';
import {
  ButtonStyled,
  ButtonsWrapper,
  FormGroup,
  Space,
  Title,
  Wrapper,
} from './AddAccountModal.style';
import { getDefaultAccountName } from 'utils/utils';
interface Props {
  closeModal: () => void;
}

export const AddAccountModalView = ({ closeModal }: Props) => {
  const { addNewAccount } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const [enabled, setEnabled] = useState(false);
  const networks = useAppSelector((state) => state.networks);
  const accounts = useAppSelector((state) => state.wallet.accounts);
  const chainId = networks?.items[networks.activeNetwork].chainId;
  const [accountName, setAccountName] = useState(
    getDefaultAccountName(accounts.length),
  );

  useEffect(() => {
    setEnabled(
      accountName.trim() !== '' &&
        accountName.length <= 20 &&
        accountName.length >= 1,
    );
  }, [accountName]);

  return (
    <>
      <Wrapper>
        <Title>{translate('addAccount')}</Title>
        <Space />
        <FormGroup>
          <InputWithLabel
            label={translate('accountName')}
            placeholder={accountName}
            onChange={(event) => {
              const value = event.target.value;
              setAccountName(
                value.trim() === ''
                  ? getDefaultAccountName(accounts.length)
                  : value,
              );
            }}
          />
        </FormGroup>
      </Wrapper>
      <ButtonsWrapper>
        <ButtonStyled onClick={closeModal} backgroundTransparent borderVisible>
          {translate('cancel')}
        </ButtonStyled>
        <ButtonStyled
          enabled={enabled}
          onClick={async () => {
            await addNewAccount(chainId, accountName);
            closeModal();
          }}
        >
          {translate('add')}
        </ButtonStyled>
      </ButtonsWrapper>
    </>
  );
};
