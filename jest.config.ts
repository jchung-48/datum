// jest.config.ts
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.ts',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.ts',
    "^@/(.*)$": "<rootDir>/$1",
  },
};

module.exports = {
  preset: "ts-jest", // Use ts-jest preset for TypeScript support
  testEnvironment: "node", // Ensure the test environment is node
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest", // Process TypeScript files with ts-jest
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json", "node"],
};

export default createJestConfig(customJestConfig);
