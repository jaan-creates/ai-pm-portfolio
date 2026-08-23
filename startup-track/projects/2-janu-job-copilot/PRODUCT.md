# Janu Job Copilot — Product

**Status:** Build / live pilot  
**Last verified:** 2026-08-23  
**Product ID:** P01

## Purpose

Janu Job Copilot helps one job seeker continuously discover relevant roles, verify that the opportunity is real and current, evaluate fit against canonical candidate evidence, prepare truthful application assets, and move the application to a human review/submission boundary with as little avoidable manual relay as possible.

The product is not "an LLM that writes resumes." It is a stateful AI workflow system whose value depends on reliable retrieval, durable execution, evidence-grounded reasoning, artifact verification, recovery, observability and explicit human authority boundaries.

## Primary user outcome

For an eligible job opportunity, produce a verified, evidence-grounded application package that reaches **Resume Review / Ready to Submit** without requiring the user to repair system-owned retrieval, queue, orchestration, rendering, QA or reconciliation failures.

After human approval, preserve the exact version used for submission and continue the post-submission lifecycle where supported.

## Current product loop

```text
fresh source
  -> canonical vacancy/JD evidence
  -> fit + requirement/evidence map
  -> company/contact enrichment
  -> tailored resume + application pack
  -> deterministic + model-assisted QA
  -> human resume review
  -> authenticated external submission boundary
  -> submitted-state/version freeze
  -> later outcome/outreach/interview lifecycle
```

## In scope now

- job-source intake and freshness monitoring,
- canonical job/vacancy retrieval and provenance,
- JD parsing and completeness checks,
- evidence-grounded fit scoring and gap mapping,
- company and public-contact enrichment,
- evidence-grounded resume/application-pack generation,
- artifact QA and human review,
- durable queue/retry/recovery behavior,
- system health, failure learning and regression controls,
- controlled GitHub -> Apps Script deployment,
- observability/evals/learning instrumentation defined by the AI Systems Lab baseline.

## Human-owned boundaries

Human judgment/authority remains appropriate for:
- whether a role is personally worth pursuing when preference/strategy is irreducible,
- final review/approval of application material,
- authenticated submission/CAPTCHA/OTP or equivalent external-account actions unless a separately authorized safe tool exists,
- material product-scope decisions and permission expansion.

System defects, retrieval failures, stale state, queue repair, QA repair and tracker reconciliation are not valid reasons to ask the user to act unless the required external evidence is genuinely inaccessible.

## Explicit non-goals

- pretending every AI-assisted worker is an autonomous agent,
- multi-agent architecture without measured need,
- inventing candidate evidence, employer facts or contacts,
- storing secrets or sensitive candidate content in generic telemetry,
- treating a generated success statement as proof of environment success,
- autonomously submitting applications through privileged external accounts without an explicit authority contract.

## Success dimensions

1. **Outcome:** eligible applications progress to review/submission.
2. **Quality:** generated assets remain evidence-grounded and pass QA/human review.
3. **Reliability:** retries/recovery work and terminal system-owned failures are rare.
4. **Autonomy:** avoidable human blockers/manual relay approach zero.
5. **Observability:** material runs can be reconstructed from trace/state/audit evidence.
6. **Cost/latency:** useful outcomes stay within configured limits.
7. **Learning:** recurring failures become regressions/procedures/guardrails and recurrence declines.
8. **Release integrity:** deployed behavior is traceable to code/release/eval evidence and user-visible changes receive an explicit release-note decision.

## Sources of truth

Priority when sources disagree:
1. verified live environment/state and deployed runtime evidence,
2. executable code/tests/deployment evidence in this repository,
3. `CURRENT_STATE.md` and `SYSTEM_MAP.md`,
4. Master Product & Engineering Specification,
5. reader-facing `BUILD_NOTES.md`,
6. chat summaries or historical snapshots.

No lower layer may override verified environment truth.