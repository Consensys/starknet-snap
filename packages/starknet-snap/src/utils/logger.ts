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
}

// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const emptyLog: loggingFn = (message?: any, ...optionalParams: any[]) => {
  return;
};

export class Logger implements ILogger {
  log: loggingFn;
  warn: loggingFn;
  error: loggingFn;
  debug: loggingFn;
  info: loggingFn;
  trace: loggingFn;

  private _logLevel: LogLevel;

  constructor() {
    this._logLevel = LogLevel.ALL;
    this.init();
  }

  set logLevel(level: string) {
    const lv = level.toUpperCase();
    this._logLevel = LogLevel.OFF;

    Object.entries(LogLevel).forEach(([key]) => {
      if (key === lv) {
        this._logLevel = LogLevel[key];
        return;
      }
    });

    this.init();
  }

  get logLevel(): string {
    return this._logLevel.toString();
  }

  init(): void {
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
  }
}

export const logger = new Logger();
