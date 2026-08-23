# Janu Job Copilot — Eval Plan

**Status:** Baseline evaluation contract  
**Last verified:** 2026-08-23

## Public/private eval boundary

This public repository stores eval definitions and privacy-safe fixture classes. Exact live application/company identities, candidate content and private tracker rows remain in the authorized private product evidence surface. A test may refer to an opaque fixture/failure ID when reproducibility needs linkage without publishing user-specific state.

## 1. Evaluation principle

A change is an improvement only when it improves a defined outcome on representative evidence without unacceptable regression in reliability, safety, autonomy, latency or cost.

Prefer verifiers in this order:
1. deterministic environment truth,
2. known-answer/reference comparison,
3. explicit rule/rubric,
4. model grader for irreducibly semantic dimensions,
5. human judgment when genuinely irreducible.

## 2. Core capability evals

### E2E-01 — Fresh-source golden path
Input: one genuinely relevant fresh public job URL not already present.

Pass requires:
- canonicalize/dedupe,
- verify vacancy/JD provenance,
- create/promote correct Application state,
- score/map evidence,
- complete required enrichment,
- generate evidence-grounded resume/application pack,
- pass QA,
- reach Resume Review / Ready to Submit according to policy,
- no avoidable user blocker,
- no duplicate application/JD/resume/queue artifacts,
- complete trace/release evidence.

### E2E-02 — Closed-vacancy stop
A verified CLOSED vacancy must close/stop the application, obsolete downstream queued work, clear invalid user action and remain idempotent on rerun.

### E2E-03 — Recovery without user relay
A recoverable system-owned retrieval/queue/worker failure must repair/retry/reconcile automatically or fail with an actionable system incident—not create a false user blocker.

### E2E-04 — Submitted provenance
After explicit real-submission confirmation, Applied Date and exact Resume Version ID are frozen correctly; no pre-confirmation path may mark Submitted.

## 3. Worker-level evals

Maintain targeted cases for:
- source intake / dedupe / canonicalization,
- vacancy freshness and lifecycle propagation,
- JD retrieval/parse/completeness,
- evidence-map grounding and scoring,
- company/contact factuality and source provenance,
- resume evidence grounding and representation,
- render integrity / template hygiene,
- application-pack sanitization,
- PDF/ATS QA,
- queue idempotency/retry/lease/circuit behavior,
- state transitions and schema contracts,
- release identity/deployment provenance,
- sourcing cadence/health,
- trace completeness/privacy.

## 4. Historical failure conversion

The private Failure Learning store is the incident source. Every repeatable material defect should map to one of:
- deterministic regression,
- representative fixture/eval,
- release/live preflight invariant,
- procedure/runbook rule,
- architecture invariant.

The failure record should name the prevention/eval. The eval should be able to fail again if the defect is reintroduced.

## 5. Initial representative fixture classes

Use existing private historical evidence as seeds without publishing the live user's application state and without assuming those exact cases are the whole benchmark:
- a prior successful resume-review acceptance fixture,
- an official-ATS JD-recovery fixture with a later deterministic render-integrity failure,
- a verified-CLOSED lifecycle-propagation fixture,
- historical artifact-hygiene / QA-provenance fixtures,
- source-intake PDF writeback/schema/replay fixtures,
- a new clean fresh URL — required held-out golden path.

Do not tune exclusively to historical fixtures. Add held-out fresh roles, negative cases and adversarial/boundary cases. Store sensitive fixture inputs in the private evidence surface, with public tests using opaque IDs or synthetic equivalents where possible.

## 6. Metrics/eval connection

Each material change should name:
- target capability/eval,
- baseline metric(s),
- expected direction/magnitude where meaningful,
- regression suite,
- cost/latency guardrail,
- observation window/cohort,
- release version/change ID.

See `BASELINE_SCORECARD.md` and `LAB_IMPROVEMENT_LEDGER.md`.

## 7. Model/prompt/tool changes

When changing model, reasoning mode, prompt, retrieval route or tool strategy:
- change one major variable at a time when practical,
- run the same representative eval set before/after,
- compare quality plus tokens/cost/latency/tool calls/retries,
- do not count lower cost as an improvement if outcome quality regresses,
- retain a rollback path.

## 8. Agentic/multi-agent entry gate

Do not introduce a new planner/critic/ranker/fuser/subagent architecture merely because it is available.

Require:
- a measured failure in the simpler workflow,
- a credible mechanism by which extra autonomy/search addresses it,
- a verifier that can distinguish better from worse candidates,
- held-out eval improvement that justifies added latency/cost/coordination risk.

## 9. Promotion gate

A production-changing improvement is promotable when:
- targeted eval passes,
- required regressions pass,
- environment verification passes,
- no protected evaluator/evidence was weakened,
- trace/release evidence is complete enough to attribute the result,
- autonomy/privacy/cost thresholds remain acceptable,
- rollback is available.

## 10. Evaluation of the Lab itself

Changes sourced from AI Systems Lab must be entered in `LAB_IMPROVEMENT_LEDGER.md` with a hypothesis and later observed result. Lab advice is not considered validated simply because it was implemented.