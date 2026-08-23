# Janu Job Copilot — Eval Plan

**Status:** Baseline evaluation contract  
**Last verified:** 2026-08-23

## Public/private eval boundary

This public repository stores eval definitions and privacy-safe fixture classes. Exact live application/company identities, candidate content, mailbox content and private tracker rows remain in the authorized private product evidence surface. A test may refer to an opaque fixture/failure ID when reproducibility needs linkage without publishing user-specific state.

## 1. Evaluation principle

A change is an improvement only when it improves a defined product/system outcome on representative evidence without unacceptable regression in truthfulness, safety, reliability, autonomy, latency or cost.

The ultimate product outcome is qualified interview conversion per unit genuine user effort. Internal worker/test metrics are enabling evidence, not the north star.

Prefer verifiers in this order:
1. deterministic environment truth,
2. known-answer/reference comparison,
3. explicit rule/rubric,
4. model grader for irreducibly semantic dimensions,
5. human judgment when genuinely irreducible.

## 2. Core capability evals

### E2E-01 — Fresh-source application golden path
Input: one genuinely relevant fresh public job URL not already present.

Pass requires:
- canonicalize/dedupe,
- verify vacancy/JD provenance,
- create/promote correct Application state,
- evaluate fit/decision policy without premature hard-coded Apply for system-sourced roles,
- score/map evidence,
- complete required/non-blocking enrichment,
- generate evidence-grounded resume/application pack,
- pass QA,
- reach Resume Review / Ready to Submit according to policy,
- no avoidable user blocker,
- no duplicate application/JD/resume/action/queue artifacts on rerun,
- complete trace/release evidence.

### E2E-02 — Closed-vacancy stop
A verified CLOSED vacancy must close/stop the application, obsolete downstream queued work, clear invalid user action, remove Submission Ready and remain idempotent on rerun.

### E2E-03 — Recovery without user relay
A recoverable system-owned retrieval/queue/worker failure must repair/retry/reconcile automatically or fail with actionable system incident evidence—not create a false user blocker.

### E2E-04 — Revision integrity
`Revision Needed` must consume the approved revision input/comment, create a new immutable resume version, preserve the prior version, re-render/re-QA and expose the new review artifact. No silent overwrite.

### E2E-05 — Ready-to-Submit gate
Ready status requires current approval/QA, canonical application target, no system blocker and vacancy OPEN within the submission freshness policy. UNKNOWN/stale/CLOSED must fail closed according to policy.

### E2E-06 — Real submission provenance
Only after explicit genuine external-submission confirmation:
- set Submitted/Applied Date,
- freeze the exact Resume Version ID actually used,
- preserve canonical apply target and audit evidence,
- remain idempotent if confirmation is replayed.

No pre-confirmation path may mark Submitted.

### E2E-07 — Employer outcome monitor
Given representative private/synthetic mailbox events:
- classify acknowledgement/recruiter reply/assessment/interview/rejection/offer/unrelated,
- deterministically/high-confidence match to the correct application,
- dedupe replayed messages,
- persist an outcome event + allowed derived state transition,
- ambiguous match fails closed without silent mutation.

### E2E-08 — Post-submission communication/interview continuation
After a verified submission/response:
- follow-up/outreach actions are created only when useful,
- reply/outcome suppresses obsolete follow-up,
- verified interview engagement creates/updates the correct Interview Room,
- no manual tracker bookkeeping is required for system-observable events.

### E2E-09 — Learning attribution
Given sufficient outcome/interview history, any proposed sourcing/priority/positioning/skill learning must:
- cite the cohort/evidence,
- preserve uncertainty/scope,
- remain separate from immutable candidate facts and factual JD Fit,
- define a future metric/eval that can confirm or reject the hypothesis.

### E2E-10 — User-attention integrity
Every generated user action/blocker is classified as:
- genuine judgment,
- privileged external authority,
- exact missing personal evidence unavailable to authorized retrieval,
- or avoidable system relay.

Target: zero avoidable relay for an accepted golden-path cohort.

## 3. Worker/component evals

Maintain targeted cases for:
- scheduled source coverage/cadence,
- source intake / dedupe / canonicalization,
- vacancy freshness and lifecycle propagation,
- JD retrieval/parse/completeness,
- evidence-map grounding and scoring,
- opportunity-decision/priority separation from factual fit,
- company/contact factuality and source provenance,
- resume evidence grounding and representation,
- immutable revision behavior,
- render integrity / template hygiene,
- application-pack sanitization,
- PDF/ATS QA,
- submission confirmation/provenance,
- mailbox outcome classification + matching + dedupe,
- outreach timer/suppression logic,
- Interview Room lifecycle,
- skill-gap aggregation/learning hypotheses,
- queue idempotency/retry/lease/circuit behavior,
- state transitions and schema contracts,
- release identity/deployment provenance,
- trace completeness/privacy,
- cost/budget attribution.

## 4. Product outcome evals

Runtime correctness is necessary but not sufficient. Once normalized outcome events exist, compare cohorts on:

### Opportunity supply
- verified relevant opportunities surfaced,
- duplicate/closed/noise rate,
- source coverage/contribution,
- posting age at intake.

### Funnel
- eligible/relevant source -> Apply,
- Apply -> Ready to Submit,
- Ready -> Submitted,
- Submitted -> response,
- response -> screening/qualified interview,
- interview -> later stage/offer.

### User effort
- human actions/minutes per pursued/submitted application,
- avoidable system-relay actions,
- genuine human-authority actions.

### Quality
- QA first-pass,
- human approve/revision/withdraw,
- evidence/representation violations,
- revision count and reason.

### Reliability/autonomy
- terminal system failure,
- retry/stall/duplicate rates,
- autonomous recovery,
- recurrence after prevention.

Use lag-aware observation windows; do not compare applications that have not had enough time to receive outcomes as if they were failures.

## 5. Historical failure conversion

The private Failure Learning store is the incident source. Every repeatable material defect should map to one of:
- deterministic regression,
- representative fixture/eval,
- release/live preflight invariant,
- procedure/runbook rule,
- architecture invariant.

The failure record should name the prevention/eval. The eval should be able to fail again if the defect is reintroduced.

## 6. Representative fixture strategy

Use existing private historical evidence as seeds without publishing live user state and without assuming those exact cases are the whole benchmark:
- prior successful resume-review path,
- official-ATS JD-recovery + render-integrity failure class,
- verified-CLOSED lifecycle class,
- artifact-hygiene / QA-provenance classes,
- source-intake writeback/schema/replay classes,
- revision-needed fixture,
- ambiguous mailbox match fixture,
- duplicate source fixture,
- a new clean fresh URL for the held-out golden path.

Do not tune exclusively to historical fixtures. Add held-out fresh roles, negative cases and adversarial/boundary cases. Store sensitive fixture inputs in the private evidence surface, with public tests using opaque IDs or synthetic equivalents where possible.

## 7. Metrics/eval connection

Each material change should name:
- affected JTBD capability in `PRODUCT_CAPABILITY_MAP.md`,
- target capability/eval,
- baseline metric(s),
- expected direction/magnitude where meaningful,
- regression suite,
- cost/latency/autonomy/privacy guardrail,
- observation window/cohort,
- release version/change ID.

See `OUTCOME_MODEL.md`, `BASELINE_SCORECARD.md` and `LAB_IMPROVEMENT_LEDGER.md`.

## 8. Model/prompt/tool/retrieval changes

When changing model, reasoning mode, prompt, retrieval route, search/provider strategy or tool policy:
- change one major variable at a time when causal attribution matters,
- run the same representative eval set before/after,
- compare product quality plus tokens/cost/latency/tool calls/retries,
- do not count lower cost or higher throughput as an improvement if downstream quality/outcome regresses,
- retain a rollback path.

## 9. Agentic/multi-agent entry gate

Do not introduce a new planner/critic/ranker/fuser/subagent architecture merely because it is available.

Require:
- a measured failure in the simpler workflow,
- a credible mechanism by which extra autonomy/search addresses it,
- a verifier that can distinguish better from worse candidates,
- held-out eval improvement that justifies added latency/cost/coordination/security risk.

Multi-source opportunity discovery is a plausible later candidate because the search path can be open-ended, but it must beat the current sourcing baseline before promotion.

## 10. Promotion gate

A production-changing improvement is promotable when:
- targeted eval passes,
- required regressions pass,
- environment verification passes,
- no protected evaluator/evidence was weakened,
- trace/release evidence is complete enough to attribute the result,
- autonomy/privacy/cost thresholds remain acceptable,
- rollback is available,
- product docs/capability map are synchronized when current truth changed.

## 11. Evaluation of the Lab itself

Changes sourced from AI Systems Lab must be entered in `LAB_IMPROVEMENT_LEDGER.md` with a hypothesis and later observed result. Lab advice is not considered validated simply because it was implemented.

For `JC-LAB-002`, specifically test whether re-anchoring execution around the full outcome loop results in fewer locally-complete-but-product-incomplete changes and faster evidence-backed closure of the source -> submission -> outcome chain.
