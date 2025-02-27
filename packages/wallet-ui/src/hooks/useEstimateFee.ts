import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ethers } from 'ethers';
import { FeeToken, ContractFuncName, FeeEstimate } from 'types';
import { useStarkNetSnap } from 'services';
import { setFeeEstimate } from 'slices/walletSlice';
import { constants } from 'starknet';
import { useAppSelector } from './redux';
import { Erc20TokenBalance } from 'types';
import { useCurrentAccount } from 'hooks';

const cacheRefreshTime = 60000;
const globalFetchingStatus: Record<string, boolean> = {}; // Tracks ongoing fetches

export const useEstimateFee = (
  chainId: string,
  ethBalance?: Erc20TokenBalance,
) => {
  const dispatch = useDispatch();
  const { isDeployed, address } = useCurrentAccount();
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );
  const feeEstimates = useAppSelector((state) => state.wallet.feeEstimates);
  const { estimateFees: estimateFeesApi } = useStarkNetSnap();
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isFeeEstimateValid = (feeEstimate: FeeEstimate) => {
    return (
      feeEstimate &&
      feeEstimate.fee &&
      feeEstimate.timestamp &&
      Date.now() - feeEstimate.timestamp < cacheRefreshTime
    );
  };

  const estimateFees = async (feeToken: FeeToken) => {
    // Skip if not deployed and no eth balance
    if (!isDeployed && (ethBalance?.amount.eq(0) || !ethBalance)) {
      return;
    }

    const cacheKey = `${address}-${feeToken}-${chainId}`;

    // Skip if fetching is already in progress
    if (globalFetchingStatus[cacheKey]) {
      return;
    }

    const cachedFeeEstimate = feeEstimates[feeToken];
    const isCacheValid =
      cachedFeeEstimate &&
      Date.now() - cachedFeeEstimate.timestamp < cacheRefreshTime;

    if (isCacheValid) {
      if (cachedFeeEstimate.includeDeploy && isDeployed) {
        // Update fee cache because account is now deployed
      } else {
        return;
      }
    }

    globalFetchingStatus[cacheKey] = true;
    setLoading(true);

    try {
      const amountBN = ethers.utils.parseUnits(
        '0.000000001',
        erc20TokenBalanceSelected.decimals,
      );
      const callData = address + ',' + amountBN.toString() + ',0';

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

      dispatch(
        setFeeEstimate({
          feeToken,
          fee: response.suggestedMaxFee,
          includeDeploy: response.includeDeploy,
        }),
      );
    } finally {
      globalFetchingStatus[cacheKey] = false;
      setLoading(false);
    }
  };

  useEffect(
    () => {
      estimateFees(FeeToken.ETH);

      intervalRef.current = setInterval(() => {
        estimateFees(FeeToken.ETH);
      }, cacheRefreshTime);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [address, erc20TokenBalanceSelected, chainId],
  );

  return {
    estimateFees,
    loading,
    fetchingFee: loading,
    feeEstimates,
    isFeeEstimateValid,
  };
};
