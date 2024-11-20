import ethIcon from '../images/eth-icon.svg';
import starknetIcon from '../images/starknet-icon.svg';
import daiIcon from '../images/dai-icon.svg';
import aaveIcon from '../images/aave-icon.svg';
import usdcIcon from '../images/usdc-icon.svg';
import usdtIcon from '../images/usdt-icon.svg';

export const assetIcons: Record<string, string> = {
  Ether: ethIcon,
  DAI: daiIcon,
  AAVE: aaveIcon,
  'USD Coin': usdcIcon,
  'Tether USD': usdtIcon,
  'Starknet Token': starknetIcon, // Default to starknetIcon for STRK
};

export const getAssetIcon = (assetName: string): string => {
  return assetIcons[assetName] || starknetIcon; // Use starknetIcon as fallback
};
