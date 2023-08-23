import detectEthereumProvider from '@metamask/detect-provider';
import { useEffect, useState } from 'react';

export const useHasMetamask = () => {
  const [hasMetamask, setHasMetamask] = useState<boolean | null>(null);

  const detectMetamask = async () => {
    try {
      const provider = (await detectEthereumProvider()) as any | undefined;
      if (provider) {
        return true;
      }
      return false;
    } catch (e) {
      console.log('Error', e);
      return false;
    }
  };

  useEffect(() => {
    detectMetamask()
      .then((result) => {
        setHasMetamask(result);
      })
      .catch((err) => {
        console.error(err);
        setHasMetamask(false);
      });
  }, []);

  return {
    hasMetamask,
  };
};
