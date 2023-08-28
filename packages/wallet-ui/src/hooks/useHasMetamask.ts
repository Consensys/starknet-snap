import detectEthereumProvider from '@metamask/detect-provider';
import { useEffect, useState } from 'react';
import { useAppDispatch } from 'hooks/redux';
import { setProvider } from 'slices/walletSlice';
import { enableLoadingWithMessage, disableLoading } from 'slices/UISlice';

export const useHasMetamask = () => {
  const dispatch = useAppDispatch();
  const [hasMetamask, setHasMetamask] = useState<boolean | null>(null);
  useEffect(() => {
    const init = async () => {
      try {
        dispatch(enableLoadingWithMessage('Detecting Metamask...'));
        //make sure mm has installed
        if (await detectMetamask()) {
          //metamask SDK is not support when multiple wallet installed, and each wallet may injected window.ethereum, some may override isMetamask
          const _provider = await getProvider();
          dispatch(setProvider(_provider));
          setHasMetamask(_provider != null);
        } else {
          dispatch(setProvider(null));
          setHasMetamask(false);
        }

      } catch (err) {
        dispatch(setProvider(null));
        setHasMetamask(false);
      } finally {
        dispatch(disableLoading());
      }
    };
    init();
  }, []);

  return {
    hasMetamask
  };
};

export const detectMetamask = async () => {
  try {
    const hasMetamask = await detectEthereumProvider({ mustBeMetaMask: true });
    if (hasMetamask) {
      return true;
    }
    return false;
  } catch (e) {
    console.log('Error', e);
    return false;
  }
};

export const getProvider = async () => {
  let { ethereum } = window as any;
  let providers = [ethereum]

  //ethereum.detected or ethereum.providers may exist when more than 1 wallet installed
  if ('detected' in ethereum) {
    providers = ethereum['detected']
  }
  else if ('providers' in ethereum) {
    providers = ethereum['providers']
  }
  
  //delect provider by sending request
  for (const provider of providers) {
    if (provider && await isSupportSnap(provider))
    {
      window.ethereum = provider;
      return window.ethereum
    }
  }
  return null
};

const isSupportSnap = async (provider: any) => {
  try {
    await provider.request({
      method: 'wallet_getSnaps',
    });
    return true
  } catch {
    return false;
  }
};