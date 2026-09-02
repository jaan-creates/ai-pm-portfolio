# Janu Job Copilot — Iteration Evidence Gate

**Status:** Pilot gate for every material product iteration  
**Last verified:** 2026-08-24

## Purpose

Prevent a change from being called "done" merely because code was written or one test passed, and prevent known learning from being applied only *after* the next production failure.

This gate is evaluated for every **material product iteration / production-changing PR / meaningful reliability fix**. It is not mandatory bureaucracy for every chat message, typo or refactor. Chat-level work uses the AI Systems Lab Promotion Sweep; product-level material changes use this gate.

Before implementation/promotion, material runtime changes must also pass `PRECHANGE_RISK_GATE.md`: retrieve relevant prior failures/executable memory, identify exact escaped fixtures, predict sibling failure modes, verify the enforcement point, and choose rollout containment.

`No update required` is a valid answer for an item, but the decision should be explicit for material changes.

## Required closeout decisions

| Gate | Required question | Evidence/destination when yes |
|---|---|---|
| Pre-change risk retrieval | Which prior failures, procedures and executable memories were retrieved before the change, and which sibling risks were predicted? | `PRECHANGE_RISK_GATE.md` record / linked failure IDs |
| Environment verification | Did the intended behavior actually occur in the target environment? | read-back, live acceptance, artifact/state evidence |
| Trace | Did runtime behavior execute/change? Is the run reconstructable? | trace/queue/worker/model/tool/verifier references |
| Audit | Did important product/business state mutate? | `Audit Log` or equivalent durable audit event |
| Eval/regression | What proves the target issue is fixed without unacceptable regressions? | targeted eval + regression results |
| Metrics | Which scorecard metric should move, and what is the baseline/cohort? | `BASELINE_SCORECARD.md` / metrics snapshot |
| Failure learning | Was an unexpected material defect found? | `__Failure Learning` + failure class/prevention |
| Release provenance | Does runtime behavior/config change? Which release/commit/suite produced it? | deployment/release evidence |
| User/customer release note | Did the user gain/lose/change a meaningful capability or behavior? | `RELEASE_NOTES.md` decision/content |
| Build Notes | Is this a meaningful product milestone/architecture/reliability learning? | `BUILD_NOTES.md` |
| Current state/system map | Did verified current truth or architecture change? | update `CURRENT_STATE.md` / `SYSTEM_MAP.md` |
| Autonomy/security | Did permissions, stopping, human boundary or sensitive-data handling change? | `AUTONOMY_CONTRACT.md` / security policy |
| Memory/learning | Did this produce durable knowledge useful later? | `MEMORY_POLICY.md` destination or executable prevention |
| Lab improvement | Did the parent AI Systems Lab cause/suggest this change? | `LAB_IMPROVEMENT_LEDGER.md` experiment/update |
| Rollback/recovery | Can the change be reversed/recovered if the evidence is wrong? | branch/release rollback reference/procedure |
| Source-of-truth sync | Do product spec/docs/runtime now agree? | reconcile contradictions or explicitly mark stale source |

## Material-change closeout template

Use this in the PR description, change record or release evidence:

```text
CHANGE_ID:
Goal/hypothesis:
Affected capability:
Lab intervention ID (if any):

PRECHANGE LEARNING RETRIEVED:
PREDICTED SIBLING RISKS:
VERIFIED ENVIRONMENT RESULT:
TRACE EVIDENCE:
AUDIT DECISION: required / not required — why
TARGETED EVAL:
REGRESSION:
METRIC/BASELINE:
FAILURE LEARNING: created / updated / none
RELEASE PROVENANCE:
USER RELEASE NOTE: required / not required — why
BUILD NOTES: required / not required — why
CURRENT STATE/SYSTEM MAP: updated / unchanged
AUTONOMY/PRIVACY: changed / unchanged
MEMORY/EXECUTABLE LEARNING: promoted / candidate / none
ROLLBACK/RECOVERY:
OPEN RISKS:
FINAL DECISION: promote / revise / reject / hold
```

## Release-note rule

A **user/customer release note** describes changed usable behavior, reliability, limitation or workflow that matters to the user. User-facing release notes live in `RELEASE_NOTES.md`. Do not publish internal refactors as customer value, and do not label source-only work as released behavior before target-environment proof.

A **BUILD_NOTES** entry is broader and educational: architecture, tradeoffs, verification and learning. One change may require one, both or neither.

## Audit rule

Audit logs are for important durable state mutations, not every debug detail. Traces contain execution detail; audit contains accountable product/business changes.

## Memory rule

Never promote raw trace content automatically. First classify whether the durable result is:
- current state,
- episodic incident,
- semantic knowledge,
- procedure,
- decision/rationale,
- executable test/eval/guardrail,
- or no durable memory.

The learning loop is incomplete if the memory/control is stored but not retrieved when the same component/failure class is changed again. Material changes therefore require pre-change retrieval and a recorded sibling-risk scan.

## Completion invariant

A production change is not considered fully closed while any required gate above is unknown. Unknown may be acceptable for an experiment only when explicitly documented and the rollout is contained enough to make the uncertainty safe.

A known deterministic recurrence is additionally not closed until the exact escaped example and target-environment canary pass under the promoted release, and the prevention survives the adjacent publisher/scheduler/consumer paths identified by the pre-change risk gate.
