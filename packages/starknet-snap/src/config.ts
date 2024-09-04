import { LogLevel } from './utils/logger';
import { SnapEnv } from './utils/constants';

export type SnapConfig = {
  logLevel: string;
  snapEnv: SnapEnv;
};

export const Config: SnapConfig = {
  // eslint-disable-next-line no-restricted-globals
  logLevel: process.env.LOG_LEVEL ?? LogLevel.OFF.valueOf().toString(),
  // eslint-disable-next-line no-restricted-globals
  snapEnv: (process.env.SNAP_ENV ?? SnapEnv.Prod) as unknown as SnapEnv,
};
