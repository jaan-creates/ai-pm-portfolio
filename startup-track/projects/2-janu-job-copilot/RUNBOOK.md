# Janu Job Copilot — Runbook

**Status:** Baseline operational procedure  
**Last verified:** 2026-08-23

## Operating principle

Diagnose from environment evidence outward. Do not start by changing prompts or asking the user to repair state.

## 1. Material product iteration

Use `skills/product-iteration/SKILL.md` from the parent AI Systems Lab or the product's `ITERATION_EVIDENCE_GATE.md`.

Sequence:
1. verify current product/runtime state and exact control surfaces,
2. state problem/hypothesis and baseline,
3. identify affected layer(s),
4. define trace/eval/environment evidence before mutation,
5. implement on a branch/reversible surface,
6. run targeted eval + relevant regressions,
7. verify target environment,
8. run the Iteration Evidence Gate,
9. promote/hold/revise/reject,
10. monitor recurrence/outcome.

## 2. Runtime incident

### Detect
Use private System Health, queue/worker state, regression results, failure learning and relevant application/artifact state.

### Contain
- stop/circuit only the affected work when possible,
- prevent duplicate/obsolete paid downstream jobs,
- do not erase failed queue/trace evidence,
- preserve user-facing truth and submitted artifacts.

### Diagnose
Classify primary and secondary failure classes using `FAILURE_TAXONOMY.md`:
source, schema, state, durable execution, orchestration, context, model, artifact, verifier, release, tool, privacy, cost, human relay or product policy.

### Repair
Fix the root layer. Prefer additive/idempotent migration or a branch change with targeted fixture.

### Verify
- targeted failure case,
- relevant regression suite,
- actual target-state read-back,
- no new privacy/permission/cost violation,
- rerun/idempotency when relevant.

### Learn
Record a private failure-learning incident when material. Add strongest practical prevention: regression/eval/schema check/procedure/guardrail. Monitor recurrence.

## 3. Stalled application/workflow

For a non-terminal system-owned state with no progress:
1. inspect current application state privately,
2. inspect active/terminal queue work for the entity,
3. inspect vacancy/JD preconditions and blockers,
4. inspect last successful/failed worker evidence,
5. reconcile idempotently using the canonical orchestrator/queue path,
6. never create a user blocker unless the `AUTONOMY_CONTRACT` human-escalation test passes,
7. record a stall/continuation failure if the harness should have recovered automatically.

## 4. Release procedure

1. prepare branch/draft PR,
2. run governance CI and privacy checks,
3. run runtime script syntax/release validators,
4. state release/change ID and rollback target,
5. require explicit approval while current autonomy contract keeps production merges gated,
6. merge only when gates pass,
7. deployment workflow pulls live source, applies patches, validates and creates transformed-source manifest/hash,
8. push production source,
9. verify post-push transformed-source hash,
10. inspect health/self-test/live acceptance evidence,
11. record user release-note/build-note/current-state/failure-learning decisions,
12. monitor for regression/recurrence.

## 5. Documentation-only change

Use the governance workflow. It must **not** trigger Apps Script production deployment. If it does, treat as a release-control defect.

## 6. Private evidence handling

Never paste full private tracker rows, candidate content, resume/JD bodies, private email text or secrets into the public repository. Use opaque IDs/hashes/privacy-safe summaries. If detailed diagnosis needs content, work in the authorized private tracker/Drive context.

## 7. When user intervention is valid

Ask the user only when:
- personal/strategic judgment is genuinely required,
- authenticated external action/OTP/CAPTCHA is required,
- a permission/secret/integration must be granted by the account owner,
- safe automatic recovery is unavailable.

Repeated deployment/log/data relay that the builder could automate is a system failure to investigate, not an acceptable routine.

## 8. Escalation / stop

Fail closed when:
- production release/regression circuit is open,
- state truth is ambiguous enough to risk corruption,
- vacancy is verified terminal/closed,
- budget/retry/runtime limit is exhausted,
- privileged authority exceeds the autonomy contract,
- privacy/security boundary would be violated.

## 9. Closeout

A material incident/change is not fully closed until required environment, trace, eval/regression, release, learning, documentation and rollback decisions are explicit. `No update required` is valid when justified.