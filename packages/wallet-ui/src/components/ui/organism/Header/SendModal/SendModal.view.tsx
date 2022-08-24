import { useState } from 'react';
import { AmountInput } from 'components/ui/molecule/AmountInput';
import { SendSummaryModal } from '../SendSummaryModal';
import {
  Buttons,
  ButtonStyled,
  Header,
  MessageAlert,
  Network,
  Separator,
  SeparatorSmall,
  Title,
  Wrapper,
} from './SendModal.style';
import { useAppSelector } from 'hooks/redux';
import { ethers } from 'ethers';
import { AddressInput } from 'components/ui/molecule/AddressInput';
import { isValidAddress } from 'utils/utils';
import { Bold, Normal } from '../../ConnectInfoModal/ConnectInfoModal.style';

interface Props {
  closeModal?: () => void;
}

export const SendModalView = ({ closeModal }: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const wallet = useAppSelector((state) => state.wallet);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [fields, setFields] = useState({
    amount: '',
    address: '',
    chainId: networks.items.length > 0 ? networks.items[networks.activeNetwork].chainId : '',
  });
  const [errors, setErrors] = useState({ amount: '', address: '' });

  const handleChange = (fieldName: string, fieldValue: string) => {
    //Check if input amount does not exceed user balance
    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: '',
    }));
    switch (fieldName) {
      case 'amount':
        if (fieldValue !== '' && fieldValue !== '.') {
          const inputAmount = ethers.utils.parseUnits(fieldValue, wallet.erc20TokenBalanceSelected.decimals);
          const userBalance = wallet.erc20TokenBalanceSelected.amount;
          if (inputAmount.gt(userBalance)) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              amount: 'Input amount exceeds user balance',
            }));
          }
        }
        break;
      case 'address':
        if (fieldValue !== '') {
          if (!isValidAddress(fieldValue)) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              address: 'Invalid address format',
            }));
          }
        }
        break;
    }

    setFields((prevFields) => ({
      ...prevFields,
      [fieldName]: fieldValue,
    }));
  };

  const confirmEnabled = () => {
    return !errors.address && !errors.amount && fields.amount.length > 0 && fields.address.length > 0;
  };

  return (
    <>
      {!summaryModalOpen && (
        <div>
          <Wrapper>
            <Header>
              <Title>Send</Title>
            </Header>
            <Network>
              <Normal>Network</Normal>
              <Bold>{networks.items[networks.activeNetwork].name}</Bold>
            </Network>
            <AddressInput
              label="To"
              placeholder="Paste recipient address here"
              onChange={(value) => handleChange('address', value.target.value)}
            />
            <SeparatorSmall />
            <MessageAlert
              variant="info"
              text="Please only enter a valid StarkNet address. Sending funds to a different network might result in permanent loss."
            />
            <Separator />
            <AmountInput
              label="Amount"
              onChangeCustom={(value) => handleChange('amount', value)}
              error={errors.amount !== '' ? true : false}
              helperText={errors.amount}
              decimalsMax={wallet.erc20TokenBalanceSelected.decimals}
              asset={wallet.erc20TokenBalanceSelected}
            />
          </Wrapper>
          <Buttons>
            <ButtonStyled onClick={closeModal} backgroundTransparent borderVisible>
              CANCEL
            </ButtonStyled>
            <ButtonStyled onClick={() => setSummaryModalOpen(true)} enabled={confirmEnabled()}>
              CONFIRM
            </ButtonStyled>
          </Buttons>
        </div>
      )}

      {summaryModalOpen && (
        <SendSummaryModal
          closeModal={closeModal}
          address={fields.address}
          amount={fields.amount}
          chainId={fields.chainId}
        />
      )}
    </>
  );
};
