import { Erc20Token } from 'types';
import { COINGECKO_API, TOKENS } from 'utils/constants';
import { fetchWithTimeout } from 'utils/utils';

export const getAssetPriceUSD = async (asset: Erc20Token) => {
  if (TOKENS[asset.chainId][asset.address]?.coingeckoId) {
    const coingeckoId = TOKENS[asset.chainId][asset.address].coingeckoId;
    const url = COINGECKO_API + '/simple/price?ids=' + coingeckoId + '&vs_currencies=usd';
    try {
      const result = await fetchWithTimeout(url);
      const resultJson = await result.json();
      if (resultJson[coingeckoId]?.usd) {
        return resultJson[coingeckoId].usd;
      }
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }
  return undefined;
};
