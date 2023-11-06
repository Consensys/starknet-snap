import { Meta } from '@storybook/react';
import { BigNumber } from 'ethers';
import { constants } from 'starknet';
import { AmountInputView } from './AmountInput.view';

export default {
  title: 'Molecule/AmountInput',
  component: AmountInputView,
} as Meta;

const asset = {
  address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  amount: BigNumber.from('1000000000000000000'),
  chainId: constants.StarknetChainId.TESTNET,
  decimals: 18,
  name: 'Ether',
  symbol: 'ETH',
  usdPrice: 1000,
};

export const Default = () => <AmountInputView label="Amount" asset={asset} />;

export const Error = () => <AmountInputView error label="Amount" asset={asset} />;

export const Disabled = () => <AmountInputView disabled label="Amount" asset={asset} />;

export const WithHelperText = () => <AmountInputView error helperText="Helper text" label="Amount" asset={asset} />;
