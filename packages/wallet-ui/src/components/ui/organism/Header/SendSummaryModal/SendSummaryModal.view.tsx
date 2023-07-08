/* eslint-disable react-hooks/exhaustive-deps */
import { getAmountPrice, getHumanReadableAmount, getMaxDecimalsReadable, shortenAddress } from 'utils/utils';
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
import { useStarkNetSnap } from 'services';
import { ethers } from 'ethers';
import Toastr from 'toastr2';

interface Props {
  address: string;
  amount: string;
  chainId: string;
  closeModal?: () => void;
}

export const SendSummaryModalView = ({ address, amount, chainId, closeModal }: Props) => {
  const wallet = useAppSelector((state) => state.wallet);
  const [estimatingGas, setEstimatingGas] = useState(true);
  const [gasFees, setGasFees] = useState({ suggestedMaxFee: '0', unit: 'wei', includeDeploy: false });
  const [gasFeesError, setGasFeesError] = useState(false);
  const [gasFeesAmount, setGasFeesAmount] = useState('');
  const [gasFeesAmountUSD, setGasFeesAmountUSD] = useState('');
  const [amountUsdPrice, setAmountUsdPrice] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [totalAmountUSD, setTotalAmountUSD] = useState('');
  const [totalExceedsBalance, setTotalExceedsBalance] = useState(false);
  const { estimateFees, sendTransaction, getTransactions } = useStarkNetSnap();

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
        const amountBN = ethers.utils.parseUnits(amount, wallet.erc20TokenBalanceSelected.decimals);
        const callData = address + ',' + amountBN.toString() + ',0';
        estimateFees(
          wallet.erc20TokenBalanceSelected.address,
          'transfer',
          callData,
          wallet.accounts[0] as unknown as string,
          chainId,
        )
          .then((response) => {
            if (response.message && response.message.includes('Error')) {
              toastr.error('Error when trying to calculate the gas fees');
              setGasFeesError(true);
            } else {
              setGasFees(response);
            }
            setEstimatingGas(false);
          })
          .catch(() => {
            toastr.error('Error when trying to calculate the gas fees');
          });
      }
    };
    fetchGasFee();
  }, []);

  useEffect(() => {
    if (gasFees?.suggestedMaxFee) {
      //We assume the first token for the user will always be ETH
      const ethToken = wallet.erc20TokenBalances[0];
      const gasFeesBN = ethers.utils.parseUnits(gasFees.suggestedMaxFee, gasFees.unit);
      let totalToCheck = gasFeesBN;
      const gasFeesStr = ethers.utils.formatUnits(gasFeesBN, ethToken.decimals);
      const gasFeesFloat = parseFloat(gasFeesStr);
      setGasFeesAmount(getMaxDecimalsReadable(ethToken, gasFeesStr));
      if (ethToken.usdPrice) {
        setGasFeesAmountUSD(getAmountPrice(ethToken, gasFeesFloat, false));
      }
      const amountBN = ethers.utils.parseUnits(amount, wallet.erc20TokenBalanceSelected.decimals);
      if (wallet.erc20TokenBalanceSelected.address === ethToken.address) {
        //We add the fees with the amount if the current token is ETH
        const totalAmountBN = gasFeesBN.add(amountBN);
        totalToCheck = totalAmountBN;
        const totalAmount = ethers.utils.formatUnits(totalAmountBN, ethToken.decimals);
        setTotalAmount(getMaxDecimalsReadable(ethToken, totalAmount));
        const totalAmountFloat = parseFloat(totalAmount);
        if (ethToken.usdPrice) {
          setTotalAmountUSD(getAmountPrice(ethToken, totalAmountFloat, false));
        }
      } else if (amountUsdPrice) {
        const amountGasFeeUSDFloat = parseFloat(getAmountPrice(ethToken, gasFeesFloat, false));
        const amountUSDFloat = parseFloat(amountUsdPrice);
        const totalUSDAmount = amountUSDFloat + amountGasFeeUSDFloat;
        setTotalAmountUSD(totalUSDAmount.toFixed(2));
      }
      //Check if total amount exceeds or gasFees exceeds ETH balance
      if (totalToCheck.gt(ethToken.amount)) {
        setTotalExceedsBalance(true);
      } else {
        setTotalExceedsBalance(false);
      }
    }
  }, [gasFees]);

  useEffect(() => {
    const amountFloat = parseFloat(amount);
    wallet.erc20TokenBalanceSelected.usdPrice &&
      setAmountUsdPrice(getAmountPrice(wallet.erc20TokenBalanceSelected, amountFloat, false));
  }, [amount, wallet.erc20TokenBalanceSelected]);

  const handleConfirmClick = () => {
    if (wallet.accounts) {
      const amountBN = ethers.utils.parseUnits(amount, wallet.erc20TokenBalanceSelected.decimals);
      const callData = address + ',' + amountBN.toString() + ',0';
      sendTransaction(
        wallet.erc20TokenBalanceSelected.address,
        'transfer',
        callData,
        wallet.accounts[0] as unknown as string,
        gasFees.suggestedMaxFee,
        chainId,
      )
        .then((result) => {
          if (result) {
            toastr.success('Transaction sent successfully');
            // can't trigger getTransaction by calling dispatch or setErc20TokenBalance here
            getTransactions(
              wallet.accounts[0] as unknown as string,
              wallet.erc20TokenBalanceSelected.address,
              10,
              10,
              chainId,
              false,
              true,
            ).catch((err) => {
              console.error(`handleConfirmClick: error from getTransactions: ${err}`);
            });
          } else {
            toastr.info('Transaction rejected by user');
          }
        })
        .catch(() => {
          toastr.error('Error while sending the transaction');
        });
      closeModal && closeModal();
    }
  };

  const totalAmountDisplay = () => {
    if (wallet.erc20TokenBalances.length > 0) {
      if (wallet.erc20TokenBalanceSelected.address === wallet.erc20TokenBalances[0].address) {
        //ETH selected
        return totalAmount + ' ETH';
      } else {
        return (
          getHumanReadableAmount(wallet.erc20TokenBalanceSelected, amount) +
          ' ' +
          wallet.erc20TokenBalanceSelected.symbol +
          ' + ' +
          gasFeesAmount +
          ' ETH'
        );
      }
    }
  };

  return (
    <div>
      <Wrapper>
        <Header>
          <Title>Send</Title>
        </Header>
        <ToDiv>To</ToDiv>
        <AddressDiv>{shortenAddress(address)}</AddressDiv>
        <AssetQuantity
          currency={wallet.erc20TokenBalanceSelected.symbol}
          currencyValue={getMaxDecimalsReadable(wallet.erc20TokenBalanceSelected, amount)}
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
                  Gas fees are defined by the network and fluctuate depending on network traffic and transaction
                  complexity.
                  <br></br>
                  <br></br>
                </EstimatedFeesTooltip>
              }
            >
              Estimated Fee
            </PopperTooltip>
          </LeftSummary>
          <RightSummary>
            {estimatingGas && <LoadingWrapper />}
            {!estimatingGas && (
              <>
                <CurrencyAmount>{gasFeesAmount} ETH</CurrencyAmount>
                <USDAmount>{gasFeesAmountUSD} USD</USDAmount>
              </>
            )}
          </RightSummary>
        </Summary>
        {!estimatingGas && <TotalAmount>Maximum fees: {gasFeesAmount} ETH</TotalAmount>}
        {gasFees.includeDeploy && <IncludeDeploy>*Fees include a one-time deployment fee</IncludeDeploy>}
        <Summary>
          <LeftSummary>
            <PopperTooltip placement="right" closeTrigger="hover" content="Amount + Fee">
              Total
            </PopperTooltip>
          </LeftSummary>
          <RightSummary>
            <CurrencyAmount>{totalAmountDisplay()}</CurrencyAmount>
            <USDAmount>{totalAmountUSD} USD</USDAmount>
          </RightSummary>
        </Summary>
        {totalAmount && <TotalAmount>Maximum amount: {totalAmount} ETH</TotalAmount>}
        {totalExceedsBalance && <AlertTotalExceedsAmount text="Insufficient funds for fees" variant="warning" />}
      </Wrapper>
      <Buttons>
        <ButtonStyled onClick={closeModal} backgroundTransparent borderVisible>
          REJECT
        </ButtonStyled>
        <ButtonStyled enabled={!estimatingGas && !gasFeesError && !totalExceedsBalance} onClick={handleConfirmClick}>
          CONFIRM
        </ButtonStyled>
      </Buttons>
    </div>
  );
};
