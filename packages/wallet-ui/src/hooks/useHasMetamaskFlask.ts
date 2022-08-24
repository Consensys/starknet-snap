import detectEthereumProvider from '@metamask/detect-provider';
import { useEffect, useState } from 'react';

export const useHasMetamaskFlask = () => {
  const [hasMetamaskFlask, setHasMetamaskFlask] = useState<boolean | null>(null);

  const detectMetamaskFlask = async () => {
    try {
      const provider = (await detectEthereumProvider({
        mustBeMetaMask: false,
        silent: true,
      })) as any | undefined;
      const isFlask = (await provider?.request({ method: 'web3_clientVersion' }))?.includes('flask');
      if (provider && isFlask) {
        return true;
      }
      return false;
    } catch (e) {
      console.log('Error', e);
      return false;
    }
  };

  useEffect(() => {
    detectMetamaskFlask()
      .then((result) => {
        setHasMetamaskFlask(result);
      })
      .catch((err) => {
        console.error(err);
        setHasMetamaskFlask(false);
      });
  }, []);

  return {
    hasMetamaskFlask,
  };
};
