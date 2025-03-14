import { useState } from 'react';
import { useCurrentNetwork, useEstimateFee } from 'hooks';
import { FeeToken } from 'types';
import { DEFAULT_FEE_TOKEN } from 'utils/constants';
import { SendInputModal } from '../SendInputModal';
import { SendSummaryModal } from '../SendSummaryModal';

interface Props {
  closeModal?: () => void;
}

export const SendModalView = ({ closeModal }: Props) => {
  const chainId = useCurrentNetwork()?.chainId;
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const { loading, feeEstimates, flushFeeCache } =
    useEstimateFee(DEFAULT_FEE_TOKEN);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [fields, setFields] = useState({
    amount: '',
    address: '',
    chainId: chainId ?? '',
    feeToken: FeeToken.ETH, // Default fee token
  });

  const handlSetFields = (
    fields: Partial<{
      amount: string;
      address: string;
      chainId: string;
      feeToken: FeeToken;
    }>,
  ) => {
    setFields((prevFields) => ({
      ...prevFields,
      ...fields,
    }));
  };

  const handleBack = () => {
    setSummaryModalOpen(false);
  };

  return (
    <>
      {!summaryModalOpen && (
        <SendInputModal
          closeModal={closeModal}
          setSummaryModalOpen={setSummaryModalOpen}
          feeEstimates={feeEstimates}
          isEstimatingGas={loading}
          handlSetFields={handlSetFields}
          resolvedAddress={resolvedAddress}
          setResolvedAddress={setResolvedAddress}
          fields={fields}
        />
      )}
      {summaryModalOpen && (
        <SendSummaryModal
          closeModal={() => {
            if (feeEstimates.includeDeploy) {
              flushFeeCache();
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
