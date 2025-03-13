import { useRef, useState } from 'react';
import { ethers } from 'ethers';

import { useAppSelector, useCurrentNetwork, useEstimateFee } from 'hooks';
import { FeeToken } from 'types';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { DEFAULT_FEE_TOKEN } from 'utils/constants';
import { isValidAddress, isValidStarkName } from 'utils/utils';
import { SendInputModal } from '../SendInputModal';
import { SendSummaryModal } from '../SendSummaryModal';

interface Props {
  closeModal?: () => void;
}

export const SendModalView = ({ closeModal }: Props) => {
  const chainId = useCurrentNetwork()?.chainId;
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );
  const { getAddrFromStarkName } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  // Indicates if the max amount should be auto-applied.
  // When "Max" is clicked while fees are fetching, shouldApplyMax is set to true.
  // Once fees are fetched, it applies the max amount and resets to false.
  const [shouldApplyMax, setShouldApplyMax] = useState(false);
  const [loadingStrkName, setLoadingStrkName] = useState(false);
  const [fields, setFields] = useState({
    amount: '',
    address: '',
    chainId: chainId ?? '',
    feeToken: DEFAULT_FEE_TOKEN, // Default fee token
  });
  const [errors, setErrors] = useState({ amount: '', address: '' });
  const [resolvedAddress, setResolvedAddress] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { loading, feeEstimates, deleteFee } = useEstimateFee(fields.feeToken);
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
      !loadingStrkName &&
      // Disable confirm button if loading is true
      // and shouldApplyMax is true (i.e. the user clicked the "Max" button)
      // in order to prevent the user from confirming the transaction
      // before the maximum amount is applied.
      !(loading && shouldApplyMax)
    );
  };

  return (
    <>
      {!summaryModalOpen && (
        <SendInputModal
          closeModal={closeModal}
          setSummaryModalOpen={setSummaryModalOpen}
          confirmEnabled={confirmEnabled}
          handleChange={handleChange}
          fields={fields}
          errors={errors}
          resolvedAddress={resolvedAddress}
          loading={loading}
          shouldApplyMax={shouldApplyMax}
          setShouldApplyMax={setShouldApplyMax}
          feeEstimates={feeEstimates}
        />
      )}
      {summaryModalOpen && (
        <SendSummaryModal
          closeModal={() => {
            if (feeEstimates.includeDeploy) {
              deleteFee();
            }
            closeModal && closeModal();
          }}
          handleBack={handleBack}
          address={resolvedAddress}
          amount={fields.amount}
          chainId={fields.chainId}
          gasFees={feeEstimates}
          selectedFeeToken={fields.feeToken}
          isEstimatingGas={loading}
        />
      )}
    </>
  );
};
