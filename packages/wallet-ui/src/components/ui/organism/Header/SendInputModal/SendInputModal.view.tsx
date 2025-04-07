import { useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';

import { useAppSelector } from 'hooks';
import { FeeEstimate, FeeToken } from 'types';
import { useMultiLanguage, useStarkNetSnap } from 'services';
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
  ButtonStyled,
  MessageAlert,
  Network,
  Separator,
  SeparatorSmall,
} from './SendInputModal.style';
import { Modal } from 'components/ui/atom/Modal';

interface Fields {
  amount: string;
  address: string;
  chainId: string;
  feeToken: FeeToken;
}

interface Props {
  closeModal?: () => void;
  setSummaryModalOpen: (open: boolean) => void;
  feeEstimates: FeeEstimate;
  isEstimatingGas: boolean;
  handlSetFields: (fields: Partial<Fields>) => void;
  setResolvedAddress: (address: string) => void;
  fields: {
    amount: string;
    address: string;
    chainId: string;
    feeToken: FeeToken;
  };
  resolvedAddress: string;
  feeTokens: FeeToken[];
}

export const SendInputModalView = ({
  closeModal,
  setSummaryModalOpen,
  feeEstimates,
  isEstimatingGas,
  handlSetFields,
  setResolvedAddress,
  fields,
  resolvedAddress,
  feeTokens,
}: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );

  const { getAddrFromStarkName } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const [errors, setErrors] = useState({ amount: '', address: '' });
  const [isMaxAmountPending, setIsMaxAmountPending] = useState(false);
  const [loadingStrkName, setLoadingStrkName] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const feeTokenOptions = feeTokens.map((token) => ({
    label: token,
    value: token,
  }));

  const confirmEnabled = () => {
    return (
      !errors.address &&
      !errors.amount &&
      fields.amount.length > 0 &&
      fields.address.length > 0 &&
      !loadingStrkName &&
      // Disable confirm button if isEstimatingGas is true
      // and isMaxAmountPending is true (i.e. the user clicked the "Max" button)
      // in order to prevent the user from confirming the transaction
      // before the maximum amount is applied.
      !(isEstimatingGas && isMaxAmountPending)
    );
  };

  const handleChange = (fieldName: string, fieldValue: string) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: '',
    }));
    switch (fieldName) {
      case 'amount':
        // If input is not empty, attempt to parse and validate against balance.
        // Parsing failures or insufficient balance will trigger relevant errors.
        // Empty input is allowed here (not a format error) — required validation is handled separately.
        const isEmpty = fieldValue === '';
        // Reset error message, if any, when the input is cleared.
        // This allows the user to clear the input without showing an error.
        setErrors((prevErrors) => ({
          ...prevErrors,
          amount: '',
        }));
        if (!isEmpty) {
          try {
            const inputAmount = ethers.utils.parseUnits(
              fieldValue,
              erc20TokenBalanceSelected.decimals,
            );
            const userBalance = erc20TokenBalanceSelected.amount;
            const fee = feeEstimates?.fee || ethers.BigNumber.from(1);
            // Check if the selected fee token is the same as the token being sent
            // and if the input amount exceeds the user's balance after subtracting the fee
            if (
              fields.feeToken === erc20TokenBalanceSelected.symbol &&
              inputAmount.gt(userBalance.sub(fee))
            ) {
              setErrors((prevErrors) => ({
                ...prevErrors,
                amount: translate('inputAmountExceedsBalance'),
              }));
            }
            // Check if the input amount exceeds the user's total balance
            else if (inputAmount.gt(userBalance)) {
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
              setLoadingStrkName(true);
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
                  setLoadingStrkName(false);
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
    }
    handlSetFields({
      [fieldName]: fieldValue,
    });
  };

  useEffect(() => {
    // Revalidate the amount when the feeToken changes
    // This is because the maximum amount that can be spent depends on the selected fee token
    if (fields.feeToken) {
      handleChange('amount', fields.amount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.feeToken]);

  return (
    <Modal>
      <Modal.Title>{translate('send')}</Modal.Title>
      <Modal.Body>
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
              fields.feeToken,
            ),
          }}
          isEstimatingGas={isEstimatingGas}
          setIsMaxAmountPending={setIsMaxAmountPending}
          isMaxAmountPending={isMaxAmountPending}
          feeToken={fields.feeToken}
        />
        <SeparatorSmall />
        <div>
          <label htmlFor="feeToken">
            {translate('selectTokenForTransactionFees')}
          </label>
          <DropDown
            value={
              feeTokenOptions.some((option) => option.value === fields.feeToken)
                ? fields.feeToken
                : feeTokenOptions[0]?.value // fallback to first valid option
            }
            options={feeTokenOptions}
            onChange={(e) => handleChange('feeToken', e.value)}
          />
        </div>
      </Modal.Body>
      <Modal.Buttons>
        <ButtonStyled onClick={closeModal} backgroundTransparent borderVisible>
          {translate('cancel')}
        </ButtonStyled>
        <ButtonStyled
          onClick={() => setSummaryModalOpen(true)}
          enabled={confirmEnabled()}
        >
          {translate('confirm')}
        </ButtonStyled>
      </Modal.Buttons>
    </Modal>
  );
};
