# Legacy test snapshots

These suites were generated from upstream prototypes and rely on fixtures that no
longer match the production code. They remain checked in for reference, but
`jest.config.js` excludes the directory from the default `pnpm test` run.

When reactivating any of these cases, move the file back into `tests/active/`
and update the surrounding documentation.
