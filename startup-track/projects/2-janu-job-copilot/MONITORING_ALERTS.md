# Janu Job Copilot — Monitoring & Alerts

**Status:** Baseline monitoring contract  
**Last verified:** 2026-08-23

## Principle

Monitor expected user/product outcomes and invariants, not merely whether a scheduled function ran. A green health row is useful evidence, but it must fail/degrade when the expected outcome was missed.

Exact live values remain in the private tracker/telemetry surface; this public file defines signals and alert semantics.

## 1. Control-plane health

Monitor at minimum:
- worker runtime/circuit,
- sourcing cadence/outcome,
- OpenAI/provider availability,
- Drive/Docs access,
- Gmail outcome-monitor liveness once active,
- regression/release gate,
- trigger topology,
- budget/cost circuit.

Health should include `last_checked`, `last_success`, stable error code and evidence reference. `UNKNOWN` is better than false HEALTHY when evidence is absent.

## 2. Outcome/invariant monitors

### M-01 — Sourcing cadence + usable output
Every expected sourcing cycle either produces a durable successful run outcome with its candidate/opportunity count or a degraded/failed run record. Calendar expectation beats coarse age/freshness logic.

Later add source-quality signals: verified relevant yield, duplicate/closed/noise rate and source contribution. A sourcing worker that runs successfully but produces no useful opportunities for a sustained target window is not automatically healthy.

### M-02 — Non-terminal workflow stall
An eligible non-terminal application must have either active work, a valid future retry, a completed prerequisite path or a genuine human boundary. Plausible state with no progression is an alertable stall.

### M-03 — Closed vacancy containment
Verified CLOSED vacancy must have no active expensive downstream work and no Submission Ready state.

### M-04 — Submission-readiness freshness
Any Ready-to-Submit application must satisfy the current vacancy-freshness policy. Stale/UNKNOWN/CLOSED evidence degrades/blocks readiness rather than silently remaining ready.

### M-05 — Submission provenance integrity
Submitted requires explicit confirmation plus immutable exact Resume Version ID and Applied Date/audit evidence. Alert on missing or contradictory provenance; never infer a real submission from internal state progression alone.

### M-06 — Queue lease/retry hygiene
Alert on stale running leases, retry exhaustion, repeated duplicate idempotency keys or incompatible legacy jobs becoming active.

### M-07 — Worker terminal failures
Track by worker/release/failure class. A new deterministic/system-owned terminal failure should open/associate Failure Learning and should not silently become user work.

### M-08 — Employer-outcome monitor liveness
Once Gmail monitoring is active, expected polling/event processing must produce durable run telemetry. Alert on sustained monitor inactivity, auth failure or unprocessed relevant events rather than assuming no mail means no problem.

### M-09 — Ambiguous/duplicate employer outcomes
Track mailbox events with ambiguous application matching, repeated duplicate processing or state-transition rejection. Ambiguity is reviewable evidence, not a silent mutation.

### M-10 — Follow-up/outreach consistency
Alert when a follow-up remains active after a verified reply/rejection/withdrawal/other terminal event should have suppressed it, or when expected follow-up has no action/evidence.

### M-11 — Interview lifecycle consistency
Verified interview engagement should have the expected Interview Room/state projection. Alert on engagement with no product record or a terminal/rejected application retaining impossible future interview work.

### M-12 — Trace completeness
Once trace v0 ships, alert/degrade when an instrumented worker/event path has no trace/release identity, no terminal outcome or missing required model/tool/verifier evidence.

### M-13 — Release provenance
Production deployment must produce commit/version/suite/transformed-source hash and post-push verification. Missing/mismatched provenance is a release failure.

### M-14 — Privacy/security
Governance CI fails when governed public docs contain likely PII/private application IDs. Runtime telemetry/mailbox processing should add equivalent sensitive-data leakage/minimization checks. Alert on unexpected permission/auth scope change.

### M-15 — Cost/runaway work
Alert/open circuit on configured budget breach, duplicate paid work, abnormal repeated retries or high cost per successful outcome when trace attribution becomes available.

### M-16 — User-attention integrity
Track every `My Actions`/human escalation by class. A recurring avoidable system-owned blocker is a product/autonomy failure even if the underlying worker eventually succeeds.

### M-17 — Learning recurrence
When a failure class with a stated prevention control recurs, flag the prevention as insufficient rather than merely creating another incident.

### M-18 — Outcome-learning health
Once enough lag-adjusted outcome data exists, monitor whether outcome events are attributable to submissions and whether the north-star/funnel calculation has enough evidence. Do not produce misleading conversion dashboards from incomplete/unmatched events.

## 3. Initial status semantics

- **HEALTHY:** expected outcome/invariant currently satisfied with adequate evidence.
- **DEGRADED:** system remains usable but expected cadence/latency/coverage/invariant is at risk or incomplete.
- **FAILED:** required invariant/outcome is not satisfied or unsafe continuation would occur.
- **UNKNOWN:** insufficient evidence; do not silently coerce to healthy.

Circuit state is separate from health status.

## 4. Notification policy

Notify proactively for material state changes such as:
- new/recurrent SEV-1/SEV-2 system failure,
- production release/deployment failure or source-hash mismatch,
- missed expected sourcing/outcome-monitor cycle,
- CLOSED/stale vacancy conflicting with downstream readiness/work,
- sustained workflow stall,
- submission provenance inconsistency,
- sustained unprocessed/ambiguous employer-outcome backlog,
- budget/privacy/security breach,
- regression gate failure affecting planned release,
- a Lab intervention that materially wins/regresses against its target metric.

Do not notify the user for every successful tick, low-value transient retry or expected no-op run.

## 5. Product-outcome monitoring vs analytics

Monitoring answers **"is an expected system/product invariant wrong now?"**

`BASELINE_SCORECARD.md`/private analytics answer **"is the job search/product improving over time?"**

Do not treat uptime/health as a substitute for:
- relevant opportunity supply,
- source -> submission completion,
- employer response/interview/offer conversion,
- genuine user effort,
- quality/autonomy/cost,
- learning effectiveness.

Lagging hiring outcomes need cohort maturity rules; a recently submitted application with no reply is not automatically a failed outcome.

## 6. Current automation

A separate ChatGPT condition watch tracks meaningful Job Copilot updates and is configured to surface material release/runtime/architecture/failure/eval changes while remaining silent when nothing meaningful changes. Runtime-critical monitoring must still exist inside the product; chat automation is a supplementary notification layer, not the source of truth.
