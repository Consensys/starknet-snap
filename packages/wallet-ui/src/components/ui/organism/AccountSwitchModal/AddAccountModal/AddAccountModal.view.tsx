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
import Toastr from 'toastr2';
const toastr = new Toastr({
  closeDuration: 10000000,
  showDuration: 1000000000,
  positionClass: 'toast-top-center',
});
interface Props {
  closeModal: () => void;
}

export const AddAccountModalView = ({ closeModal }: Props) => {
  const { addNewAccount, getNextAccountIndex } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const [enabled, setEnabled] = useState(false);
  const networks = useAppSelector((state) => state.networks);
  const accounts = useAppSelector((state) => state.wallet.accounts);
  const chainId = networks?.items[networks.activeNetwork].chainId;
  const [fields, setFields] = useState({
    accountName: `Account ${accounts.length+1}`,
  });

  const handleChange = (fieldName: string, fieldValue: string) => {
    setFields((prevFields) => ({
      ...prevFields,
      [fieldName]: fieldValue,
    }));
  };

  useEffect(() => {
    const allFieldFilled = Object.values(fields).every((field) => {
      return field.trim() !== '' && field.length < 20;
    });
    setEnabled(allFieldFilled);
  }, [fields]);

  return (
    <>
      <Wrapper>
        <Title>{translate('addAccount')}</Title>
        <Space />
        <FormGroup>
          <InputWithLabel
            label={translate('accountName')}
            value={fields.accountName}
            onChange={(event) =>
              handleChange('accountName', event.target.value)
            }
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
            try {
              await addNewAccount(chainId, fields.accountName);
              closeModal();
            } catch (err) {
              toastr.error(translate('errorAddingAccount'));
            }
          }}
        >
          {translate('add')}
        </ButtonStyled>
      </ButtonsWrapper>
    </>
  );
};
