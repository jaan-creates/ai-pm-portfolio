# Janu Job Copilot — Monitoring & Alerts

**Status:** Baseline monitoring contract  
**Last verified:** 2026-08-23

## Principle

Monitor user outcomes and invariants, not merely whether a scheduled function ran. A green health row is useful evidence, but it must fail/degrade when the expected outcome was missed.

Exact live values remain in the private tracker/telemetry surface; this public file defines signals and alert semantics.

## 1. Control-plane health

Monitor at minimum:
- worker runtime/circuit,
- sourcing cadence/outcome,
- OpenAI/provider availability,
- Drive/Docs access,
- regression/release gate,
- trigger topology,
- budget/cost circuit.

Health should include `last_checked`, `last_success`, stable error code and evidence reference.

## 2. Outcome/invariant monitors

### M-01 — Sourcing cadence
Expected scheduled sourcing cycle either produces a durable successful run outcome or a degraded/failed run record. Calendar expectation beats coarse age/freshness logic.

### M-02 — Non-terminal workflow stall
An eligible non-terminal application must have either active work, a valid future retry, a completed prerequisite path or a genuine human boundary. Plausible state with no progression is an alertable stall.

### M-03 — Closed vacancy containment
Verified CLOSED vacancy must have no active expensive downstream work and no Submission Ready state.

### M-04 — Queue lease/retry hygiene
Alert on stale running leases, retry exhaustion, repeated duplicate idempotency keys or incompatible legacy jobs becoming active.

### M-05 — Worker terminal failures
Track by worker/release/failure class. A new deterministic/system-owned terminal failure should open/associate Failure Learning and should not silently become user work.

### M-06 — Trace completeness
Once trace v0 ships, alert/degrade when an instrumented worker has no trace/release identity, no terminal outcome or missing required model/tool/verifier evidence.

### M-07 — Release provenance
Production deployment must produce commit/version/suite/transformed-source hash and post-push verification. Missing/mismatched provenance is a release failure.

### M-08 — Privacy
Governance CI fails when governed public docs contain likely PII/private application IDs. Runtime telemetry should later add equivalent sensitive-data leakage checks.

### M-09 — Cost/runaway work
Alert/open circuit on configured budget breach, duplicate paid work, abnormal repeated retries or high cost per successful outcome when trace attribution becomes available.

### M-10 — Learning recurrence
When a failure class with a stated prevention control recurs, flag the prevention as insufficient rather than merely creating another incident.

## 3. Initial status semantics

- **HEALTHY:** expected outcome/invariant currently satisfied.
- **DEGRADED:** system remains usable but expected cadence/latency/coverage/invariant is at risk or incomplete.
- **FAILED:** required invariant/outcome is not satisfied or unsafe continuation would occur.
- **UNKNOWN:** insufficient evidence; do not silently coerce to healthy.

Circuit state is separate from health status.

## 4. Notification policy

Notify proactively for material state changes such as:
- new/recurrent SEV-1/SEV-2 system failure,
- production release/deployment failure or source-hash mismatch,
- missed expected sourcing cycle,
- CLOSED vacancy still processing,
- sustained workflow stall,
- budget/privacy/security breach,
- regression gate failure affecting planned release,
- a Lab intervention that materially wins/regresses against its target metric.

Do not notify the user for every successful tick or low-value transient retry.

## 5. Scorecard linkage

Monitoring answers "is something wrong now?" `BASELINE_SCORECARD.md`/private metrics answer "is the product improving over time?" Do not treat uptime/health as a substitute for completion, quality, autonomy, cost or downstream product outcomes.

## 6. Current automation

A separate ChatGPT condition watch tracks meaningful Job Copilot updates and is configured to surface material release/runtime/architecture/failure/eval changes while remaining silent when nothing meaningful changes. Runtime-critical monitoring must still exist inside the product; chat automation is a supplementary notification layer, not the source of truth.