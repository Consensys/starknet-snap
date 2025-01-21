import { useAppSelector } from 'hooks/redux';

export type InvokeSnapParams = {
  method: string;
  params?: Record<string, unknown>;
};

export type SnapsMetaData = {
  [key in string]: {
    id: string;
    version: string;
    enabled: boolean;
    blocked: boolean;
    initialPermissions: string;
  };
};

export const useSnap = () => {
  const { provider } = useAppSelector((state) => state.wallet);
  const snapId = process.env.REACT_APP_SNAP_ID
    ? process.env.REACT_APP_SNAP_ID
    : 'local:http://localhost:8081';
  const snapVersion = process.env.REACT_APP_SNAP_VERSION
    ? process.env.REACT_APP_SNAP_VERSION
    : '*';
  const minSnapVersion = process.env.REACT_APP_MIN_SNAP_VERSION
    ? process.env.REACT_APP_MIN_SNAP_VERSION
    : '2.0.1';

  const invokeSnap = async <Resp>({
    method,
    params,
  }: InvokeSnapParams): Promise<Resp> => {
    try {
      const response = await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method,
            params,
          },
        },
      });
      return response as unknown as Resp;
    } catch (error) {
      // for now we dont have a proper logging system, so we just log to console
      // eslint-disable-next-line no-console
      console.error(method, error);
      throw error;
    }
  };

  const getInstalledSnaps = async (): Promise<SnapsMetaData> => {
    return await provider.request({ method: 'wallet_getSnaps' });
  };

  const requestSnap = async (): Promise<SnapsMetaData> => {
    return await provider.request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: { version: snapVersion },
      },
    });
  };

  const ping = async (): Promise<void> => {
    // Extract the `accountDiscovery` parameter from the GET field (e.g., URL search params)
    const urlParams = new URLSearchParams(window.location.search);
    const accountDiscovery = urlParams.get('accountDiscovery');

    if (accountDiscovery !== null) {
      await invokeSnap<null>({
        method: 'ping',
        params: {
          accountDiscoveryType: accountDiscovery,
        },
      });
    } else {
      await invokeSnap<null>({
        method: 'ping',
      });
    }
  };

  return {
    ping,
    requestSnap,
    getInstalledSnaps,
    invokeSnap,
    snapId,
    snapVersion,
    minSnapVersion,
  };
};
