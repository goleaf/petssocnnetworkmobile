# Test Migration Plan

## Overview

All tests are being migrated to a centralized `tests/` directory structure to improve organization and maintainability.

## Current Status

### E2E Tests (Playwright)
- ✅ Located in `e2e/` folder (root level)
- ✅ All e2e tests use helper functions from `e2e/test-helpers.ts`
- ✅ Comprehensive coverage for all pages, buttons, and fields

### Unit Tests (Jest)
- ⚠️ Currently scattered in `__tests__` folders throughout the project
- 📋 Migration to `tests/unit/` is in progress

## Target Structure

```
tests/
├── unit/           # Jest unit tests
│   ├── components/ # Component tests
│   ├── lib/        # Library/utility tests  
│   ├── app/        # App/page tests
│   └── api/        # API route tests
└── README.md       # Test organization documentation

e2e/                # Playwright e2e tests (keeping in root for now)
├── fixtures.ts     # Test fixtures
├── test-helpers.ts # Helper functions
└── *.spec.ts       # Test files
```

## Migration Rules

**IMPORTANT:** Going forward, **DO NOT create tests in `__tests__` folders**. All new tests must be created in the centralized `tests/` directory structure.

### For New Tests:
1. **Jest Unit Tests** → Create in `tests/unit/` with appropriate subdirectory
2. **Playwright E2E Tests** → Create in `e2e/` folder

### Migration Process:
1. Jest config supports both old and new locations for backward compatibility
2. Gradually move tests from `__tests__` folders to `tests/unit/`
3. Update imports in moved tests to reflect new paths
4. Remove tests from old locations after migration

## Test Helper Functions (E2E)

All e2e tests use helper functions from `e2e/test-helpers.ts`:
- `testAllButtons(page, maxButtons)` - Tests all buttons on a page
- `testAllLinks(page, maxLinks)` - Tests all links on a page  
- `testAllFormFields(page)` - Tests all form fields (input, textarea, select)
- `testAllInputFields(page)` - Tests all input fields
- `testAllTextareaFields(page)` - Tests all textarea fields
- `testAllSelectFields(page)` - Tests all select fields

## Running Tests

```bash
# Run Jest unit tests
pnpm test

# Run Playwright e2e tests
pnpm test:e2e

# Run e2e tests with UI
pnpm test:e2e:ui

# Run e2e tests in headed mode
pnpm test:e2e:headed
```

