import { FC, useEffect, useRef } from 'react';
import { Erc20TokenBalance } from 'types';
import { IListProps } from '../List/List.view';
import { AssetListItem } from './AssetListItem';
import { Wrapper } from './AssetsList.style';
import { useAppSelector } from 'hooks/redux';
import { useStarkNetSnap } from 'services';
import { ASSETS_PRICE_REFRESH_FREQUENCY } from 'utils/constants';

export const AssetsListView = () => {
  const { setErc20TokenBalance, refreshTokensUSDPrice } = useStarkNetSnap();
  const wallet = useAppSelector((state) => state.wallet);
  const timeoutHandle = useRef(setTimeout(() => {}));

  useEffect(() => {
    if (wallet.erc20TokenBalances?.length > 0) {
      clearTimeout(timeoutHandle.current); // cancel the timeout that was in-flight
      timeoutHandle.current = setTimeout(() => refreshTokensUSDPrice(), ASSETS_PRICE_REFRESH_FREQUENCY);
      return () => clearTimeout(timeoutHandle.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.erc20TokenBalances]);

  const handleClick = (asset: Erc20TokenBalance) => {
    setErc20TokenBalance(asset);
  };

  return (
    <Wrapper<FC<IListProps<Erc20TokenBalance>>>
      data={wallet.erc20TokenBalances}
      render={(asset) => (
        <AssetListItem
          asset={asset}
          onClick={() => handleClick(asset)}
          selected={wallet.erc20TokenBalanceSelected.address === asset.address}
        />
      )}
      keyExtractor={(asset) => asset.address}
    />
  );
};
