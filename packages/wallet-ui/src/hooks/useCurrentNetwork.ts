import { Network } from 'types';
import { useAppSelector } from './redux';

/**
 * A hook to get the current network
 *
 * @returns the current network
 */
export const useCurrentNetwork = (): Network => {
  const networks = useAppSelector((state) => state.networks);
  const currentNetwork = networks?.items?.[networks?.activeNetwork];
  return currentNetwork;
};
