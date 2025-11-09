const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  // Explicitly disable automatic mocks so our manual spies behave predictably
  automock: false,
  moduleNameMapper: {
    // Specific mocks must come before the catch-all alias
    '^@/components/auth/auth-provider$': '<rootDir>/tests/unit/auth/auth-provider.ts',
    // Map legacy relative mocks used by older tests
    '^\.\./auth/auth-provider$': '<rootDir>/tests/unit/auth/auth-provider.ts',
    '^\.\./notifications-dropdown$': '<rootDir>/tests/unit/notifications-dropdown.tsx',
    // Catch-all for tsconfig "@/" alias
    '^@/(.*)$': '<rootDir>/$1',
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
  // Only execute the curated unit tests that live in tests/active; the legacy
  // suites are retained for reference but intentionally excluded because they
  // target modules that are no longer part of the application.
  roots: ['<rootDir>/tests/active'],
  testMatch: ['<rootDir>/tests/active/**/*.{test,spec}.{js,jsx,ts,tsx}'],
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
