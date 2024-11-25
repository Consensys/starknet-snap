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
import { isValidAddress, isValidStarkName } from 'utils/utils';
import { Bold, Normal } from '../../ConnectInfoModal/ConnectInfoModal.style';
import { DropDown } from 'components/ui/molecule/DropDown';
import { DEFAULT_FEE_TOKEN } from 'utils/constants';
import { FeeToken } from 'types';
import { useStarkNetSnap } from 'services';

interface Props {
  closeModal?: () => void;
}

export const SendModalView = ({ closeModal }: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const wallet = useAppSelector((state) => state.wallet);
  const { getAddrFromStarkName } = useStarkNetSnap();
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [fields, setFields] = useState({
    amount: '',
    address: '',
    chainId:
      networks.items.length > 0
        ? networks.items[networks.activeNetwork].chainId
        : '',
    feeToken: DEFAULT_FEE_TOKEN, // Default fee token
  });
  const [errors, setErrors] = useState({ amount: '', address: '' });
  const [resolvedAddress, setResolvedAddress] = useState('');

  const handleChange = (fieldName: string, fieldValue: string) => {
    //Check if input amount does not exceed user balance
    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: '',
    }));
    switch (fieldName) {
      case 'amount':
        if (fieldValue !== '' && fieldValue !== '.') {
          const inputAmount = ethers.utils.parseUnits(
            fieldValue,
            wallet.erc20TokenBalanceSelected.decimals,
          );
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
          if (isValidAddress(fieldValue)) {
            break;
          } else if (isValidStarkName(fieldValue)) {
            getAddrFromStarkName(fieldValue, chainId).then((address) => {
              if (isValidAddress(address)) {
                setResolvedAddress(address);
              } else {
                setErrors((prevErrors) => ({
                  ...prevErrors,
                  address: '.stark name doesn’t exist',
                }));
              }
            });
          } else {
            setErrors((prevErrors) => ({
              ...prevErrors,
              address: 'Invalid address format',
            }));
          }
        }
        break;
      case 'feeToken':
        setFields((prevFields) => ({
          ...prevFields,
          feeToken: fieldValue as FeeToken,
        }));
        break;
    }
    setFields((prevFields) => ({
      ...prevFields,
      [fieldName]: fieldValue,
    }));
  };

  const confirmEnabled = () => {
    return (
      !errors.address &&
      !errors.amount &&
      fields.amount.length > 0 &&
      fields.address.length > 0
    );
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
              placeholder="Paste recipient address or .stark name here"
              onChange={(value) => handleChange('address', value.target.value)}
              onResolvedAddress={(address) => setResolvedAddress(address)}
            />
            <SeparatorSmall />
            <MessageAlert
              variant="info"
              text="Please only enter a valid Starknet address. Sending funds to a different network might result in permanent loss."
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
            <SeparatorSmall />
            <div>
              <label htmlFor="feeToken">
                Select Token for Transaction Fees
              </label>
              <DropDown
                value={fields.feeToken}
                options={Object.values(FeeToken).map((token) => ({
                  label: token,
                  value: token,
                }))}
                onChange={(e) => handleChange('feeToken', e.value)}
              />
            </div>
          </Wrapper>
          <Buttons>
            <ButtonStyled
              onClick={closeModal}
              backgroundTransparent
              borderVisible
            >
              CANCEL
            </ButtonStyled>
            <ButtonStyled
              onClick={() => setSummaryModalOpen(true)}
              enabled={confirmEnabled()}
            >
              CONFIRM
            </ButtonStyled>
          </Buttons>
        </div>
      )}

      {summaryModalOpen && (
        <SendSummaryModal
          closeModal={closeModal}
          address={resolvedAddress}
          amount={fields.amount}
          chainId={fields.chainId}
          selectedFeeToken={fields.feeToken} // Pass the selected fee token
        />
      )}
    </>
  );
};
