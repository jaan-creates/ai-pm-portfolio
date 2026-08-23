# Janu Job Copilot — AI Systems Lab Improvement Ledger

**Status:** Active experiment/attribution ledger  
**Created:** 2026-08-23

## Purpose

Make the parent AI Systems Lab accountable for whether its recommendations improve Job Copilot.

A Lab suggestion is not considered validated because it sounds good or was implemented. Each material Lab-sourced intervention should state a hypothesis, baseline, change, verifier/metrics and observed result. Later decide **Keep / Revise / Reject / Insufficient evidence**.

This is not a claim of perfect causal inference. It is a disciplined product experiment record that reduces retrospective storytelling.

## Entry template

### JC-LAB-XXX — [intervention]

**Date proposed:**  
**Lab source/change:**  
**Product problem:**  
**Hypothesis:**  
**Baseline:**  
**Change introduced:**  
**Target metrics/evals:**  
**Guardrails:**  
**Release/change IDs:**  
**Observation window:**  
**Observed result:** Pending / ...  
**Decision:** Keep / Revise / Reject / Insufficient evidence  
**Reusable Lab lesson:** Candidate / Promoted / Rejected / None

---

## JC-LAB-001 — Product operating baseline and iteration evidence gate

**Date proposed:** 2026-08-23

**Lab source/change:** AI Systems Lab Module 1 + Promotion Sweep; candidate parent operating-baseline v0.5.

**Product problem:**
Job Copilot has strong local mechanisms (queue, audit, health, regression and Failure Learning), but before this branch it lacked the Lab's Stage-1/2/3 product artifacts and a single closeout gate tying runtime evidence, evals, metrics, release notes, build notes, memory and current-state maintenance together.

**Hypothesis:**
Making product truth, tracing/eval contracts and iteration closeout explicit will reduce missed release/provenance/learning work, make system-owned failures easier to diagnose, and let future improvements be compared against a stable baseline without adding runtime complexity by itself.

**Baseline:**
- no product-local `PRODUCT.md`, `CURRENT_STATE.md`, `SYSTEM_MAP.md`, `AUTONOMY_CONTRACT.md` or `BUILD_NOTES.md`,
- no canonical `TRACE_SCHEMA.md`, `EVAL_PLAN.md`, `BASELINE_SCORECARD.md`, `FAILURE_TAXONOMY.md` or `MEMORY_POLICY.md`,
- partial observability across Queue/Audit/Worker State/Health/Regression/Failure Learning,
- recent Failure Learning includes repeated release/runtime/user-relay classes,
- exact final patch-transformed production source is not represented by one checked-in canonical file/hash manifest.

**Change introduced:**
- create the product operating artifacts above,
- add `ITERATION_EVIDENCE_GATE.md`,
- add this ledger,
- add CI validation of the structural baseline,
- separate documentation/governance changes from automatic production deployment paths,
- make runtime trace implementation and deployment-source manifest the next measured infrastructure work.

**Target metrics/evals:**
Over the next three material product releases/iterations:
1. 100% have explicit targeted eval + regression + environment verification decision.
2. 100% have release-note/build-note/current-state/memory decisions recorded where applicable.
3. No documentation-only merge triggers an Apps Script production deployment.
4. New instrumented worker executions reach 100% trace identity/terminal-outcome coverage after trace v0 ships.
5. Avoidable user relay caused by missing operational bookkeeping decreases; every new case is classified.
6. At least one fresh held-out source completes the golden path with complete trace evidence.

**Guardrails:**
- no new multi-agent/vector-memory infrastructure without an eval-supported need,
- no sensitive raw traces copied to the parent Lab,
- production-changing merge/deploy remains approval-gated while recent release-control failures remain active evidence.

**Release/change IDs:** This baseline branch/PR; runtime release unchanged until separately promoted.

**Observation window:** Next three material production iterations plus first trace-v0 golden-path run.

**Observed result:** Pending.

**Decision:** Pilot.

**Reusable Lab lesson:** Candidate; promote only after the product evidence above shows useful signal without excessive documentation noise.

---

## JC-LAB-002 — Re-anchor execution to the whole career JTBD

**Date proposed:** 2026-08-23

**Lab source/change:** Outcome-alignment review triggered by comparing the live Master Specification with the newly created product operating baseline.

**Product problem:**
The recent Lab baseline correctly strengthened tracing, evals, release discipline and memory boundaries, but the first Git `PRODUCT.md` framed the primary user outcome mainly as reaching Resume Review / Ready to Submit. The authoritative product vision is broader: discovery through submission, employer engagement, interview learning and offers, optimized for qualified interview conversion per unit user effort.

This creates a strategic failure mode: Job Copilot could become extremely reliable at preparing applications while the downstream outcome loop remains incomplete, leaving no trustworthy way to learn whether sourcing, prioritization, positioning or interview strategy actually improve the user's job search.

**Hypothesis:**
If the product architecture and execution roadmap are explicitly anchored to the full JTBD/outcome ladder, then the next iterations will close missing value-loop dependencies before lower-priority infrastructure/UI/agent complexity, producing earlier end-to-end evidence and a usable outcome-learning dataset.

**Baseline:**
- application-preparation components are materially more mature than submission/outcome/interview-learning components,
- no current accepted fresh source -> real submission -> employer outcome -> interview learning golden path,
- no normalized north-star metric or lag-aware outcome cohort,
- helper/self-test completion can visually overstate whole-product completion,
- portal/memory/agent discussions are possible before the feedback loop they would serve is complete.

**Change introduced:**
- add `OUTCOME_MODEL.md`,
- add `PRODUCT_CAPABILITY_MAP.md` with PROVEN/PARTIAL/CONTRACT-ONLY/NOT-BUILT/HUMAN-BOUNDARY status,
- add `EXECUTION_ROADMAP.md` prioritizing P0 application/submission closure -> P1 employer outcome -> P2 outcome learning -> later expansion/portal,
- re-anchor `PRODUCT.md`, `SYSTEM_MAP.md`, `CURRENT_STATE.md`, `EVAL_PLAN.md`, `BASELINE_SCORECARD.md`, autonomy/memory/monitoring contracts to the whole lifecycle,
- identify the next bounded runtime package as `TRACE-GOLDEN-01`: minimal trace v0 + fresh URL intake through Resume Review, then continue the same accepted journey toward submission/outcome.

**Target metrics/evals:**
1. `PRODUCT_CAPABILITY_MAP.md` remains synchronized with environment proof rather than helper presence.
2. Next runtime iteration advances at least one P0 whole-journey acceptance gate; it does not add unrelated architecture before a blocking dependency is closed.
3. One fresh source reaches Resume Review/Ready with trace v0 and no avoidable user relay.
4. One genuine submission records exact immutable provenance.
5. P1 then produces at least one attributable employer outcome event and exercises fail-closed ambiguous matching.
6. Once a cohort exists, the private scorecard can calculate source -> submission -> response/interview funnel plus genuine user effort.
7. No portal migration, vector memory or multi-agent architecture is promoted without an eval-supported dependency/value case.

**Guardrails:**
- do not optimize application volume at the expense of relevance/quality,
- keep factual JD Fit separate from learned opportunity priority/desirability,
- do not treat small hiring-outcome correlations as causal rules,
- no private mailbox/application evidence copied to the public repo,
- authenticated external submission remains a human authority boundary until separately authorized.

**Release/change IDs:** Baseline branch/PR architecture update; no runtime release from this intervention by itself.

**Observation window:** Through completion of P0 and first accepted P1 employer-outcome event; review again after enough lag-adjusted submissions for a meaningful funnel cohort.

**Observed result:** Pending.

**Decision:** Pilot.

**Reusable Lab lesson:** Candidate. Potential parent lesson: a self-improving product must close and instrument the user outcome loop before optimizing the improvement machinery around an intermediate proxy. Promote only after Job Copilot evidence and at least one other product test portability.
