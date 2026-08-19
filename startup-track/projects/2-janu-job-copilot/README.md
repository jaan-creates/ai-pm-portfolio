# Janu Job Copilot — isolated automation project

This folder is the dedicated engineering/control-plane project for the Janu Job Copilot. Job Copilot work must remain inside this folder plus its single path-scoped GitHub Actions workflow at `.github/workflows/janu-job-copilot.yml`. No other existing `ai-pm-portfolio` project directory is part of this system.

## Current target release

- Apps Script release: `1.3.5`
- Regression suite: `p0-regression-v16`
- Apps Script project identity is held only in GitHub Actions secrets, not committed to this public repository.
- Live tracker and document identifiers remain runtime concerns; the repository automation does not copy the live Apps Script source into GitHub.

## Why the source is pulled ephemerally

`ai-pm-portfolio` is public. The production Apps Script contains operational Drive/Sheet identifiers, so the CD job pulls the current production source into an ephemeral GitHub runner, applies a deterministic release patch, validates it, and pushes it back with `clasp`. The production source is not committed to the public repo.

## Pipeline

`.github/workflows/janu-job-copilot.yml` is path-scoped to this project. It authenticates with Job-Copilot-specific secrets, pulls production source, applies `scripts/patch-live-source.mjs`, syntax-checks the complete source, validates the release contract, and pushes only on PASS. The validator binds header/P12/verify/RELEASE-001 identity, rejects stale release literals and duplicate functions, and requires the current P0 controls.

## Release/runtime control

The runtime exposes a fixed allow-listed operator-command channel through `__Worker State`. Supported commands include `P0_BOOTSTRAP`, `RUN_REGRESSION`, `RUN_PREFLIGHT`, `ENABLE_WORKER`, `DISABLE_WORKER`, and `ONE_JOB_TICK`; arbitrary evaluation is rejected.

`CONTROL-002` ensures this command channel remains reachable through the scheduled `phase1HealthTick` even while the broad `phase1OneJobTick` worker is deliberately absent during a release gate. This prevents a gated release from losing its own operator control plane.

`BOOTSTRAP-005` closes FL-031: every P0 closure lock collision schedules a fresh bounded future continuation. A currently executing one-shot watchdog is never trusted as proof of future progress; the next lock-owning closure entry clears duplicate closure triggers before work.

## Secrets

The deployment job uses `JANU_CLASPRC_JSON` and `JANU_CLASP_JSON`. Never commit `.clasprc.json`, `.clasp.json`, OAuth refresh tokens, API keys, or other credentials.

## P0 ownership rule

A green infrastructure dashboard is not sufficient for P0 closure. `P0 CLOSED → P1 READY` requires current-release regression PASS, current live preflight PASS, healthy runtime/circuits, zero unresolved system-owned Worker Error, live unattended Apply progression proofs, real scheduled sourcing telemetry, artifact hygiene, durable Failure Learning closure evidence, and the human-gated Motive approval/submission step where applicable.
