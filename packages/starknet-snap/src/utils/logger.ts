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
  init: (level: string) => void;
  getLogLevel: () => LogLevel;
};

export const emptyLog: LoggingFn = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  message?: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  ...optionalParams: any[]
) =>
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  {};

class Logger implements ILogger {
  readonly log: LoggingFn;

  readonly warn: LoggingFn;

  readonly error: LoggingFn;

  readonly debug: LoggingFn;

  readonly info: LoggingFn;

  readonly trace: LoggingFn;

  readonly #logLevel: LogLevel = LogLevel.OFF;

  constructor() {
    this.init(LogLevel.OFF.toString());
  }

  #setLogLevel = function (level: string): void {
    if (level && Object.values(LogLevel).includes(level.toUpperCase())) {
      this.#logLevel = LogLevel[level.toUpperCase()];
    } else {
      this.#logLevel = LogLevel.OFF;
    }
  };

  public init = function (level: string): void {
    this.#setLogLevel(level);
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
  };

  public getLogLevel = function (): LogLevel {
    return this.#logLevel;
  };
}

export const logger = new Logger();
