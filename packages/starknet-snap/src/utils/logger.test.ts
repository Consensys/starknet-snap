import { logger, LogLevel } from './logger';

describe('Logger', () => {
  afterAll(() => {
    logger.logLevel = LogLevel.OFF;
  });
  const createLogSpy = () => {
    return {
      log: jest.spyOn(console, 'log').mockReturnThis(),
      error: jest.spyOn(console, 'error').mockReturnThis(),
      warn: jest.spyOn(console, 'warn').mockReturnThis(),
      info: jest.spyOn(console, 'info').mockReturnThis(),
      trace: jest.spyOn(console, 'trace').mockReturnThis(),
      debug: jest.spyOn(console, 'debug').mockReturnThis(),
    };
  };

  const testLog = (message: string) => {
    logger.log(message);
    logger.error(message);
    logger.warn(message);
    logger.info(message);
    logger.trace(message);
    logger.debug(message);
  };

  it.each([
    {
      logLevel: LogLevel.ALL,
      expected: {
        info: true,
        warn: true,
        error: true,
        debug: true,
        log: true,
        trace: true,
      },
    },
    {
      logLevel: LogLevel.OFF,
      expected: {
        info: false,
        warn: false,
        error: false,
        debug: false,
        log: false,
        trace: false,
      },
    },
    {
      logLevel: LogLevel.INFO,
      expected: {
        info: true,
        warn: true,
        error: true,
        debug: false,
        log: false,
        trace: false,
      },
    },
    {
      logLevel: LogLevel.ERROR,
      expected: {
        info: false,
        warn: false,
        error: true,
        debug: false,
        log: false,
        trace: false,
      },
    },
    {
      logLevel: LogLevel.WARN,
      expected: {
        info: false,
        warn: true,
        error: true,
        debug: false,
        log: false,
        trace: false,
      },
    },
    {
      logLevel: LogLevel.DEBUG,
      expected: {
        info: true,
        warn: true,
        error: true,
        debug: true,
        log: false,
        trace: false,
      },
    },
    {
      logLevel: LogLevel.TRACE,
      expected: {
        info: true,
        warn: true,
        error: true,
        debug: true,
        log: false,
        trace: true,
      },
    },
  ])(
    'logs correctly when `logLevel` is `$logLevel`',
    ({
      logLevel,
      expected,
    }: {
      logLevel: LogLevel;
      expected: {
        info: boolean;
        warn: boolean;
        error: boolean;
        debug: boolean;
        log: boolean;
        trace: boolean;
      };
    }) => {
      const spys = createLogSpy();
      logger.logLevel = logLevel;
      const logMsg = 'log';

      testLog(logMsg);

      Object.entries(expected)
        .filter(([_, value]) => !value)
        .forEach(([key]) => {
          expect(spys[key]).not.toHaveBeenCalled();
        });

      Object.entries(expected)
        .filter(([_, value]) => value)
        .forEach(([key]) => {
          expect(spys[key]).toHaveBeenCalledWith(logMsg);
        });
    },
  );

  it('return correct `LogLevel`', () => {
    logger.logLevel = LogLevel.INFO;

    expect(logger.logLevel).toStrictEqual(LogLevel.INFO);
  });
});
