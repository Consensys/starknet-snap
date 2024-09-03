import { LogLevel } from './utils';

export type SnapConfig = {
  logLevel: string;
};

export const Config: SnapConfig = {
  // eslint-disable-next-line no-restricted-globals
  logLevel: process.env.LOG_LEVEL ?? LogLevel.OFF.valueOf().toString(),
};
