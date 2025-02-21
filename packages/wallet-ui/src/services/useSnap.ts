import { useAppSelector } from 'hooks/redux';
import semver from 'semver/preload';

import { removeUndefined } from 'utils/utils';

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
  // unless specified, the minSnapVersion is the same as the snapVersion
  const minSnapVersion = process.env.REACT_APP_MIN_SNAP_VERSION
    ? process.env.REACT_APP_MIN_SNAP_VERSION
    : snapVersion;

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
            params: params ? removeUndefined(params) : params,
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
    await invokeSnap<null>({
      method: 'ping',
    });
  };

  const isSnapRequireUpdate = async (): Promise<boolean> => {
    const snaps = await getInstalledSnaps();

    if (typeof snaps[snapId]?.version !== 'undefined') {
      // if the minSnapVersion is *, we should always allowed
      if (minSnapVersion === '*') {
        return true;
      }
      return semver.lt(snaps[snapId]?.version?.split('-')?.[0], minSnapVersion);
    }
    return false;
  };

  return {
    ping,
    requestSnap,
    isSnapRequireUpdate,
    getInstalledSnaps,
    invokeSnap,
    snapId,
    snapVersion,
    minSnapVersion,
  };
};
