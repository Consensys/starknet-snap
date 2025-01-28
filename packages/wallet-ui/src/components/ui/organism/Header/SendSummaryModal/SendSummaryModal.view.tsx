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
  Buttons,
  ButtonStyled,
  CurrencyAmount,
  Header,
  LeftSummary,
  Title,
  RightSummary,
  Summary,
  ToDiv,
  TotalAmount,
  USDAmount,
  Wrapper,
  EstimatedFeesTooltip,
  LoadingWrapper,
  IncludeDeploy,
  AlertTotalExceedsAmount,
} from './SendSummaryModal.style';
import { useAppSelector } from 'hooks/redux';
import { useEffect, useState } from 'react';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { ethers } from 'ethers';
import Toastr from 'toastr2';
import { constants } from 'starknet';
import { ContractFuncName, FeeToken, FeeTokenUnit } from 'types';

interface Props {
  address: string;
  amount: string;
  chainId: string;
  closeModal?: () => void;
  selectedFeeToken: FeeToken;
}

export const SendSummaryModalView = ({
  address,
  amount,
  chainId,
  closeModal,
  selectedFeeToken,
}: Props) => {
  const wallet = useAppSelector((state) => state.wallet);
  const [estimatingGas, setEstimatingGas] = useState(true);
  const [gasFees, setGasFees] = useState({
    suggestedMaxFee: '0',
    unit:
      selectedFeeToken === FeeToken.ETH ? FeeTokenUnit.ETH : FeeTokenUnit.STRK,
    includeDeploy: false,
  });
  const [gasFeesError, setGasFeesError] = useState(false);
  const [gasFeesAmount, setGasFeesAmount] = useState('');
  const [gasFeesAmountUSD, setGasFeesAmountUSD] = useState('');
  const [amountUsdPrice, setAmountUsdPrice] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [totalAmountUSD, setTotalAmountUSD] = useState('');
  const [totalExceedsBalance, setTotalExceedsBalance] = useState(false);
  const { estimateFees, sendTransaction, getTransactions } = useStarkNetSnap();
  const { translate } = useMultiLanguage();

  const ethToken = wallet.erc20TokenBalances[0];
  const feeToken =
    wallet.erc20TokenBalances.find(
      (token) => token.symbol === selectedFeeToken,
    ) ?? ethToken;

  const toastr = new Toastr({
    closeDuration: 10000000,
    showDuration: 1000000000,
    positionClass: 'toast-top-center',
  });

  useEffect(() => {
    const fetchGasFee = () => {
      if (wallet.accounts) {
        setGasFeesError(false);
        setEstimatingGas(true);
        const amountBN = ethers.utils.parseUnits(
          amount,
          wallet.erc20TokenBalanceSelected.decimals,
        );
        const callData = address + ',' + amountBN.toString() + ',0';
        estimateFees(
          wallet.erc20TokenBalanceSelected.address,
          ContractFuncName.Transfer,
          callData,
          wallet.accounts[0] as unknown as string,
          chainId,
          selectedFeeToken === FeeToken.STRK
            ? constants.TRANSACTION_VERSION.V3
            : undefined,
        )
          .then((response) => {
            if (response.message && response.message.includes('Error')) {
              toastr.error(translate('errorCalculatingGasFees'));
              setGasFeesError(true);
            } else {
              setGasFees(response);
            }
            setEstimatingGas(false);
          })
          .catch(() => {
            toastr.error(translate('errorCalculatingGasFees'));
          });
      }
    };
    fetchGasFee();
  }, []);

  useEffect(() => {
    if (gasFees?.suggestedMaxFee) {
      const gasFeesBN = ethers.utils.parseUnits(
        gasFees.suggestedMaxFee,
        FeeTokenUnit.ETH,
      );
      let totalToCheck = gasFeesBN;

      const gasFeesStr = ethers.utils.formatUnits(gasFeesBN, feeToken.decimals);
      const gasFeesFloat = parseFloat(gasFeesStr);
      setGasFeesAmount(getMaxDecimalsReadable(feeToken, gasFeesStr));
      if (feeToken.usdPrice) {
        setGasFeesAmountUSD(getAmountPrice(feeToken, gasFeesFloat, false));
      }
      const amountBN = ethers.utils.parseUnits(
        amount,
        wallet.erc20TokenBalanceSelected.decimals,
      );
      // Combine the transaction amount and fee amount if they are the same token.
      // And verify if the combined amount is not exceeding the total balance.
      if (wallet.erc20TokenBalanceSelected.address === feeToken.address) {
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
    wallet.erc20TokenBalanceSelected.usdPrice &&
      setAmountUsdPrice(
        getAmountPrice(wallet.erc20TokenBalanceSelected, amountFloat, false),
      );
  }, [amount, wallet.erc20TokenBalanceSelected]);

  const handleConfirmClick = () => {
    if (wallet.accounts) {
      const amountBN = ethers.utils.parseUnits(
        amount,
        wallet.erc20TokenBalanceSelected.decimals,
      );
      const callData = address + ',' + amountBN.toString() + ',0';
      sendTransaction(
        wallet.erc20TokenBalanceSelected.address,
        ContractFuncName.Transfer,
        callData,
        wallet.accounts[0] as unknown as string,
        gasFees.suggestedMaxFee,
        chainId,
        selectedFeeToken,
      )
        .then((result) => {
          if (result) {
            toastr.success(translate('transactionSentSuccessfully'));
            getTransactions(
              wallet.accounts[0] as unknown as string,
              wallet.erc20TokenBalanceSelected.address,
              10,
              chainId,
              false,
              true,
            ).catch((err) => {
              console.error(
                `handleConfirmClick: error from getTransactions: ${err}`,
              );
            });
          } else {
            toastr.info(translate('transactionRejectedByUser'));
          }
        })
        .catch(() => {
          toastr.error(translate('errorSendingTransaction'));
        });
      closeModal && closeModal();
    }
  };

  const totalAmountDisplay = () => {
    if (wallet.erc20TokenBalances.length > 0) {
      if (wallet.erc20TokenBalanceSelected.address === feeToken.address) {
        return totalAmount + ` ${feeToken.symbol}`;
      } else {
        return (
          getHumanReadableAmount(wallet.erc20TokenBalanceSelected, amount) +
          ' ' +
          wallet.erc20TokenBalanceSelected.symbol +
          ' + ' +
          gasFeesAmount +
          ` ${feeToken.symbol}`
        );
      }
    }
  };

  return (
    <div>
      <Wrapper>
        <Header>
          <Title>{translate('send')}</Title>
        </Header>
        <ToDiv>To</ToDiv>
        <AddressDiv>{shortenAddress(address)}</AddressDiv>
        <AssetQuantity
          currency={wallet.erc20TokenBalanceSelected.symbol}
          currencyValue={getMaxDecimalsReadable(
            wallet.erc20TokenBalanceSelected,
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
            {estimatingGas && <LoadingWrapper />}
            {!estimatingGas && (
              <>
                <CurrencyAmount>
                  {gasFeesAmount} {selectedFeeToken}
                </CurrencyAmount>
                <USDAmount>{gasFeesAmountUSD} USD</USDAmount>
              </>
            )}
          </RightSummary>
        </Summary>
        {!estimatingGas && (
          <TotalAmount>
            {translate('maximumFees')} {gasFeesAmount} {selectedFeeToken}
          </TotalAmount>
        )}
        {gasFees.includeDeploy && (
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
        {totalExceedsBalance && (
          <AlertTotalExceedsAmount
            text={translate('insufficientFundsForFees')}
            variant="warning"
          />
        )}
      </Wrapper>
      <Buttons>
        <ButtonStyled onClick={closeModal} backgroundTransparent borderVisible>
          {translate('reject')}
        </ButtonStyled>
        <ButtonStyled
          enabled={!estimatingGas && !gasFeesError && !totalExceedsBalance}
          onClick={handleConfirmClick}
        >
          {translate('confirm')}
        </ButtonStyled>
      </Buttons>
    </div>
  );
};
