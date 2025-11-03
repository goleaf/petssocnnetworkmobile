# Test Running Instructions

## E2E Tests

Due to a known issue with Next.js 16 Turbopack and certain directory structures (e.g., Dropbox paths), E2E tests may require manual server startup:

### Option 1: Manual Server Start (Recommended)
1. Start the dev server manually:
   ```bash
   pnpm dev
   ```
2. Wait for server to be ready (should show "Ready" message)
3. In another terminal, run tests:
   ```bash
   pnpm test:e2e --workers=1
   ```

### Option 2: CI Mode
Tests will automatically start the server in CI mode:
```bash
CI=true pnpm test:e2e --workers=1
```

## Test Organization

All tests have been moved to centralized locations:

- **E2E Tests**: `e2e/` folder (Playwright browser tests)
- **Unit Tests**: `tests/unit/` folder (Jest tests)

### Test Structure:
```
e2e/                          # Playwright E2E tests
├── fixtures.ts               # Test fixtures
├── test-helpers.ts           # Helper functions
└── *.spec.ts                 # Test files

tests/unit/                   # Jest unit tests
├── api/                      # API route tests
├── app/                      # Page/component tests
├── components/               # Component tests
└── lib/                      # Library/utility tests
```

## Running Tests

- **Unit tests**: `pnpm test`
- **E2E tests**: `pnpm test:e2e`
- **E2E with UI**: `pnpm test:e2e:ui`
- **E2E debug mode**: `pnpm test:e2e:debug`

## Screenshots

All E2E tests automatically take screenshots on failure. Screenshots are saved to:
- `test-results/screenshots/` - Custom screenshots from test helpers
- `test-results/` - Playwright auto screenshots on failure

