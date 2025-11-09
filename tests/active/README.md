# Active Jest suite

This folder contains the streamlined Jest specs that mirror our production
moderation, wiki, and profile workflows. The Jest configuration points to this
folder through the `roots` option so only these files execute during `pnpm test`.
Add future unit tests here using the existing sub-structure (e.g. `api/`,
`lib/tests/unit/`, `profile/`).
