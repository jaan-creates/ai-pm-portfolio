# Janu Job Copilot — Release State

Last updated: 2026-08-19

## Target

- Release: `1.3.4`
- Regression suite: `p0-regression-v15`
- Master spec: `0.19.0`
- Deployment branch: `janu-job-copilot/apps-script-ci`
- CI credential state: `JANU_CLASPRC_JSON confirmed; JANU_CLASP_JSON confirmed; Apps Script API enabled`
- Deployment state: `RETRIGGER_AFTER_DEFAULT_BRANCH_WORKFLOW_REGISTRATION`

## Current P0 defects being closed

- FL-027 — fresh application-pack EV-* hygiene failure
- FL-028 — QA rejection did not self-heal via fresh evidence-grounded resume generation
- FL-029 — release identity packaging mismatch in the first 1.3.2/v13 handoff
- FL-030 — closure watchdog could be consumed by a script-lock collision
- FL-031 — closure lock collision did not guarantee a fresh future continuation
- FL-032 — deployment workflow existed only on the deployment branch, not the repository default branch, so GitHub did not register/instantiate the expected push workflow. Prevention: deployment workflows must first be registered on the default branch and verified there before relying on branch push triggers.

v15 contains/retains the required controls including `PACK-SAN-001`, `QA-REPAIR-001`, `BOOTSTRAP-003`, `BOOTSTRAP-004`, `BOOTSTRAP-005`, `CONTROL-001`, and `RELEASE-001`. FL-031 requires the `SCHEDULE_REPLACEMENT` continuation contract.

## Strict P0 closure gate

Do not mark `P0 CLOSED → P1 READY` until all current-release evidence is present:

- current release identity verified
- full current regression suite PASS
- live preflight PASS
- Worker Runtime / Regression Gate / Trigger Topology healthy and closed
- production worker enabled exactly once after gate
- queue has no stale/invalid running work
- zero unresolved system-owned Worker Error applications
- artifact hygiene clean and no external EV-* leakage
- Target/Keka/ClickPost recovery confirmed on the final release
- at least two additional Apply applications reach Resume Review unattended without source changes/manual continuation
- one-heavy-job execution remains below the 240-second hard guard and does not duplicate/requeue obsolete work
- real scheduled Daily Sourcing cycle writes durable `__Sourcing Runs` telemetry and tracker candidates autonomously
- Failure Learning rows for release defects are closed with live evidence
- Motive human approval/submission gate is completed when the user elects to submit; exact submitted resume version and Applied Date become immutable

## Execution-control contract

A release transition advances only on evidence, not intent:

`PATCHED -> TRIGGERED -> VALIDATED -> DEPLOYED -> LIVE -> TESTED -> CLOSED -> P1_READY`

A state without its required evidence is not complete. A stalled state must become `STALLED`, then `AUTO_DIAGNOSE`, then `AUTO_REPAIR_RETRY`; `USER_BLOCKED` is permitted only when the remaining boundary genuinely requires user/OAuth/security/external-submission action.

Required evidence:

- `PATCHED`: commit SHA exists
- `TRIGGERED`: workflow run evidence exists
- `VALIDATED`: release-contract validation passes
- `DEPLOYED`: clasp push passes
- `LIVE`: production reports expected release identity
- `TESTED`: live regression and preflight evidence pass
- `CLOSED`: every strict P0 closure invariant passes
- `P1_READY`: closure audit has no unresolved P0 blocker

## Automation boundary

Approved runtime actions are requested through the allow-listed `__Worker State` operator-command channel. ChatGPT owns command issuance, tracker verification, regression/preflight inspection, defect triage, iterative GitHub patch updates, deployment triggering through the isolated branch, and evidence-based state progression. Human intervention is reserved for OAuth/security setup and true user approval/authenticated external submission boundaries.

## Trigger note

The deployment workflow is now registered on `main`. This state mutation on `janu-job-copilot/apps-script-ci` is the clean retrigger after fixing FL-032. Only the isolated Job Copilot project path is modified.
