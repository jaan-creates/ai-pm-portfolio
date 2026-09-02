# Janu Job Copilot — Pre-Change Risk Gate

**Status:** Required for material production/runtime changes

## Purpose

Convert prior incidents and executable learning into a predictive control *before* a change is promoted. The system should not merely learn after failure; it should retrieve relevant prior failure classes, infer nearby sibling risks, and choose containment/verification proportional to the blast radius.

## Required pre-change pass

For every material production/runtime change:

1. **Retrieve relevant prior learning.** Search current component/worker/failure class in `__Failure Learning`, `__Verification Ledger`, `FAILURE_TAXONOMY.md`, recent `OPERATOR_CHANGELOG.md`, and relevant regression/E2E tests.
2. **Identify exact escaped examples.** If the component failed before, include the exact prior failure shape as a held-out fixture or target-environment canary where safe.
3. **Predict sibling failure modes.** Ask what adjacent layer can invalidate the fix: scheduler, queue, state publisher, release validator, artifact writer, trace publisher, health aggregator, authorization/control surface, or human-action projection.
4. **Check enforcement location.** A policy/governance state is not containment unless the production path actually consumes and enforces it.
5. **Check publisher/consumer consistency.** Any state written by one component and interpreted by another needs a compatibility/regression check.
6. **Choose rollout containment.** Prefer one canary, bounded cohort, feature/worker quarantine, or fail-closed state when recurrence/blast radius is material.
7. **Bind verification to promoted bytes/config.** Verify the exact transformed artifact and exact deployment provenance, not a stale candidate.
8. **Define rollback/unlock criteria.** State what evidence unlocks backlog fan-out and what automatically reopens the gate.

## Predictive sibling-risk checklist

A material fix should explicitly consider these pairs when relevant:

- renderer fix → queue replay/idempotency → artifact/version registry → QA → health publisher;
- continuation fix → terminal-row scan behavior → latest-attempt semantics → duplicate enqueue → My Actions projection;
- trace fix → publication durability → fixture identity → privacy → readback consistency;
- release fix → transform/validator version drift → semantic CLI success → source hash/readback → rollback;
- state/health fix → recurring publisher overwrite → blocker precedence → post-write readback → downstream scheduler consumption;
- user-action fix → positive action creation → negative system-owned suppression → resolution idempotency.

## Required evidence record

For each material change, record:

```text
PRECHANGE_RISK_ID:
Component/change:
Prior incidents retrieved:
Relevant failure classes:
Exact escaped fixture(s):
Predicted sibling risks:
Executable enforcement point:
Targeted regression/E2E/eval:
Rollout containment/canary:
Deployment/readback proof required:
Rollback/unlock criteria:
Open uncertainty:
```

## Acceptance invariant

A material production change may not be called ready for promotion when relevant known failures were not retrieved or when a stated safety policy has no executable enforcement point. A recurrence after a claimed prevention automatically triggers a review of this gate itself, not only the local component.
