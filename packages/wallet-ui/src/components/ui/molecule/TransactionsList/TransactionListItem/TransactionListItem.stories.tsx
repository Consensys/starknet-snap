import { Meta } from '@storybook/react';
import { Transaction } from 'types';
import { TransactionListItemView } from './TransactionListItem.view';

export default {
  title: 'Molecule/TransactionListItem',
  component: TransactionListItemView,
} as Meta;

const transaction: Transaction = {
  txnHash: '0x1321951d3102d45abd6dd9ac556b6a86190c78b1026279a8d44cb18c0008eb6',
  txnType: 'invoke',
  chainId: '0x534e5f474f45524c49',
  senderAddress: '0x05ccc9fc2d7ce9e2b0f2cee1a4b898570bb4d03ba23ad6f72f0db971bd04552c',
  contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  contractFuncName: 'transfer',
  contractCallData: ['0x6b686ebe2cbd70b37b54df1b9889cc3095b55f386110843912efcaed416ff3f', '0x0de0b6b3a7640000'],
  timestamp: 1655705597,
  status: 'Accepted on L1',
  eventIds: ['245417_20_0'],
  failureReason: '',
};

export const FullWidth = () => <TransactionListItemView transaction={transaction} />;

export const HalfWidth = () => {
  return (
    <div style={{ width: '50%' }}>
      <TransactionListItemView transaction={transaction} />
    </div>
  );
};
