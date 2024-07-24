import { useEffect, useState } from 'react';
import { useAppDispatch } from 'hooks/redux';
import { setProvider } from 'slices/walletSlice';
import { enableLoadingWithMessage, disableLoading } from 'slices/UISlice';

interface MetaMaskProvider {
  isMetaMask: boolean;
  request(options: { method: string }): Promise<void>;
}

declare global {
  interface Window {
    ethereum?: MetaMaskProvider;
  }
}

function isMetaMaskProvider(obj: unknown): obj is MetaMaskProvider {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    obj.hasOwnProperty('isMetaMask') &&
    obj.hasOwnProperty('request')
  );
}

function detectMetaMaskProvider(
  windowObject: Window & typeof globalThis,
  { timeout = 3000 } = {},
): Promise<MetaMaskProvider | null> {
  let handled = false;
  return new Promise<MetaMaskProvider | null>((resolve) => {
    const handleEIP6963Provider = (event: CustomEvent) => {
      const { info, provider } = event.detail;
      if (
        ['io.metamask', 'io.metamask.flask'].includes(info.rdns) &&
        isMetaMaskProvider(provider)
      ) {
        resolve(provider);
        handled = true;
      }
    };

    if (typeof windowObject.addEventListener === 'function') {
      windowObject.addEventListener(
        'eip6963:announceProvider',
        (event: Event) => {
          handleEIP6963Provider(event as CustomEvent);
        },
      );
    }

    setTimeout(() => {
      if (!handled) {
        resolve(null);
      }
    }, timeout);

    // Notify event listeners and other parts of the dapp that a provider is requested.
    if (typeof windowObject.dispatchEvent === 'function') {
      windowObject.dispatchEvent(new Event('eip6963:requestProvider'));
    }
  });
}

async function waitForMetaMaskProvider(
  windowObject: Window & typeof globalThis,
  { timeout = 1000, retries = 0 } = {},
): Promise<MetaMaskProvider | null> {
  return detectMetaMaskProvider(windowObject, { timeout })
    .catch(function () {
      return null;
    })
    .then(function (provider) {
      if (provider || retries === 0) {
        return provider;
      }
      return waitForMetaMaskProvider(windowObject, {
        timeout,
        retries: retries - 1,
      });
    });
}

async function detectMetamaskSupport(windowObject: Window & typeof globalThis) {
  const provider = await waitForMetaMaskProvider(windowObject, { retries: 3 });
  return provider;
}

export const useHasMetamask = () => {
  const dispatch = useAppDispatch();
  const [hasMetamask, setHasMetamask] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        dispatch(enableLoadingWithMessage('Detecting Metamask...'));
        const provider = await detectMetamaskSupport(window);
        // Use the new detection method

        if (provider && (await isSupportSnap(provider))) {
          dispatch(setProvider(provider));
          setHasMetamask(provider != null);
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
  }, [dispatch]);

  return {
    hasMetamask,
  };
};

const isSupportSnap = async (provider: any) => {
  try {
    await provider.request({
      method: 'wallet_getSnaps',
    });
    return true;
  } catch {
    return false;
  }
};
