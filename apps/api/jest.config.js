/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  globalSetup: '<rootDir>/test/setup.ts',
  moduleNameMapper: {
    '^@shop-book/shared$': '<rootDir>/../../packages/shared/src',
  },
};
