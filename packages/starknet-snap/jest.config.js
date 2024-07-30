module.exports = {
  preset: '@metamask/snaps-jest',
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  restoreMocks: true,
  resetMocks: true,
  verbose: true,
  testPathIgnorePatterns: ['/node_modules/', '/__mocks__/'],
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).[tj]s?(x)'],
  // Switch off the collectCoverage until jest replace mocha
  collectCoverage: false,
  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    './src/**/*.ts',
    '!./src/**/*.d.ts',
    '!./src/**/index.ts',
    '!./src/**/__BAK__/**',
    '!./src/**/__mocks__/**',
    '!./src/config/*.ts',
    '!./src/**/type?(s).ts',
    '!./src/**/exception?(s).ts',
    '!./src/**/constant?(s).ts',
    '!./test/**',
    './src/index.ts',
  ],
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'babel',
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['html', 'json-summary', 'text'],
};
