import * as logger from '../src/utils/logger';

// TEMP solution: Switch off logger before each test
exports.mochaGlobalSetup = async function () {
  logger.logger.logLevel = logger.LogLevel.OFF;
};
