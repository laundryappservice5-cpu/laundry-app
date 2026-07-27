/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/globalTeardown.ts',
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
};
