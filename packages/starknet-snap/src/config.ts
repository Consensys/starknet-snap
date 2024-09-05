import type { Json } from '@metamask/snaps-sdk';

import { SnapEnv } from './utils/constants';
import { LogLevel } from './utils/logger';

export enum DataClientDriver {
  StarkScan = 'starkscan',
}

export type SnapConfig = {
  logLevel: string;
  snapEnv: SnapEnv;
  transaction: {
    dataClient: {
      driver: DataClientDriver;
      options: Json;
    };
  };
};

export const Config: SnapConfig = {
  // eslint-disable-next-line no-restricted-globals
  logLevel: process.env.LOG_LEVEL ?? LogLevel.OFF.valueOf().toString(),
  // eslint-disable-next-line no-restricted-globals
  snapEnv: (process.env.SNAP_ENV ?? SnapEnv.Prod) as unknown as SnapEnv,

  transaction: {
    dataClient: {
      driver: DataClientDriver.StarkScan,
      options: {
        // eslint-disable-next-line no-restricted-globals
        apiKey: process.env.STARKSCAN_API_KEY ?? '',
      },
    },
  },
};
