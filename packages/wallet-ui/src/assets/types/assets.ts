import ethIcon from '../images/eth-icon.svg';
import starknetIcon from '../images/starknet-icon.svg';
import daiIcon from '../images/dai-icon.svg';
import aaveIcon from '../images/aave-icon.svg';

export const assetIcons = [ethIcon, daiIcon, aaveIcon];
export enum AssetIconsIndex {
  Ether = 0,
  DAI = 1,
  AAVE = 2,
}

export const getAssetIcon = (assetName: string): string => {
  let iconIndex = -1;
  if (Object.keys(AssetIconsIndex).indexOf(assetName) !== -1) {
    iconIndex = AssetIconsIndex[assetName as keyof typeof AssetIconsIndex];
  }

  return assetName ? assetIcons[iconIndex] : starknetIcon;
};
