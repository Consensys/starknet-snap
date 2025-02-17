import { useMemo } from 'react';
import { useAppSelector } from './redux';
import { shortenAddress, shortenDomain } from 'utils/utils';

export const useFormattedDisplayName = (starkName?: string) => {
  const currentAccount = useAppSelector((state) => state.wallet.currentAccount);
  const { address: currentAddress } = currentAccount;

  const displayName = useMemo(() => {
    return starkName
      ? shortenDomain(starkName)
      : shortenAddress(currentAddress);
  }, [starkName, currentAddress]);

  return displayName;
};
