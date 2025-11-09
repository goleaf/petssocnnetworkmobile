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

All executable suites now live in curated folders:

- **E2E Tests**: `e2e/` folder (Playwright browser tests)
- **Unit Tests**: `tests/active/` folder (Jest tests run in CI)
- **Legacy Suites**: `tests/legacy/` (archived reference material that no longer runs automatically)

### Test Structure:
```
e2e/                          # Playwright E2E tests
├── fixtures.ts               # Test fixtures
├── test-helpers.ts           # Helper functions
└── *.spec.ts                 # Test files

tests/active/                 # Jest unit tests executed by pnpm test
├── api/                      # API route regression tests
├── lib/tests/unit/           # Moderation, wiki, and analytics flows
├── profile/                  # UI smoke tests
└── *.test.ts                 # Focused utility specs

tests/legacy/                 # Archived suites (kept for future migration)
├── api/                      # Generated API specs
├── app/                      # Component/page experiments
├── components/               # UI spikes
└── lib/                      # Upstream and vendor fixtures
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

