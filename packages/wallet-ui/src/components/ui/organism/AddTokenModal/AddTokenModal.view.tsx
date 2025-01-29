import { useState, useEffect } from 'react';
import { useAppSelector } from 'hooks/redux';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { Alert } from 'components/ui/atom/Alert';
import { AddressInput } from 'components/ui/molecule/AddressInput';
import { InputWithLabel } from 'components/ui/molecule/InputWithLabel';
import {
  ButtonStyled,
  ButtonsWrapper,
  FormGroup,
  Space,
  Title,
  Wrapper,
} from './AddToken.style';
import Toastr from 'toastr2';
const toastr = new Toastr({
  closeDuration: 10000000,
  showDuration: 1000000000,
  positionClass: 'toast-top-center',
});
interface Props {
  closeModal: () => void;
}

export const AddTokenModalView = ({ closeModal }: Props) => {
  const { setErc20TokenBalance, addErc20Token } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const [enabled, setEnabled] = useState(false);
  const networks = useAppSelector((state) => state.networks);
  const { accounts } = useAppSelector((state) => state.wallet);
  const chain = networks && networks.items[networks.activeNetwork].chainId;
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [fields, setFields] = useState({
    address: '',
    name: '',
    symbol: '',
    decimal: '',
  });
  const handleChange = (fieldName: string, fieldValue: string) => {
    setFields((prevFields) => ({
      ...prevFields,
      [fieldName]: fieldValue,
    }));
  };

  useEffect(() => {
    const allFieldFilled = Object.values(fields).every((field) => {
      return field.trim() !== '' && isValidAddress;
    });
    setEnabled(allFieldFilled);
  }, [fields, isValidAddress]);

  return (
    <>
      <Wrapper>
        <Title>{translate('addToken')}</Title>
        <Alert text={translate('tokenCreationWarning')} variant="warning" />
        <Space />
        <FormGroup>
          <AddressInput
            label={translate('contractAddress')}
            placeholder=""
            onChange={(event) => handleChange('address', event.target.value)}
            setIsValidAddress={setIsValidAddress}
          />
        </FormGroup>
        <FormGroup>
          <InputWithLabel
            label={translate('name')}
            onChange={(event) => handleChange('name', event.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <InputWithLabel
            label={translate('symbol')}
            onChange={(event) => handleChange('symbol', event.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <InputWithLabel
            label={translate('decimal')}
            placeholder="0"
            type="number"
            onChange={(event) =>
              handleChange(
                'decimal',
                isNaN(Number(event.target.value)) ? '' : event.target.value,
              )
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
              const newToken = await addErc20Token(
                fields.address,
                fields.name,
                fields.symbol,
                parseFloat(fields.decimal),
                chain,
                accounts[0] as unknown as string,
              );
              if (newToken) {
                setErc20TokenBalance(newToken);
                toastr.success(translate('tokenAddedSuccessfully'));
              }
              closeModal();
            } catch (err) {
              toastr.error(translate('errorAddingToken'));
            }
          }}
        >
          {translate('add')}
        </ButtonStyled>
      </ButtonsWrapper>
    </>
  );
};
