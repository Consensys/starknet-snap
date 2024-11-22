import ethIcon from '../images/eth-icon.svg';
import starknetIcon from '../images/starknet-icon.svg';
import daiIcon from '../images/dai-icon.svg';
import aaveIcon from '../images/aave-icon.svg';
import usdcIcon from '../images/usdc-icon.svg';
import usdtIcon from '../images/usdt-icon.svg';

export const assetIcons: Record<string, string> = {
  ETH: ethIcon,
  DAI: daiIcon,
  AAVE: aaveIcon,
  USDC: usdcIcon,
  USDT: usdtIcon,
  STRK: starknetIcon, // Default to starknetIcon for STRK
};

export const getAssetIcon = (assetSymbol: string): string => {
  return assetIcons[assetSymbol] || starknetIcon; // Use starknetIcon as fallback
};
