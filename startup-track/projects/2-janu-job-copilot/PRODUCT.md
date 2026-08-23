# Janu Job Copilot — Product

**Status:** Build / live pilot  
**Last verified:** 2026-08-23  
**Product ID:** P01

## Purpose

Janu Job Copilot is a high-precision, low-intervention personal **career operating system** for one Senior Product Manager job search.

It should own repetitive operational work from opportunity discovery through application preparation, submission-state capture, outreach/follow-up, employer-outcome monitoring, interview handoff/learning and offer analysis—while keeping personal strategy, final application review, privileged external submission and final career decisions under human authority.

The product is not "an LLM that writes resumes." It is a stateful AI workflow system whose value depends on reliable retrieval, durable execution, evidence-grounded reasoning, artifact verification, recovery, observability, outcome attribution and explicit human authority boundaries.

## Primary user outcome

**Maximize qualified interview conversion per unit of genuine user effort**, subject to truthfulness, safety, quality, reliability, cost and latency constraints.

Because qualified-interview outcomes are delayed and currently sparse, measure the two components separately until a stable north-star cohort exists:
- qualified interview / employer-engagement yield from pursued/submitted opportunities,
- genuine user effort minutes/actions, separated into necessary judgment/authority versus avoidable system relay.

Reaching **Resume Review / Ready to Submit** is a critical intermediate product outcome, not the final north star.

See `OUTCOME_MODEL.md` for the full JTBD/outcome ladder.

## Current product loop

```text
relevant opportunity discovery / user URL
  -> canonicalize + dedupe + verify vacancy/JD
  -> factual fit + evidence map
  -> Apply/Hold/Skip / opportunity prioritization
  -> company/contact enrichment where useful
  -> evidence-grounded resume + application pack
  -> deterministic + model-assisted QA
  -> human resume review / immutable revision
  -> Ready to Submit + fresh vacancy gate
  -> authenticated external submission boundary
  -> Submitted + exact artifact provenance
  -> outreach / follow-up
  -> Gmail/employer outcome events
  -> Interview Room / interview learning
  -> offer / final outcome
  -> analytics + calibrated sourcing/positioning/skill hypotheses
  -> repeat
```

## In scope now

The **whole product scope** includes:
- relevant opportunity discovery and source-quality monitoring,
- user URL/gated-source intake into one canonical pipeline,
- canonicalization, dedupe, vacancy/JD retrieval and provenance,
- JD parsing, evidence-grounded fit scoring and gap mapping,
- opportunity decision/prioritization kept distinct from factual fit,
- company and public-contact enrichment when useful,
- evidence-grounded resume/application-pack generation,
- artifact QA and human review/revision,
- Ready-to-Submit and authenticated human submission boundary,
- immutable submitted-artifact/date provenance,
- post-submission outreach/follow-up,
- Gmail/employer outcome classification and matching,
- Interview Room handoff and structured interview learning,
- recurring skill/evidence-gap learning,
- outcome analytics/calibration and offer decision support,
- durable queue/retry/recovery behavior,
- system health, failure learning, regressions, tracing/evals/release evidence,
- controlled deployment and evidence-driven product/Lab improvement.

Not every item above is operational today. `PRODUCT_CAPABILITY_MAP.md` is the explicit live maturity map; helper/self-test presence does not imply completion.

## Human-owned boundaries

Human judgment/authority remains appropriate for:
- strategic/personal Apply/Hold/Skip judgment when preference cannot be reliably derived from explicit policy,
- final review/approval of application material,
- exact missing personal evidence that authorized retrieval cannot recover,
- authenticated submission/CAPTCHA/OTP or equivalent external-account actions unless a separately authorized safe tool exists,
- interview participation/practice and irreducible qualitative reflection,
- final offer/negotiation/career decisions,
- material product-scope and permission expansion.

System defects, retrieval failures, stale state, queue repair, QA repair, tracker reconciliation, routine monitoring and deployment inspection are not valid reasons to ask the user to act when the required control path exists.

## Explicit non-goals

- optimizing raw application volume as the product goal,
- treating ATS/JD-fit score as desirability or interview probability,
- pretending every AI-assisted worker is an autonomous agent,
- multi-agent architecture without measured need,
- inventing candidate evidence, employer facts or contacts,
- mass-spam outreach,
- storing secrets or sensitive candidate/email content in generic/public telemetry,
- treating a generated success statement or helper self-test as proof of environment/E2E success,
- autonomously submitting through privileged external accounts without an explicit safe authority contract,
- bypassing CAPTCHA/OTP/platform protections,
- portal migration before the current semantic/product behavior is proven enough to migrate.

## Success dimensions

1. **North-star outcome:** qualified interview conversion per unit genuine user effort.
2. **Opportunity supply:** enough fresh relevant roles with low noise/duplication/closed-role waste.
3. **Selection:** effort concentrated on worthwhile opportunities; fit remains factual and distinct from desirability.
4. **Application quality:** generated assets are truthful, representative, readable and pass QA/human review.
5. **Execution reliability:** retries/recovery work; stalls, duplicate work and terminal system failures decline.
6. **Autonomy:** avoidable human blockers/manual relay approach zero while genuine judgment remains human-owned.
7. **Submission integrity:** real submission is linked to fresh vacancy evidence and exact immutable approved artifact.
8. **Outcome observability:** employer/outreach/interview/offer events are reliably attributed and fail closed when ambiguous.
9. **Learning:** recurring product/candidate/market/interview patterns become scoped experiments, procedures or executable prevention and recurrence declines.
10. **Cost/latency:** time/cost per useful outcome remains within configured constraints.
11. **Release integrity:** deployed behavior is attributable to source/config/model/eval evidence and recoverable.

## Sources of truth

Different truth types have different canonical surfaces; do not flatten them into one ranking.

### Candidate/factual identity
Approved canonical candidate evidence is authoritative. Generated resume/application text may never override it.

### Product intent / policy
The current Master Product & Engineering Specification + append-only decision/change records define intended product behavior unless explicitly superseded by a newer approved product decision.

### Executable implementation
The product repository plus the verified deployed Apps Script/runtime source/release evidence define what code/config is actually executable. A helper contract in Git is not proof it is wired or deployed.

### Runtime/product state
The private live Tracker, Drive/Docs artifacts, Gmail/outcome events and external environment are authoritative for what actually happened. Environment truth beats generated success claims.

### Derived documentation
`CURRENT_STATE.md`, `SYSTEM_MAP.md`, `PRODUCT_CAPABILITY_MAP.md`, `BASELINE_SCORECARD.md`, `BUILD_NOTES.md` and release notes summarize the canonical sources above; they must be corrected if evidence differs.

### Working context
Chat summaries/history are not canonical product truth.

## Current priority

Do not shift execution focus to portal migration. First prove the full current-stack value loop:

1. fresh source -> Resume Review / Ready to Submit,
2. real submission -> immutable provenance,
3. employer response/outcome monitoring,
4. interview/outcome learning + normalized product metrics,
5. use those outcomes to improve sourcing/prioritization/candidate strategy.

See `EXECUTION_ROADMAP.md` for dependencies and acceptance gates.
