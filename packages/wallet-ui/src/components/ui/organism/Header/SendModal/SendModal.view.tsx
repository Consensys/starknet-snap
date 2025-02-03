import { useRef, useState } from 'react';
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
import { isValidAddress, isValidStarkName, shortenAddress } from 'utils/utils';
import { Bold, Normal } from '../../ConnectInfoModal/ConnectInfoModal.style';
import { DropDown } from 'components/ui/molecule/DropDown';
import { DEFAULT_FEE_TOKEN } from 'utils/constants';
import { FeeToken } from 'types';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { InfoText } from 'components/ui/molecule/AddressInput/AddressInput.style';

interface Props {
  closeModal?: () => void;
}

export const SendModalView = ({ closeModal }: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const wallet = useAppSelector((state) => state.wallet);
  const { getAddrFromStarkName } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (fieldName: string, fieldValue: string) => {
    //Check if input amount does not exceed user balance
    if (!translate) return;
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
              amount: translate('inputAmountExceedsBalance'),
            }));
          }
        }
        break;
      case 'address':
        if (fieldValue !== '') {
          if (debounceRef.current) clearTimeout(debounceRef.current);

          if (isValidAddress(fieldValue)) {
            setResolvedAddress(fieldValue);
            break;
          } else if (isValidStarkName(fieldValue)) {
            debounceRef.current = setTimeout(() => {
              setLoading(true);
              getAddrFromStarkName(fieldValue, chainId)
                .then((address) => {
                  setResolvedAddress(address);
                })
                .catch(() => {
                  setResolvedAddress('');
                  setErrors((prevErrors) => ({
                    ...prevErrors,
                    address: translate('starkNameDoesNotExist'),
                  }));
                })
                .finally(() => {
                  setLoading(false);
                });
            }, 300);
          } else {
            setResolvedAddress('');
            setErrors((prevErrors) => ({
              ...prevErrors,
              address: translate('invalidAddressFormat'),
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
      fields.address.length > 0 &&
      !loading
    );
  };

  return (
    <>
      {!summaryModalOpen && (
        <div>
          <Wrapper>
            <Header>
              <Title>{translate('send')}</Title>
            </Header>
            <Network>
              <Normal>{translate('network')}</Normal>
              <Bold>{networks.items[networks.activeNetwork].name}</Bold>
            </Network>
            <AddressInput
              label={translate('to')}
              placeholder={translate('pasteRecipientAddress')}
              onChange={(value) => handleChange('address', value.target.value)}
              disableValidate
              validateError={errors.address}
            />
            {isValidStarkName(fields.address) && resolvedAddress && (
              <InfoText>{shortenAddress(resolvedAddress, 12)}</InfoText>
            )}
            <SeparatorSmall />
            <MessageAlert
              variant="info"
              text={translate('validStarknetAddressOnly')}
            />
            <Separator />
            <AmountInput
              label={translate('amount')}
              onChangeCustom={(value) => handleChange('amount', value)}
              error={errors.amount !== '' ? true : false}
              helperText={errors.amount}
              decimalsMax={wallet.erc20TokenBalanceSelected.decimals}
              asset={wallet.erc20TokenBalanceSelected}
            />
            <SeparatorSmall />
            <div>
              <label htmlFor="feeToken">
                {translate('selectTokenForTransactionFees')}
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
              {translate('cancel')}
            </ButtonStyled>
            <ButtonStyled
              onClick={() => setSummaryModalOpen(true)}
              enabled={confirmEnabled()}
            >
              {translate('confirm')}
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
