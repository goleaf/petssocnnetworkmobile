# Centralized Test Directory

All tests for this project should be located in this `tests/` directory.

## Structure

- `e2e/` - End-to-end tests (Playwright) - located in root `e2e/` folder for now
- `unit/` - Unit tests (Jest)
  - `components/` - Component tests
  - `lib/` - Library/utility tests
  - `app/` - App/page tests
  - `api/` - API route tests

## Important Note

**DO NOT create tests in external folders (like `__tests__` folders throughout the project). All new tests must be created in this centralized `tests/` directory.**





