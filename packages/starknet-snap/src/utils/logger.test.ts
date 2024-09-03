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

  it('logs when `logLevel` is `LogLevel.ALL`', () => {
    const spys = createLogSpy();

    logger.logLevel = LogLevel.ALL;

    testLog('log');

    expect(spys.info).toHaveBeenCalledWith('log');
    expect(spys.warn).toHaveBeenCalledWith('log');
    expect(spys.error).toHaveBeenCalledWith('log');
    expect(spys.debug).toHaveBeenCalledWith('log');
    expect(spys.log).toHaveBeenCalledWith('log');
    expect(spys.trace).toHaveBeenCalledWith('log');
  });

  it('does not log when `logLevel` is `LogLevel.OFF`', () => {
    const spys = createLogSpy();

    logger.logLevel = LogLevel.OFF;

    testLog('log');

    expect(spys.info).toHaveBeenCalledTimes(0);
    expect(spys.warn).toHaveBeenCalledTimes(0);
    expect(spys.error).toHaveBeenCalledTimes(0);
    expect(spys.debug).toHaveBeenCalledTimes(0);
    expect(spys.log).toHaveBeenCalledTimes(0);
    expect(spys.trace).toHaveBeenCalledTimes(0);
  });

  it('logs correctly when `logLevel` is `LogLevel.INFO`', () => {
    const spys = createLogSpy();

    logger.logLevel = LogLevel.INFO;

    testLog('log');

    expect(spys.info).toHaveBeenCalledWith('log');
    expect(spys.warn).toHaveBeenCalledWith('log');
    expect(spys.error).toHaveBeenCalledWith('log');

    expect(spys.debug).toHaveBeenCalledTimes(0);
    expect(spys.log).toHaveBeenCalledTimes(0);
    expect(spys.trace).toHaveBeenCalledTimes(0);
  });

  it('return correct `LogLevel`', () => {
    logger.logLevel = LogLevel.INFO;

    expect(logger.logLevel).toStrictEqual(LogLevel.INFO);
  });
});
