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

export interface loggingFn {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  (message?: any, ...optionalParams: any[]): void;
}

export interface ILogger {
  log: loggingFn;
  warn: loggingFn;
  error: loggingFn;
  debug: loggingFn;
  info: loggingFn;
  trace: loggingFn;
  init: (level: string) => void;
  getLogLevel: () => LogLevel;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const emptyLog: loggingFn = (message?: any, ...optionalParams: any[]) => {return};

class Logger implements ILogger {
  readonly log: loggingFn;
  readonly warn: loggingFn;
  readonly error: loggingFn;
  readonly debug: loggingFn;
  readonly info: loggingFn;
  readonly trace: loggingFn;

  private _logLevel: LogLevel = LogLevel.OFF;

  constructor() {
    this.init(LogLevel.OFF.toString());
  }

  private setLogLevel = function (level: string): void {
    if (level && Object.values(LogLevel).includes(level.toUpperCase())) {
      this._logLevel = LogLevel[level.toUpperCase()];
    } else {
      this._logLevel = LogLevel.OFF;
    }
  };

  public init = function (level: string): void {
    this.setLogLevel(level);
    this.error = console.error.bind(console);
    this.warn = console.warn.bind(console);
    this.info = console.info.bind(console);
    this.debug = console.debug.bind(console);
    this.trace = console.trace.bind(console);
    this.log = console.log.bind(console);

    if (this._logLevel < LogLevel.ERROR) {
      this.error = emptyLog;
    }
    if (this._logLevel < LogLevel.WARN) {
      this.warn = emptyLog;
    }
    if (this._logLevel < LogLevel.INFO) {
      this.info = emptyLog;
    }
    if (this._logLevel < LogLevel.DEBUG) {
      this.debug = emptyLog;
    }
    if (this._logLevel < LogLevel.TRACE) {
      this.trace = emptyLog;
    }
    if (this._logLevel < LogLevel.ALL) {
      this.log = emptyLog;
    }
  };

  public getLogLevel = function (): LogLevel {
    return this._logLevel;
  };
}

export const logger = new Logger();
