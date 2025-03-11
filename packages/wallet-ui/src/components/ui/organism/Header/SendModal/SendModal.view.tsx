import { useRef, useState } from 'react';
import { ethers } from 'ethers';

import { useAppSelector, useCurrentNetwork, useEstimateFee } from 'hooks';
import { FeeToken } from 'types';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { DEFAULT_FEE_TOKEN } from 'utils/constants';
import {
  getMaxAmountToSpend,
  isValidAddress,
  isValidStarkName,
  shortenAddress,
} from 'utils/utils';
import { AmountInput } from 'components/ui/molecule/AmountInput';
import { AddressInput } from 'components/ui/molecule/AddressInput';
import { DropDown } from 'components/ui/molecule/DropDown';
import {
  Bold,
  Normal,
} from 'components/ui/organism/ConnectInfoModal/ConnectInfoModal.style';
import { InfoText } from 'components/ui/molecule/AddressInput/AddressInput.style';
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
import { SendSummaryModal } from '../SendSummaryModal';

interface Props {
  closeModal?: () => void;
}

export const SendModalView = ({ closeModal }: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const chainId = useCurrentNetwork()?.chainId;
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );
  const { getAddrFromStarkName } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [shouldApplyMax, setShouldApplyMax] = useState(false);
  const [fields, setFields] = useState({
    amount: '',
    address: '',
    chainId: chainId ?? '',
    feeToken: DEFAULT_FEE_TOKEN, // Default fee token
  });
  const [errors, setErrors] = useState({ amount: '', address: '' });
  const [resolvedAddress, setResolvedAddress] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { loading, feeEstimates } = useEstimateFee(fields.feeToken);

  const handleBack = () => {
    setSummaryModalOpen(false);
  };

  const handleChange = (fieldName: string, fieldValue: string) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: '',
    }));
    switch (fieldName) {
      case 'amount':
        if (fieldValue !== '' && fieldValue !== '.') {
          try {
            const inputAmount = ethers.utils.parseUnits(
              fieldValue,
              erc20TokenBalanceSelected.decimals,
            );
            const userBalance = erc20TokenBalanceSelected.amount;
            if (inputAmount.gt(userBalance)) {
              setErrors((prevErrors) => ({
                ...prevErrors,
                amount: translate('inputAmountExceedsBalance'),
              }));
            }
          } catch (error) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              amount: translate('invalidAmount'),
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
      !(loading && shouldApplyMax)
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
              value={fields.address}
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
              value={fields.amount}
              error={errors.amount !== '' ? true : false}
              helperText={errors.amount}
              decimalsMax={erc20TokenBalanceSelected.decimals}
              asset={{
                ...erc20TokenBalanceSelected,
                amount: getMaxAmountToSpend(
                  erc20TokenBalanceSelected,
                  feeEstimates?.fee,
                ),
              }}
              isFetchingFee={loading}
              setShouldApplyMax={setShouldApplyMax}
              shouldApplyMax={shouldApplyMax}
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
          handleBack={handleBack}
          address={resolvedAddress}
          amount={fields.amount}
          chainId={fields.chainId}
          gasFees={feeEstimates}
          selectedFeeToken={fields.feeToken} // Pass the selected fee token
        />
      )}
    </>
  );
};
