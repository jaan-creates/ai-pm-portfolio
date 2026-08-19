# Janu Job Copilot — isolated automation project

This folder is the dedicated engineering/control-plane project for the Janu Job Copilot. Job Copilot work must remain inside this folder plus its single path-scoped GitHub Actions workflow at `.github/workflows/janu-job-copilot.yml`. No other existing `ai-pm-portfolio` project directory is part of this system.

## Current target release

- Apps Script release: `1.3.3`
- Regression suite: `p0-regression-v14`
- Apps Script project identity is held only in GitHub Actions secrets, not committed to this public repository.
- Live tracker and document identifiers remain runtime concerns; the repository automation does not copy the live Apps Script source into GitHub.

## Why the source is pulled ephemerally

`ai-pm-portfolio` is public. The production Apps Script contains operational Drive/Sheet identifiers, so the CD job pulls the current production source into an ephemeral GitHub runner, applies a deterministic release patch, validates it, and pushes it back with `clasp`. The production source is not committed to the public repo.

This gives us repeatable deployment while keeping Job Copilot operational source out of repository history.

## Pipeline

`.github/workflows/janu-job-copilot.yml` runs only for this project path. It:

1. authenticates to Apps Script using Job-Copilot-specific GitHub secrets;
2. runs `clasp pull` against the existing production Apps Script project;
3. applies `scripts/patch-live-source.mjs`;
4. runs JavaScript syntax validation;
5. runs `scripts/validate-release.mjs` against the full pulled source;
6. pushes only if all release contracts pass.

The validator checks the complete release identity surface (`header`, `P12.VERSION`, `P12.SUITE`, `verifyReleaseIdentity`, `RELEASE-001`), stale-release literals, duplicate top-level functions, and mandatory P0 regression/control IDs.

## Function execution takeover

The Apps Script runtime has an allow-listed operator command channel in `__Worker State`. The production `phase1OneJobTick` trigger checks it before ordinary queue work. This lets the connected Sheet tooling request only approved commands such as:

- `P0_BOOTSTRAP`
- `RUN_REGRESSION`
- `RUN_PREFLIGHT`
- `ENABLE_WORKER`
- `DISABLE_WORKER`
- `ONE_JOB_TICK`

Arbitrary code execution is rejected. After v14 is deployed, ChatGPT can write an operator command to the tracker, inspect its durable result, and continue the release/test loop without asking the user to select and run Apps Script functions manually.

## One-time secrets

The GitHub Actions deployment job requires exactly these repository secrets:

- `JANU_CLASPRC_JSON` — contents of `~/.clasprc.json` created by an authorized `clasp login` for the Google account that owns/has edit access to the Apps Script project.
- `JANU_CLASP_JSON` — the `.clasp.json` project mapping for the production Apps Script project.

Never commit `.clasprc.json`, `.clasp.json`, OAuth refresh tokens, API keys, or other credentials. These names are intentionally Job-Copilot-specific so other repository projects cannot accidentally reuse them.

## P0 ownership rule

A green infrastructure dashboard is not sufficient for P0 closure. `P0 CLOSED → P1 READY` requires current-release regression PASS, current live preflight PASS, no unresolved system-owned Worker Error, healthy runtime/circuits, live unattended Apply progression proofs, scheduled sourcing telemetry, artifact hygiene, durable Failure Learning closure evidence, and the human-gated Motive approval/submission step where applicable.
