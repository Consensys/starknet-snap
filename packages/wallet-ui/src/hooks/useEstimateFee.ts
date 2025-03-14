import { useEffect, useState } from 'react';
import { constants } from 'starknet';

import { FeeToken, ContractFuncName, FeeEstimate } from 'types';
import { useStarkNetSnap } from 'services';
import {
  useCurrentAccount,
  useCurrentNetwork,
  useAppSelector,
  useCacheData,
  useAsyncRecursivePull,
} from 'hooks';
import {
  ESTIMATE_FEE_REFRESH_FREQUENCY,
  ESTIMATE_FEE_CACHE_DURATION,
} from 'utils/constants';
import { getMinAmountToSpend } from 'utils/utils';

/**
 * A hook to pull estimate fee data continuously
 *
 * @param feeToken - The fee token to estimate the fee in.
 * @returns { estimateFees, loading, feeEstimates }
 */
export const useEstimateFee = (feeToken: FeeToken = FeeToken.ETH) => {
  const chainId = useCurrentNetwork()?.chainId;
  const { isDeployed, address } = useCurrentAccount();
  const { estimateFees: estimateFeesApi } = useStarkNetSnap();
  const cacheKey = `${address}-${feeToken}-${chainId}`;
  const { expired, cacheData, saveCache, deleteCache } =
    useCacheData<FeeEstimate>({
      cacheKey,
      cacheDurtion: ESTIMATE_FEE_CACHE_DURATION,
    });
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );
  const [loading, setLoading] = useState(false);

  const estimateFees = async (feeToken: FeeToken) => {
    // if the balance is 0, we don't need to estimate the fee
    if (erc20TokenBalanceSelected.amount.lte(0)) {
      return;
    }

    // We only process fee estimation when:
    // - No cached data or
    // - Cache expired or
    // - Cache does not expired but the estimation result is include deployment fee and the account is deployed, as it means the estimation result is not valid anymore
    if (!cacheData || expired || (cacheData.includeDeploy && isDeployed)) {
      setLoading(true);
      console.log('fetching new fee', feeToken);
      try {
        const callData =
          address + ',' + getMinAmountToSpend().toString() + ',0';

        const response = await estimateFeesApi(
          erc20TokenBalanceSelected.address,
          ContractFuncName.Transfer,
          callData,
          address,
          chainId,
          feeToken === FeeToken.STRK
            ? constants.TRANSACTION_VERSION.V3
            : undefined,
        );

        saveCache({
          fee: response.suggestedMaxFee,
          includeDeploy: response.includeDeploy,
        });
      } finally {
        setLoading(false);
      }
    } else {
      console.log('cached hitted', Date.now());
    }
  };

  // Kick off the fee estimation refresh when doEstimation changes
  const { start, stop } = useAsyncRecursivePull(async () => {
    estimateFees(feeToken);
  }, ESTIMATE_FEE_REFRESH_FREQUENCY);

  // Kick off the first fee estimation when
  // - chainId, address, feeToken or erc20TokenBalanceSelected changes
  useEffect(() => {
    stop();
    estimateFees(feeToken)
      .catch((error) => {
        // Log the error but do not throw it to avoid breaking the app
        console.error('Failed to estimate fees', error);
      })
      .finally(() => {
        // Trigger the refresh regardless if failed or success
        start();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, address, feeToken, erc20TokenBalanceSelected]);

  return {
    flushFeeCache: deleteCache,
    estimateFees,
    loading,
    feeEstimates: cacheData,
  };
};
