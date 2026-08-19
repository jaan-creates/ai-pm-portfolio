# Janu Job Copilot — Apps Script source of truth

This folder moves the live Apps Script worker into version control so release packaging defects are caught before manual deployment.

## Current release

- Version: `1.3.2`
- Regression suite: `p0-regression-v13`
- Canonical source: `apps-script/TrackerWorkflow.gs`

## CI guard

`Janu Apps Script CI` performs JavaScript syntax validation plus a release-contract check covering the header, `P12.VERSION`, `P12.SUITE`, `verifyReleaseIdentity()`, `RELEASE-001`, duplicate top-level functions, stale prior-release identity literals, and required P0 regression IDs.

## Deployment automation — one-time setup still required

GitHub can now be the source of truth. To eliminate Apps Script editor copy/paste completely, the Apps Script project still needs a one-time deployment credential/configuration so CI can push this repository source into the existing Apps Script project. The missing values are the Apps Script **Script ID** and an authorized `clasp`/Apps Script API credential stored as GitHub Actions secrets. Do not commit OAuth tokens or API keys to this repository.

Once those are configured, the deployment workflow can run `clasp push`, then invoke the release identity/bootstrap entrypoints where Google permits API execution. Until that one-time authorization is done, ChatGPT can own GitHub source changes, PRs, CI inspection, and tracker verification, but cannot directly edit or execute the Apps Script project itself.
