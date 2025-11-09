const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  // Enable React mock
  automock: false,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Map legacy relative mocks used by older tests
    '^\.\./auth/auth-provider$': '<rootDir>/tests/unit/auth/auth-provider.ts',
    '^\.\./notifications-dropdown$': '<rootDir>/tests/unit/notifications-dropdown.tsx',
    '^@/components/auth/auth-provider$': '<rootDir>/tests/unit/auth/auth-provider.ts',
    // Map Next.js internal paths to our mock
    '^next/dist/server/web/exports/next-response$': '<rootDir>/__mocks__/next/server.js',
    '^next/server$': '<rootDir>/__mocks__/next/server.js',
  },
  // Ensure Jest doesn't transform next/server
  transformIgnorePatterns: [
    '/node_modules/(?!(next)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  testMatch: [
    // New centralized test location (preferred)
    'tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}',
    // Legacy locations (for backward compatibility during migration)
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
