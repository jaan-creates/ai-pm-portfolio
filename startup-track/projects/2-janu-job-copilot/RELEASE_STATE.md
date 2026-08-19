# Janu Job Copilot — Release State

Last updated: 2026-08-19 IST

## Target

- Release: `1.3.3`
- Regression suite: `p0-regression-v14`
- Master spec: `0.19.0`
- Deployment branch: `janu-job-copilot/apps-script-ci`

## Current P0 defects being closed

- FL-027 — fresh application-pack EV-* hygiene failure
- FL-028 — QA rejection did not self-heal via fresh evidence-grounded resume generation
- FL-029 — release identity packaging mismatch in the first 1.3.2/v13 handoff
- FL-030 — closure watchdog could be consumed by a script-lock collision

v14 contains/retains the required controls: `PACK-SAN-001`, `QA-REPAIR-001`, `BOOTSTRAP-003`, `BOOTSTRAP-004`, `CONTROL-001`, and `RELEASE-001`.

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

## Automation boundary

After v14 deploys, approved runtime actions are requested through the allow-listed `__Worker State` operator-command channel. ChatGPT owns command issuance, tracker verification, regression/preflight inspection, defect triage, and iterative GitHub patch updates. Human intervention is reserved for OAuth/security setup and true user approval/authenticated external submission boundaries.
