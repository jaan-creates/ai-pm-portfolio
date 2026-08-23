# Janu Job Copilot — Failure Taxonomy

**Status:** v0 taxonomy derived from current runtime/failure-learning evidence  
**Last verified:** 2026-08-23

## Purpose

`__Failure Learning` stores concrete incidents. This file provides stable failure classes so incidents, traces, metrics and regressions can be aggregated without losing the specific evidence.

A failure can have one primary class and secondary contributing classes.

## Classes

### F-SOURCE — Source/retrieval/freshness
Examples:
- public source inaccessible despite an available provider route,
- stale/missed sourcing cycle,
- wrong canonical URL,
- insufficient JD evidence,
- provider/freshness misclassification.

### F-SCHEMA — Schema/data-contract/writeback
Examples:
- wrong target headers,
- silent ignored write keys,
- producer/consumer contract mismatch,
- malformed connector payload.

### F-STATE — Lifecycle/state-transition consistency
Examples:
- CLOSED vacancy while application remains active,
- state says Tailoring with no active work,
- enum mismatch across sheets,
- control-plane display diverges from durable enforcement state.

### F-DURABLE — Queue/retry/lease/idempotency/concurrency
Examples:
- stale running jobs,
- obsolete jobs replayed,
- duplicate queue work,
- lock/test-state leakage,
- non-resumable long-running release work.

### F-ORCH — Orchestration/continuation
Examples:
- successful worker does not enqueue/advance next stage,
- recovery invokes an internal function with incompatible contract,
- system-owned work stalls in a plausible non-terminal state.

### F-MODEL — Model semantic/output failure
Examples:
- unsupported evidence mapping,
- fabricated/incorrect company/contact claim,
- malformed structured output not caught by schema,
- semantic provenance error.

Do not use this class when the real root cause is bad context, schema, tool or harness control.

### F-CONTEXT — Missing/stale/polluted context
Examples:
- wrong artifact/version fed to model,
- missing canonical evidence,
- stale legacy ResumeDocument reused after policy change.

### F-ARTIFACT — Render/document/output integrity
Examples:
- bullet loss,
- internal evidence-tag leakage,
- unresolved template placeholders,
- document lifecycle ownership bugs,
- PDF/readability/structure failure.

### F-VERIFY — Verification/eval failure
Examples:
- test fixture invalid in the real runtime,
- health check says healthy while expected outcome is missed,
- self-test proves helper presence but not E2E wiring,
- verifier false positive/false negative.

### F-RELEASE — Release/deployment/provenance
Examples:
- release identity mismatch,
- workflow not registered on default branch,
- patcher partial-install/stale-offset failure,
- delivered artifact differs from verified artifact,
- release transaction exceeds runtime.

### F-TOOL — Tool/control-surface/auth/provider
Examples:
- connector wrong sheet ID,
- authorization/installation scope missing,
- provider outage/rate limit,
- tool response too weak to verify outcome.

### F-PRIVACY — Security/privacy/permission
Examples:
- secret/PII leakage,
- over-broad write permission,
- sensitive content duplicated into telemetry,
- untrusted content influencing privileged action.

### F-COST — Budget/latency/runaway work
Examples:
- duplicate paid QA,
- unbounded maintenance before queue claim,
- repeated expensive preflight,
- retry behavior with poor expected value.

### F-HUMAN — Avoidable human relay/escalation
Examples:
- asking for a JD PDF when authorized retrieval could obtain the JD,
- repeated manual deployment/log relay that the builder control surface could automate,
- asking the user to repair system-owned state.

This class is a cross-cutting product/system failure and should retain the underlying technical root cause as a secondary class.

### F-PRODUCT — Product/policy mismatch
Examples:
- optimizing the wrong outcome,
- hard-coding Apply before fit/decision policy,
- technically correct behavior that violates user intent.

## Severity

- **SEV-0:** security/privacy/data-loss or uncontrolled high-impact external action.
- **SEV-1:** corrupts product truth, can cause wrong submission/irreversible action, or broadly blocks production.
- **SEV-2:** material workflow failure, expensive repeated work or avoidable user intervention with bounded blast radius.
- **SEV-3:** localized recoverable defect or observability gap.
- **SEV-4:** cosmetic/low-impact issue.

## Learning conversion rule

For every material failure:
1. preserve the concrete incident in `__Failure Learning`,
2. assign class/severity,
3. identify root cause and why earlier gates missed it,
4. fix the correct layer,
5. add the strongest practical prevention/eval,
6. verify targeted + regression behavior,
7. measure recurrence,
8. promote a generalized Lab lesson only if evidence supports cross-product scope.

## Recurrence metric

A failure class is not "fixed" because one incident disappeared. Track whether the same class reappears after the stated prevention control became active. Recurrence should reference release/change/eval evidence.