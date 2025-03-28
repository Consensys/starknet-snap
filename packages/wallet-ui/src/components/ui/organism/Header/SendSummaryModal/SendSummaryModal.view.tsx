/* eslint-disable react-hooks/exhaustive-deps */
import {
  getAmountPrice,
  getHumanReadableAmount,
  getMaxDecimalsReadable,
  shortenAddress,
} from 'utils/utils';
import { AssetQuantity } from 'components/ui/molecule/AssetQuantity';
import { PopperTooltip } from 'components/ui/molecule/PopperTooltip';
import {
  AddressDiv,
  ButtonStyled,
  CurrencyAmount,
  LeftSummary,
  RightSummary,
  Summary,
  ToDiv,
  TotalAmount,
  USDAmount,
  EstimatedFeesTooltip,
  IncludeDeploy,
  AlertTotalExceedsAmount,
  LoadingWrapper,
} from './SendSummaryModal.style';
import { Modal } from 'components/ui/atom/Modal';
import { useAppDispatch, useAppSelector } from 'hooks/redux';
import { useEffect, useState } from 'react';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { ethers } from 'ethers';
import Toastr from 'toastr2';
import { ContractFuncName, FeeToken, FeeTokenUnit, FeeEstimate } from 'types';
import { updateCurrentAccount } from 'slices/walletSlice';
import { useCurrentAccount } from 'hooks';

interface Props {
  address: string;
  amount: string;
  chainId: string;
  closeModal?: () => void;
  handleBack: () => void;
  selectedFeeToken: FeeToken;
  gasFees: FeeEstimate;
  isEstimatingGas: boolean;
}

export const SendSummaryModalView = ({
  address,
  amount,
  chainId,
  closeModal,
  handleBack,
  selectedFeeToken,
  gasFees,
  isEstimatingGas,
}: Props) => {
  const dispatch = useAppDispatch();
  const { address: currentAddress } = useCurrentAccount();
  const erc20TokenBalances = useAppSelector(
    (state) => state.wallet.erc20TokenBalances,
  );
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );
  const [gasFeesAmount, setGasFeesAmount] = useState('');
  const [gasFeesAmountUSD, setGasFeesAmountUSD] = useState('');
  const [amountUsdPrice, setAmountUsdPrice] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [totalAmountUSD, setTotalAmountUSD] = useState('');
  const [totalExceedsBalance, setTotalExceedsBalance] = useState(false);
  const { sendTransaction, getTransactions } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const ethToken = erc20TokenBalances[0];
  const feeToken =
    erc20TokenBalances.find((token) => token.symbol === selectedFeeToken) ??
    ethToken;

  const toastr = new Toastr({
    closeDuration: 10000000,
    showDuration: 1000000000,
    positionClass: 'toast-top-center',
  });

  useEffect(() => {
    if (gasFees?.fee) {
      const gasFeesBN = ethers.utils.parseUnits(gasFees.fee, FeeTokenUnit.ETH);
      let totalToCheck = gasFeesBN;

      const gasFeesStr = ethers.utils.formatUnits(gasFeesBN, feeToken.decimals);
      const gasFeesFloat = parseFloat(gasFeesStr);
      setGasFeesAmount(getMaxDecimalsReadable(feeToken, gasFeesStr));
      if (feeToken.usdPrice) {
        setGasFeesAmountUSD(getAmountPrice(feeToken, gasFeesFloat, false));
      }
      const amountBN = ethers.utils.parseUnits(
        amount,
        erc20TokenBalanceSelected.decimals,
      );
      // Combine the transaction amount and fee amount if they are the same token.
      // And verify if the combined amount is not exceeding the total balance.
      if (erc20TokenBalanceSelected.address === feeToken.address) {
        const totalAmountBN = gasFeesBN.add(amountBN);
        totalToCheck = totalAmountBN;
        const totalAmount = ethers.utils.formatUnits(
          totalAmountBN,
          feeToken.decimals,
        );
        setTotalAmount(getMaxDecimalsReadable(feeToken, totalAmount));
        const totalAmountFloat = parseFloat(totalAmount);
        if (feeToken.usdPrice) {
          setTotalAmountUSD(getAmountPrice(feeToken, totalAmountFloat, false));
        }
      } else if (amountUsdPrice) {
        const amountGasFeeUSDFloat = parseFloat(
          getAmountPrice(feeToken, gasFeesFloat, false),
        );
        const amountUSDFloat = parseFloat(amountUsdPrice);
        const totalUSDAmount = amountUSDFloat + amountGasFeeUSDFloat;
        setTotalAmountUSD(totalUSDAmount.toFixed(2));
      }

      if (totalToCheck.gt(feeToken.amount)) {
        setTotalExceedsBalance(true);
      } else {
        setTotalExceedsBalance(false);
      }
    } else {
      setTotalExceedsBalance(true);
    }
  }, [gasFees]);

  useEffect(() => {
    const amountFloat = parseFloat(amount);
    erc20TokenBalanceSelected.usdPrice &&
      setAmountUsdPrice(
        getAmountPrice(erc20TokenBalanceSelected, amountFloat, false),
      );
  }, [amount, erc20TokenBalanceSelected]);

  const handleConfirmClick = () => {
    const amountBN = ethers.utils.parseUnits(
      amount,
      erc20TokenBalanceSelected.decimals,
    );
    const callData = address + ',' + amountBN.toString() + ',0';
    sendTransaction(
      erc20TokenBalanceSelected.address,
      ContractFuncName.Transfer,
      callData,
      currentAddress,
      gasFees.fee,
      chainId,
      selectedFeeToken,
    )
      .then((result) => {
        if (result) {
          toastr.success(translate('transactionSentSuccessfully'));
          getTransactions(
            currentAddress,
            erc20TokenBalanceSelected.address,
            10,
            chainId,
            false,
            true,
          ).catch((err) => {
            console.error(
              `handleConfirmClick: error from getTransactions: ${err}`,
            );
          });
          if (gasFees.includeDeploy) {
            dispatch(updateCurrentAccount({ isDeployed: true }));
          }
        } else {
          toastr.info(translate('transactionRejectedByUser'));
        }
      })
      .catch(() => {
        toastr.error(translate('errorSendingTransaction'));
      });
    closeModal && closeModal();
  };

  const totalAmountDisplay = () => {
    if (erc20TokenBalances.length > 0) {
      if (erc20TokenBalanceSelected.address === feeToken.address) {
        return totalAmount + ` ${feeToken.symbol}`;
      } else {
        return (
          getHumanReadableAmount(erc20TokenBalanceSelected, amount) +
          ' ' +
          erc20TokenBalanceSelected.symbol +
          ' + ' +
          gasFeesAmount +
          ` ${feeToken.symbol}`
        );
      }
    }
  };

  return (
    <Modal>
      <Modal.Title>{translate('send')}</Modal.Title>
      <Modal.Body>
        <ToDiv>To</ToDiv>
        <AddressDiv>{shortenAddress(address)}</AddressDiv>
        <AssetQuantity
          currency={erc20TokenBalanceSelected.symbol}
          currencyValue={getMaxDecimalsReadable(
            erc20TokenBalanceSelected,
            amount,
          )}
          USDValue={amountUsdPrice}
          size="medium"
          centered
        />
        <Summary>
          <LeftSummary>
            <PopperTooltip
              placement="top"
              closeTrigger="hover"
              content={
                <EstimatedFeesTooltip>
                  {translate('gasFeesDefinition')}
                  <br></br>
                  <br></br>
                </EstimatedFeesTooltip>
              }
            >
              {translate('estimatedFee')}
            </PopperTooltip>
          </LeftSummary>
          <RightSummary>
            {isEstimatingGas && <LoadingWrapper />}
            {!isEstimatingGas && (
              <>
                <CurrencyAmount>
                  {gasFeesAmount} {selectedFeeToken}
                </CurrencyAmount>
                <USDAmount>{gasFeesAmountUSD} USD</USDAmount>
              </>
            )}
          </RightSummary>
        </Summary>

        <TotalAmount>
          {translate('maximumFees')} {gasFeesAmount} {selectedFeeToken}
        </TotalAmount>
        {gasFees && gasFees.includeDeploy && (
          <IncludeDeploy>
            *{translate('feesIncludeOneTimeDeploymentFee')}
          </IncludeDeploy>
        )}
        <Summary>
          <LeftSummary>
            <PopperTooltip
              placement="right"
              closeTrigger="hover"
              content="Amount + Fee"
            >
              {translate('total')}
            </PopperTooltip>
          </LeftSummary>
          <RightSummary>
            <CurrencyAmount>{totalAmountDisplay()}</CurrencyAmount>
            <USDAmount>{totalAmountUSD} USD</USDAmount>
          </RightSummary>
        </Summary>
        {totalAmount && (
          <TotalAmount>
            {translate('maximumAmount')} {totalAmount} {selectedFeeToken}
          </TotalAmount>
        )}
        {!isEstimatingGas && totalExceedsBalance && (
          <AlertTotalExceedsAmount
            text={translate('insufficientFundsForFees')}
            variant="warning"
          />
        )}
      </Modal.Body>
      <Modal.Buttons>
        <ButtonStyled
          onClick={() => handleBack()}
          backgroundTransparent
          borderVisible
        >
          {translate('back').toUpperCase()}
        </ButtonStyled>
        <ButtonStyled
          enabled={!isEstimatingGas && !totalExceedsBalance}
          onClick={handleConfirmClick}
        >
          {translate('confirm')}
        </ButtonStyled>
      </Modal.Buttons>
    </Modal>
  );
};
