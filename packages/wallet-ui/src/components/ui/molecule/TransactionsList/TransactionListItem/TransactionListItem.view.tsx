import { Transaction } from 'types';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useAppSelector } from 'hooks/redux';
import { AssetQuantity } from 'components/ui/molecule/AssetQuantity';
import {
  Column,
  Description,
  IconStyled,
  Label,
  Left,
  LeftIcon,
  Middle,
  Right,
  Status,
  Wrapper,
} from './TransactionListItem.style';
import {
  getIcon,
  getTranslationNameForTxnType,
  getTxnDate,
  getTxnFailureReason,
  getTxnStatus,
  getTxnType,
  getTxnValues,
  TxnType,
} from './types';
import { getHumanReadableAmount, openExplorerTab } from 'utils/utils';
import { useMultiLanguage } from 'services';

interface Props {
  transaction: Transaction;
}

export const TransactionListItemView = ({ transaction }: Props) => {
  const { translate } = useMultiLanguage();
  const erc20TokenBalances = useAppSelector(
    (state) => state.wallet.erc20TokenBalances,
  );
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );
  const locale = useAppSelector((state) => state.wallet.locale);
  const [currencySymbol, setCurrencySymbol] = useState('N/A');
  const [txnValue, setTxnValue] = useState('0');
  const [txnUsdValue, setTxnUsdValue] = useState('0.00');
  const tokenAddress = erc20TokenBalanceSelected.address;

  useEffect(() => {
    const fetchData = async () => {
      // Find the matching token
      const foundToken = erc20TokenBalances.find((token) =>
        ethers.BigNumber.from(token.address).eq(
          ethers.BigNumber.from(tokenAddress),
        ),
      );
      if (foundToken) {
        const txnValues = getTxnValues(
          transaction,
          foundToken.decimals,
          foundToken.usdPrice,
          tokenAddress,
        );
        setTxnValue(getHumanReadableAmount(foundToken, txnValues.txnValue));
        setTxnUsdValue(txnValues.txnUsdValue);
        setCurrencySymbol(foundToken.symbol);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const txnName = getTxnType(transaction, tokenAddress);
  const txnNameTranslated = getTranslationNameForTxnType(txnName, translate);
  const txnDate = getTxnDate(transaction, locale);
  const txnStatus = getTxnStatus(transaction);
  const txnToFromLabel = '';
  const txnFailureReason = getTxnFailureReason(transaction);
  return (
    <Wrapper
      onClick={() =>
        openExplorerTab(transaction.txnHash, 'tx', transaction.chainId)
      }
    >
      <Left>
        <LeftIcon>
          <IconStyled transactionname={txnName} icon={getIcon(txnName)} />
        </LeftIcon>
        <Column>
          <Label>{txnNameTranslated}</Label>
          <Description>
            {txnDate}
            <br />
            <Status status={transaction.executionStatus}>
              {txnStatus}
              {txnFailureReason}
            </Status>
          </Description>
        </Column>
      </Left>
      <Middle>{txnToFromLabel} </Middle>
      <Right>
        {txnName === TxnType.Send && (
          <AssetQuantity
            currency={currencySymbol}
            currencyValue={txnValue}
            USDValue={txnUsdValue}
          />
        )}
      </Right>
    </Wrapper>
  );
};
