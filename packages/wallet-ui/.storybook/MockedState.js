import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { constants } from 'starknet';
import { BigNumber } from 'ethers';
import { setErc20TokenBalances, setErc20TokenBalanceSelected } from 'slices/walletSlice';
import { setNetworks } from 'slices/networkSlice';

export const MockedState = ({}) => {
  //Create a mocked state for storybook to work
  const dispatch = useDispatch();
  useEffect(() => {
    const networks = [
      {
        accountClassHash: '0x3e327de1c40540b98d05cbcb13552008e36f0ec8d61d46956d2f9752c294328',
        chainId: '0x534e5f4d41494e',
        name: 'StarkNet Mainnet',
        baseUrl: 'https://alpha-mainnet.starknet.io',
        nodeUrl: '',
        voyagerUrl: 'https://voyager.online',
      },
    ];
    dispatch(setNetworks(networks));
    const mockedTokens = [
      {
        address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        amount: BigNumber.from('1000000000000000000'),
        chainId: constants.StarknetChainId.TESTNET,
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
        usdPrice: 1000,
      },
      {
        address: '0x03e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
        amount: BigNumber.from('1000000000000000000'),
        chainId: constants.StarknetChainId.TESTNET,
        decimals: 18,
        name: 'DAI',
        symbol: 'DAI',
        usdPrice: 1000,
      },
    ];
    dispatch(setErc20TokenBalances(mockedTokens));
    dispatch(setErc20TokenBalanceSelected(mockedTokens[0]));
  }, []);
  return <></>;
};
