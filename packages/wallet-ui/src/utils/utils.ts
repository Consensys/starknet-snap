import { KeyboardEvent } from 'react';
import { ethers } from 'ethers';
import {
  DECIMALS_DISPLAYED_MAX_LENGTH,
  STARKNET_MAINNET_EXPLORER,
  STARKNET_TESTNET2_EXPLORER,
  STARKNET_TESTNET_EXPLORER,
  TIMEOUT_DURATION,
} from './constants';
import { Erc20Token, Erc20TokenBalance } from 'types';
import { constants } from 'starknet';

export const shortenAddress = (address: string, num = 3) => {
  if (!address) return '';
  return !!address && `${address.substring(0, num + 2)}...${address.substring(address.length - num - 1)}`;
};

export const openExplorerTab = (
  address: string,
  type = 'contract',
  chainId = constants.StarknetChainId.TESTNET as string,
) => {
  let explorerUrl = STARKNET_TESTNET_EXPLORER;
  switch (chainId) {
    case constants.StarknetChainId.MAINNET:
      explorerUrl = STARKNET_MAINNET_EXPLORER;
      break;
    case constants.StarknetChainId.TESTNET:
      explorerUrl = STARKNET_TESTNET_EXPLORER;
      break;
    case constants.StarknetChainId.TESTNET2:
      explorerUrl = STARKNET_TESTNET2_EXPLORER;
      break;
  }
  window.open(explorerUrl + type + '/' + address, '_blank')?.focus();
};

export const isValidAddress = (toCheck: string) => {
  return /^0x[a-fA-F0-9]{63,64}$/.test(toCheck);
};

export const addMissingPropertiesToToken = (
  token: Erc20Token,
  balance?: string,
  usdPrice?: number,
): Erc20TokenBalance => {
  return {
    ...token,
    amount: ethers.BigNumber.from(balance ? balance : '0x0'),
    usdPrice: usdPrice,
  };
};

export const getHumanReadableAmount = (asset: Erc20TokenBalance) => {
  const amountStr = ethers.utils.formatUnits(asset.amount, asset.decimals);
  const indexDecimal = amountStr.indexOf('.');
  return ethers.utils
    .formatUnits(asset.amount, asset.decimals)
    .substring(0, indexDecimal + DECIMALS_DISPLAYED_MAX_LENGTH);
};

export const getAmountPrice = (asset: Erc20TokenBalance, assetAmount: number, usdMode: boolean) => {
  if (asset.usdPrice) {
    if (!usdMode) {
      const result = asset.usdPrice * assetAmount;
      return result.toFixed(2).toString();
    } else {
      const result = assetAmount / asset.usdPrice;
      return result.toFixed(getMaxDecimals(asset)).toString();
    }
  }
  return '';
};

export const getMaxDecimals = (asset: Erc20TokenBalance) => {
  const MAX_DECIMALS = 6;
  if (asset.decimals > MAX_DECIMALS) {
    return MAX_DECIMALS;
  }
  return asset.decimals;
};

export const isSpecialInputKey = (event: KeyboardEvent<HTMLInputElement>) => {
  return (
    event.key === 'Backspace' ||
    event.ctrlKey ||
    event.key === 'ArrowRight' ||
    event.key === 'ArrowLeft' ||
    event.metaKey
  );
};

export const fetchWithTimeout = async (resource: string, options = { timeout: TIMEOUT_DURATION }) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), options.timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
};
