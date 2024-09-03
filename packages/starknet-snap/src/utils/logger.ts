// ERROR, WARN, INFO, DEBUG, TRACE, ALL, and OF
export enum LogLevel {
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
  ALL = 6,
  OFF = 0,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export type LoggingFn = (message?: any, ...optionalParams: any[]) => void;

export type ILogger = {
  log: LoggingFn;
  warn: LoggingFn;
  error: LoggingFn;
  debug: LoggingFn;
  info: LoggingFn;
  trace: LoggingFn;
  init: () => void;
  logLevel: LogLevel;
};

export const emptyLog: LoggingFn = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  message?: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  ...optionalParams: any[]
) =>
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  {};

export class Logger implements ILogger {
  log: LoggingFn;

  warn: LoggingFn;

  error: LoggingFn;

  debug: LoggingFn;

  info: LoggingFn;

  trace: LoggingFn;

  #logLevel: LogLevel = LogLevel.OFF;

  set logLevel(level: LogLevel) {
    this.#logLevel = level;
    this.init();
  }

  get logLevel(): LogLevel {
    return this.#logLevel;
  }

  init(): void {
    this.error = console.error.bind(console);
    this.warn = console.warn.bind(console);
    this.info = console.info.bind(console);
    this.debug = console.debug.bind(console);
    this.trace = console.trace.bind(console);
    this.log = console.log.bind(console);

    if (this.#logLevel < LogLevel.ERROR) {
      this.error = emptyLog;
    }
    if (this.#logLevel < LogLevel.WARN) {
      this.warn = emptyLog;
    }
    if (this.#logLevel < LogLevel.INFO) {
      this.info = emptyLog;
    }
    if (this.#logLevel < LogLevel.DEBUG) {
      this.debug = emptyLog;
    }
    if (this.#logLevel < LogLevel.TRACE) {
      this.trace = emptyLog;
    }
    if (this.#logLevel < LogLevel.ALL) {
      this.log = emptyLog;
    }
  }
}

export const logger = new Logger();
