import { KeyboardEvent } from 'react';
import { ethers } from 'ethers';
import {
  DECIMALS_DISPLAYED_MAX_LENGTH,
  STARKNET_MAINNET_EXPLORER,
  STARKNET_SEPOLIA_TESTNET_EXPLORER,
  SEPOLIA_CHAINID,
  TIMEOUT_DURATION,
  MIN_ACC_CONTRACT_VERSION,
} from './constants';
import { Erc20Token, Erc20TokenBalance, TokenBalance } from 'types';
import { constants } from 'starknet';

export const shortenAddress = (address: string, num = 3) => {
  if (!address) return '';
  return (
    !!address &&
    `${address.substring(0, num + 2)}...${address.substring(
      address.length - num - 1,
    )}`
  );
};

export const openExplorerTab = (
  address: string,
  type = 'contract',
  chainId = SEPOLIA_CHAINID,
) => {
  let explorerUrl = STARKNET_SEPOLIA_TESTNET_EXPLORER;
  switch (chainId) {
    case constants.StarknetChainId.SN_MAIN:
      explorerUrl = STARKNET_MAINNET_EXPLORER;
      break;
    case SEPOLIA_CHAINID:
      explorerUrl = STARKNET_SEPOLIA_TESTNET_EXPLORER;
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
  balanceSpendable?: string,
  usdPrice?: number,
): Erc20TokenBalance => {
  return {
    ...token,
    amount: ethers.BigNumber.from(balance ? balance : '0x0'),
    spendableAmount: ethers.BigNumber.from(
      balanceSpendable ? balanceSpendable : '0x0',
    ),
    usdPrice: usdPrice,
  };
};

export const getHumanReadableAmount = (
  asset: Erc20TokenBalance,
  assetAmount?: string,
): string => {
  const amountStr = assetAmount
    ? assetAmount
    : ethers.utils.formatUnits(asset.amount, asset.decimals);
  const indexDecimal = amountStr.indexOf('.');
  const integerPart = amountStr.substring(0, indexDecimal);
  let decimalPart = amountStr.substring(
    indexDecimal + 1,
    indexDecimal + 5 - integerPart.length,
  );
  if (integerPart === '0') {
    decimalPart = amountStr.substring(indexDecimal + 1);
  }
  const decimalPartArray = decimalPart.split('');
  const firstNonZeroIndex = decimalPartArray.findIndex((char) => char !== '0');
  if (firstNonZeroIndex === -1) {
    return integerPart;
  }

  return amountStr.substring(0, indexDecimal + firstNonZeroIndex + 3);
};

export const getSpendableTotalBalance = (asset: Erc20TokenBalance): string => {
  const amount = asset.spendableAmount ?? asset.amount;
  const spendableAmount = getHumanReadableAmount(asset, amount.toString());

  if (asset.spendableAmount === asset.amount) {
    return `${spendableAmount}`;
  }

  const totalAmount = getHumanReadableAmount(asset, asset.amount.toString());

  return `${spendableAmount} (${totalAmount})`;
};

export const getMaxDecimalsReadable = (
  asset: Erc20TokenBalance,
  assetAmount?: string,
) => {
  const amountStr = assetAmount
    ? assetAmount
    : ethers.utils.formatUnits(asset.amount, asset.decimals);
  const indexDecimal = amountStr.indexOf('.');
  const decimalPart = amountStr.substring(indexDecimal + 1).split('');
  const firstNonZeroIndexReverse = decimalPart
    .reverse()
    .findIndex((char) => char !== '0');
  if (firstNonZeroIndexReverse !== -1) {
    let lastNonZeroIndex = amountStr.length - firstNonZeroIndexReverse;
    if (lastNonZeroIndex - indexDecimal > DECIMALS_DISPLAYED_MAX_LENGTH) {
      lastNonZeroIndex = indexDecimal + 1 + DECIMALS_DISPLAYED_MAX_LENGTH;
    }
    return amountStr.substring(0, lastNonZeroIndex);
  }
  return amountStr.substring(0, indexDecimal);
};

export const getAmountPrice = (
  asset: Erc20TokenBalance,
  assetAmount: number,
  usdMode: boolean,
) => {
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

export const fetchWithTimeout = async (
  resource: string,
  options = { timeout: TIMEOUT_DURATION },
) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), options.timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
};

export const isGTEMinVersion = (version: string) => {
  const versionArr = version.split('.');
  return Number(versionArr[1]) >= MIN_ACC_CONTRACT_VERSION[1];
};

export const hexToString = (hex: string): string => {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const hexValue = hex.substr(i, 2);
    const decimalValue = parseInt(hexValue, 16);
    str += String.fromCharCode(decimalValue);
  }
  return str;
};

export const wait = (delay: number) => {
  return new Promise((res) => {
    setTimeout(res, delay);
  });
};

export const retry = async (
  fn: () => Promise<boolean>,
  options?: {
    delay?: number;
    maxAttempts?: number;
    onFailedAttempt?: CallableFunction;
  },
): Promise<boolean> => {
  let retry = options?.maxAttempts ?? 10;
  const delay = options?.delay ?? 1000;

  while (retry > 0) {
    try {
      // read contract to check if upgrade is required
      const result = await fn();
      if (result) {
        return result;
      }
    } catch (e) {
      if (
        options?.onFailedAttempt &&
        typeof options?.onFailedAttempt === 'function'
      ) {
        options.onFailedAttempt(e);
      } else {
        //eslint-disable-next-line no-console
        console.log(`error while processing retry: ${e}`);
      }
    } finally {
      await wait(delay);
      retry -= 1;
    }
  }
  return false;
};

export const shortenDomain = (domain: string, maxLength = 18) => {
  if (!domain) return '';
  const ellipsis = '...';

  if (domain.length <= maxLength) {
    return domain;
  }

  const shortenedPartLength = maxLength - ellipsis.length;
  return `${domain.substring(0, shortenedPartLength)}${ellipsis}`;
};

export function getTokenBalanceWithDetails(
  tokenBalance: TokenBalance,
  token: Erc20Token,
  tokenUSDPrice?: number,
): Erc20TokenBalance {
  const { balancePending, balanceLatest } = tokenBalance;
  const spendableBalance =
    balancePending < balanceLatest ? balancePending : balanceLatest;
  return addMissingPropertiesToToken(
    token,
    balanceLatest.toString(),
    spendableBalance.toString(),
    tokenUSDPrice,
  );
}
