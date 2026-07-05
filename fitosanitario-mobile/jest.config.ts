import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',
  setupFiles: ['./jest.patch.js'],
  moduleNameMapper: {
    '^expo/src/winter$': '<rootDir>/__mocks__/expo-winter.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$|expo|expo-.*|@expo.*|@react-native.*|react-native|react-native.*|react-native-.*|@react-navigation.*|zustand|axios|@react-native-async-storage/async-storage)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.spec.{ts,tsx}', '!src/**/types.ts'],
  coverageReporters: ['lcov', 'text-summary'],
  reporters: ['default', 'jest-junit'],
};

export default config;
