# Janu Job Copilot — Rollback & Recovery Policy

**Status:** Baseline; one durable-source gap remains  
**Last verified:** 2026-08-23

## Principle

Every production-changing iteration must identify how to stop harm, restore the previous known-good state or safely recover partial work before the change is promoted.

## 1. Code / deployment rollback

### Current architecture
Production Apps Script is built by:

```text
live production source
+ repository patch scripts
+ deployment workflow
-> transformed source
-> clasp push
```

The baseline branch adds:
- an ephemeral pre-deploy source backup inside the workflow,
- a privacy-safe SHA-256 manifest of the exact transformed source,
- post-push pull/hash verification,
- automatic restoration of the pre-deploy source inside the same workflow if the post-push source hash differs.

### Remaining gap
A durable private copy of the complete production source is not yet stored in a canonical private versioned repository by this public project. Therefore recovery **after the workflow has ended** still depends on reconstructing a prior release or Google Apps Script's own history/control surface.

Recommended next infrastructure step: establish a private runtime-source/version store and give the deployment workflow narrowly scoped write/read authorization. Do not store full private runtime source as a public GitHub Actions artifact merely for convenience.

## 2. Product-state rollback

Prefer compensating/idempotent state repair over deleting historical evidence.

- preserve failed/cancelled queue rows,
- cancel/obsolete unsafe future work rather than erasing history,
- use explicit migration/version markers,
- restore pointers/state only after verifying the target artifact exists,
- never roll back Submitted provenance by mutating the immutable resume version actually used.

## 3. Artifact rollback

Generated drafts may be replaced with a newer version while preserving the old registry/history. Submitted artifacts remain immutable. A bad active artifact should be quarantined/failed and superseded rather than silently overwritten.

## 4. Schema migration recovery

Before a material tracker/schema migration:
- inspect exact headers/ranges,
- prefer additive columns/sheets,
- make migration idempotent,
- record version/migration identity,
- read back important writes,
- keep compatibility or a deterministic repair path for historical rows where needed.

## 5. Model/prompt/tool rollback

Bind consequential model/prompt/retrieval/tool changes to a version/config identity. Preserve the prior configuration long enough to re-run the same representative eval set and revert if quality/reliability/cost guardrails regress.

## 6. Circuit/containment recovery

When runtime or release circuits open:
- prevent new heavy/paid work,
- allow only bounded diagnostics/health/recovery operations defined by policy,
- require the failing invariant/eval to pass before re-enable,
- verify no unsafe queue/state mutations accumulated while contained.

## 7. Rollback evidence in the Iteration Gate

Every material production change should state:
- previous known-good release/config,
- exact rollback action,
- what state/artifacts cannot be safely reversed,
- verification after rollback,
- whether rollback itself was exercised or only designed.

## 8. Never

- delete failure evidence to make the system appear healthy,
- restore code without checking schema/state compatibility,
- roll back a submission record or immutable applied resume without real-world evidence,
- weaken a regression/evaluator as a rollback shortcut,
- copy private full runtime source into a public repo/artifact to solve versioning.