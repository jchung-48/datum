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
  },
};

export default createJestConfig(customJestConfig);
