export enum LogLevel {
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
  ALL = 6,
  OFF = 0,
}

export class Logger {
  log = jest.fn();

  warn = jest.fn();

  error = jest.fn();

  debug = jest.fn();

  info = jest.fn();

  trace = jest.fn();

  init = jest.fn();

  getLogLevel = jest.fn();

  logLevel = 0;
}

export const logger = new Logger();
