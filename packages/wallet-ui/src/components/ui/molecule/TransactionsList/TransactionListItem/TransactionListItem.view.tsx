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
  getTxnValues,
} from './types';
import { getHumanReadableAmount, openExplorerTab } from 'utils/utils';
import { useMultiLanguage } from 'services';

interface Props {
  transaction: Transaction;
}

function toCamelCase(str: string) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w|\s+|_|-)/g, (match, index) =>
      index === 0 ? match.toLowerCase() : match.toUpperCase(),
    )
    .replace(/\s+/g, '')
    .replace(/[-_]+/g, '');
}

export const TransactionListItemView = ({ transaction }: Props) => {
  const wallet = useAppSelector((state) => state.wallet);
  const tokenAddress = wallet.erc20TokenBalanceSelected.address;
  const [currencySymbol, setCurrencySymbol] = useState('N/A');
  const [txnValue, setTxnValue] = useState('0');
  const [txnUsdValue, setTxnUsdValue] = useState('0.00');
  const { translate } = useMultiLanguage();

  const { locale } = useAppSelector((state) => state.wallet);

  useEffect(() => {
    const fetchData = async () => {
      // Find the matching token
      const foundToken = wallet.erc20TokenBalances.find((token) =>
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

  const txnName = getTxnName(transaction, tokenAddress);
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
          <Label>{translate(toCamelCase(txnName))}</Label>
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
        {txnName === 'Send' && (
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
