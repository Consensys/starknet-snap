import { Network } from 'types';
import { useAppSelector } from './redux';

export const useCurrentNetwork = (): Network => {
  const networks = useAppSelector((state) => state.networks);
  const currentNetwork = networks.items[networks.activeNetwork];
  return currentNetwork;
};
