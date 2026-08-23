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