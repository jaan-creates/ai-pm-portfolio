# Janu Job Copilot — Apps Script automation foundation

Goal: make GitHub the source of truth so release packaging, deployment, and test execution stop depending on manual copy/paste in the Apps Script editor.

## Current live release

- Version: `1.3.2`
- Regression suite: `p0-regression-v13`
- Corrected release artifact has been statically verified outside GitHub.

The canonical full source is **not yet committed here**. The first connector write was intentionally removed because it was incomplete; this branch must not be merged until the full source import is complete.

## Release-contract validator

`scripts/validate-release.mjs` is prepared to fail CI when any of these drift:

- release header
- `P12.VERSION`
- `P12.SUITE`
- `verifyReleaseIdentity()` expected version/suite
- `RELEASE-001`
- stale prior-release identity literals
- duplicate top-level functions
- required regression IDs such as `PACK-SAN-001`, `QA-REPAIR-001`, and `BOOTSTRAP-003`

This directly prevents the packaging error that escaped in the first 1.3.2 handoff.

## One-time setup needed for full deployment takeover

Google's supported CI/CD path uses `clasp` with GitHub Actions. The Apps Script API must be enabled, and CI needs two protected GitHub secrets:

- `CLASPRC_JSON` — the OAuth credentials produced by an authorized `clasp login`
- `CLASP_JSON` — the `.clasp.json` mapping containing the existing Apps Script Script ID

For remote function execution (`verifyReleaseIdentity`, `runP0ClosureBootstrap`, etc.), the Apps Script project must also be deployed as an **API executable** and share the same standard Google Cloud project as the OAuth client. The Apps Script API does not support service-account execution for `scripts.run`, so the credential is an authorized user OAuth credential and must be handled as a secret.

## Intended automated flow

1. ChatGPT updates the GitHub source/PR.
2. GitHub Actions runs syntax + release-contract validation.
3. On approved merge, CI runs `clasp push` to the existing Apps Script project.
4. CI remotely runs `verifyReleaseIdentity`.
5. If identity passes, CI runs `runP0ClosureBootstrap`.
6. ChatGPT inspects tracker state, regression results, Failure Learning, and live acceptance through the connected Google Drive/Sheets tools.
7. Human intervention remains only for true user approvals/authenticated application submissions or Google OAuth/security setup.

Do not commit `.clasprc.json`, OAuth tokens, API keys, or other secrets to this repository.
