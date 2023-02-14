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
  getTxnDate,
  getTxnFailureReason,
  getTxnName,
  getTxnStatus,
  getTxnToFromLabel,
  getTxnValues,
} from './types';
import { getHumanReadableAmount, openExplorerTab } from 'utils/utils';

interface Props {
  transaction: Transaction;
}

export const TransactionListItemView = ({ transaction }: Props) => {
  const wallet = useAppSelector((state) => state.wallet);
  const [currencySymbol, setCurrencySymbol] = useState('N/A');
  const [txnValue, setTxnValue] = useState('0');
  const [txnUsdValue, setTxnUsdValue] = useState('0.00');

  useEffect(() => {
    const fetchData = async () => {
      const foundToken = wallet.erc20TokenBalances.find((token) =>
        ethers.BigNumber.from(token.address).eq(ethers.BigNumber.from(transaction.contractAddress)),
      );
      if (foundToken) {
        const txnValues = getTxnValues(transaction, foundToken.decimals, foundToken.usdPrice);
        setTxnValue(getHumanReadableAmount(foundToken, txnValues.txnValue));
        setTxnUsdValue(txnValues.txnUsdValue);
        setCurrencySymbol(foundToken.symbol);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const txnName = getTxnName(transaction);
  const txnDate = getTxnDate(transaction);
  const txnStatus = getTxnStatus(transaction);
  const txnToFromLabel = getTxnToFromLabel(transaction);
  const txnFailureReason = getTxnFailureReason(transaction);

  return (
    <Wrapper onClick={() => openExplorerTab(transaction.txnHash, 'tx', transaction.chainId)}>
      <Left>
        <LeftIcon>
          <IconStyled transactionname={txnName} icon={getIcon(txnName)} />
        </LeftIcon>
        <Column>
          <Label>{txnName}</Label>
          <Description>
            {txnDate}
            <Status status={txnStatus}>
              {' '}
              . {txnStatus}
              {txnFailureReason}
            </Status>
          </Description>
        </Column>
      </Left>
      <Middle>{txnToFromLabel} </Middle>
      <Right>
        {txnName === 'Send' && (
          <AssetQuantity currency={currencySymbol} currencyValue={txnValue} USDValue={txnUsdValue} />
        )}
      </Right>
    </Wrapper>
  );
};
