export enum LogLevel {
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
  ALL = 6,
  OFF = 0,
}

/* eslint-disable @typescript-eslint/no-empty-function */
export class Logger {
  log() {}

  warn() {}

  error() {}

  debug() {}

  info() {}

  trace() {}

  init() {}

  getLogLevel() {}

  logLevel() {}
}
/* eslint-enable */

export const logger = new Logger();
