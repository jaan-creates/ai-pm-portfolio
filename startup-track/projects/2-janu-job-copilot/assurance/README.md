# Janu Job Copilot — Assurance Recovery (draft, privacy-safe)

**Status:** INCOMPLETE / controlled draft; not deployed. **Assessment cutoff:** 2026-10-12.
**Authoritative business source:** Master Product & Engineering Specification v0.26.0, Google Drive.
**Source baseline:** `ai-pm-portfolio` main `205ce1116675` (2026-10-11).
**Protected boundary:** GitHub is public; do not commit tracker rows, candidate evidence, mailbox text, prompts, full runtime Apps Script source, or credentials.

## Source and verification matrix

`source-register.v1.json` records authoritative owner, target, verified read/write access, proof and remaining blockers. For real changes, record the exact Git commit, Docs revision, Sheets range/cutoff and where applicable deployed source hash. Tool availability is not evidence that a specific target can be read or modified. Use least privilege: read -> isolated reversible Git -> authorized product state -> protected deployment/human action.

## Actual observability contract

`contract.mjs` is a **source-level evidence validator, NOT deployed Apps Script instrumentation**. Canonical event fields: `telemetry_schema_version`, `event_id`, `event_type`, `trace_id`, `span_id`, `parent_span_id`, `group_id`, `workflow_name`, `occurred_at`, `recorded_at`, `status`, `release_version`, `evidence_ref`. Preserve `queue_job_id`, attempt and model/cost provenance when relevant. Do not conflate an event ID, span ID, run/trace ID or application/group ID. UTC timestamps and independently verified persistence are required. Parent span is null only for the root.

Run the *actual* validator offline (Node 22, no network or credentials):

```sh
node startup-track/projects/2-janu-job-copilot/assurance/test-contract.mjs
node startup-track/projects/2-janu-job-copilot/scripts/test-trace-golden-v0-patch.mjs startup-track/projects/2-janu-job-copilot
```

The second test constructs a temporary script and composes the real vacancy-lifecycle patch prior to TRACE and E2E continuation. It does not contact production; it does not certify a full application journey. Governance CI requires both tests after the proposed PR lands. A file present or test skipped is not a pass.

## Metric and baseline discipline

`metrics.v1.json` is an **unapproved definition proposal**, not a scored baseline. Each metric includes numerator, denominator, unit, inclusion/exclusion, source, observation window, missing-data treatment, owner and nullable baseline/target. Do not approve numeric thresholds or calculate outcome rates until expected-run schedule, stable identity and cohort labels have been reconciled.

Use four separate **measurement assurance** statuses: VERIFIED / PARTIALLY OBSERVABLE / NOT INSTRUMENTED / BLOCKED. Operational health (HEALTHY/DEGRADED/BLOCKED/FAILED/UNKNOWN) is a separate axis. `Not Started` is pending; never silently count `OK` as a state error. Unexpected labels are reviews, not certified invariant failures.

## Evidence chain to close a capability

```
approved expectation (source + revision)
  -> exact implementation (commit + transformed runtime hash)
  -> observed execution (trace, worker + attempt)
  -> durable target mutation (canonical ID + immutable artifact)
  -> independent readback (verification ref)
  -> regression + approved baseline
  -> effect on user effort/business outcome, when mature
  -> review decision + recorded risks + rollback
```

A missing link means INCOMPLETE. Sourcing scheduler liveness must not be inferred from recovery runs. A PR cannot be declared green when its CI checks never executed.

## Actual October 12 observations (do not confuse with new test results)

- The existing draft PR #55 had two failing Actions jobs; its synthetic eval step was SKIPPED. See GitHub run IDs `38221284384` and `38221284252`.
- Both failed in TRACE fixture composition: missing `p1aPropagateClosedVacancy_`. This branch corrects the fixture by applying the genuine lifecycle patch first; effect awaits actual CI execution.
- Private tracker Dashboard B17 used `COUNTIF(Applications!AO2:AO,"?*")`, which counts `OK` as error. The observed populated labels were 51 `OK`, 6 `Not Started`. This is a measurement-definition defect; repair/verification status is recorded separately in the dated assessment.
- Sourcing Run records show missed scheduled slots and separately recorded successful recovery cycles. On Oct 12, the Daily Sourcing health component reported BLOCKED/OPEN with `SOURCING_SCHEDULER_STALE`. Exact trigger execution/inventory is not directly independently observable through current connector access.
- The existing Trace Explorer view held a manually assembled 26-entry single-trace reconstruction without parent-span IDs; it does **not** demonstrate production-wide correlated telemetry.
- A held-out golden application has linked Application, queue, Resume Registry, Resume Review and Audit entries, ending at Resume Review rather than Submitted. Exact source/job IDs are private and not copied here.

## Required next gates

1. Confirm this PR's actual GitHub Actions run and reproduce failure/pass outcomes; inspect job logs, do not rely on status summary alone.
2. Independently capture the current assembled Apps Script source/trigger inventory with existing clasp credentials using a separate **read-only** path. Never call the production CD `workflow_dispatch` as an audit probe.
3. Approve event propagation design, incorporate it into real worker/persistence code with compatibility migration, test a full isolated journey, then prove one real downstream readback.
4. Reconcile actual expected schedule calendar against `__Sourcing Runs` and business outcomes; investigate recurring misses without bypassing the OPEN sourcing circuit.
5. Calibrate AI factuality rubrics with approved private evidence and held-out fixtures; do not expose them publicly.
6. Decide ownership and retention, approval of metric definitions, privacy/redaction, baseline update controls, branch protection and alert acknowledgement.
7. Verify meaningful improvement with pre/post controlled cohorts; record **Keep/Revise/Reject/Insufficient Evidence** in existing Lab Improvement and Failure Learning records.

The existing `RUNBOOK.md`, `ITERATION_EVIDENCE_GATE.md`, `AUTONOMY_CONTRACT.md`, `TRACE_SCHEMA.md` and `EVAL_PLAN.md` remain authoritative. This work implements a small validator and source registry under them rather than replacing governance.

**Production release decision: HOLD.** The recovery branch is not a product release; do not merge until CI and safe rollout dependencies are satisfied.
