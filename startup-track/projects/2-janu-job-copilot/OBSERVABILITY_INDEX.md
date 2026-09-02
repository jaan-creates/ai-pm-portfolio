# Janu Job Copilot — Observability & Verification Index

**Purpose:** one privacy-safe map for inspecting how Job Copilot is observed, tested, evaluated, released and improved.

> This public repository stores schemas, executable controls, tests, release logic and privacy-safe conclusions. Exact candidate/application incidents and production traces remain in the private Live Tracker and are referenced by opaque IDs rather than copied here.

## Runtime observability

| Need | Git source / contract | Live product evidence |
|---|---|---|
| Trace model and required fields | `TRACE_SCHEMA.md` | `Trace Explorer`, `__Golden Trace` |
| Queue / worker execution | `TRACE_SCHEMA.md`, `FAILURE_TAXONOMY.md` | `__Processing Queue` |
| Business mutations | `ITERATION_EVIDENCE_GATE.md` | `Audit Log` |
| Root cause / prevention learning | `FAILURE_TAXONOMY.md`, `LAB_IMPROVEMENT_LEDGER.md` | `__Failure Learning` |
| Test-to-defect closure | `ITERATION_EVIDENCE_GATE.md`, `EVAL_PLAN.md` | `__Verification Ledger` |
| Regression runs | `EVAL_PLAN.md` | `__Regression Results` |
| Control-plane health | `AUTONOMY_CONTRACT.md`, `BASELINE_SCORECARD.md` | `__System Health`, `__Worker State` |
| Cost | `BASELINE_SCORECARD.md` | `__Cost Ledger` |

## Executable trace / E2E controls

- `scripts/patch-trace-golden-v0.mjs` — TRACE-GOLDEN base instrumentation and same-fixture runner.
- `scripts/patch-trace-golden-v0-runtime.mjs` — convergent production transform for TRACE V0-2, continuation v3, renderer recurrence controls and trace durability.
- `scripts/patch-trace-durability.mjs` — non-destructive append/verify/retire trace publication and stale fixture-lock reset.
- `scripts/patch-p1a-e2e-continuation.mjs` — artifact-driven liveness reconciliation, newest-attempt semantics, QA repair and no-starvation continuation.
- `scripts/test-p1a-e2e-continuation-v3.mjs` — continuation-v3 source regression.
- `scripts/test-trace-golden-v0-patch.mjs` — TRACE patch behavior test invoked by governance CI.

## Renderer recurrence controls

- `scripts/patch-renderer-careerbreak.mjs` — RENDER-CAREERBREAK-V2 structural rendering, deterministic same-policy replay prevention, enqueue/claim quarantine and release-blocker health precedence.
- `scripts/test-renderer-careerbreak.mjs` — held-out production-shaped Career Break regression (`RENDER-CAREERBREAK-001`) plus quarantine/publisher checks.

A known deterministic production defect is not closed merely because a generic regression passes. Closure requires the exact escaped fixture, prevention test, target deployment provenance and a target-environment canary before fan-out.

## Release / provenance verification

- `.github/workflows/janu-job-copilot.yml` — controlled Apps Script pull → transform → validate → manifest/hash → push → pull/readback → rollback-on-mismatch deployment.
- `.github/workflows/janu-job-copilot-governance.yml` — syntax, privacy, manifest, release-provenance and component behavior checks.
- `scripts/deployment-manifest.mjs` — privacy-safe transformed-source hash/manifest.
- `scripts/patch-release-provenance.mjs` and `scripts/test-release-provenance-patch.mjs` — release identity contract and regression.
- `scripts/live-source-manifest.mjs`, `scripts/live-target-structure.mjs` — safe live integration inspection.

## Eval and E2E design

- `EVAL_PLAN.md` — deterministic regressions, model/evidence-quality evals and longitudinal E2E acceptance.
- `E2E_CONFIDENCE_GAPS_20260821.md` — known end-to-end proof gaps.
- `ITERATION_EVIDENCE_GATE.md` — what evidence a material change must produce before closure.
- `BASELINE_SCORECARD.md` — baseline metrics and improvement measures.
- `LAB_IMPROVEMENT_LEDGER.md` — AI Systems Lab hypotheses and evidence-based Keep / Revise / Reject attribution.

## Current state and build history

- `CURRENT_STATE.md` — privacy-safe current product state.
- `BUILD_NOTES.md` — reader-friendly implementation/change narrative.
- `EXECUTION_ROADMAP.md` — outcome-gated work order.
- `AUTONOMY_CONTRACT.md` — what the system owns vs genuine human-authority boundaries.
- `FAILURE_TAXONOMY.md` — error classes and required responses.

## Where exact production findings live

The following are deliberately **not mirrored verbatim into this public repository** because they can contain private job-search/application details:

- `Audit Log` — exact durable mutations.
- `__Failure Learning` — incident symptom, root cause, escape analysis, blast radius, prevention and reuse rule.
- `__Verification Ledger` — defect/change → prevention → test/eval → run status → release/environment evidence → closure.
- `Trace Explorer` / `__Golden Trace` — concrete application/release traces.
- `__Regression Results` — actual target-environment regression execution.
- `__Worker State` / `__System Health` — deployed contract versions, gates and health.

Git is the executable/design evidence; the private tracker is the production evidence. A production claim is complete only when the two can be joined through test IDs, defect/change IDs, release commit/hash and environment readback.
