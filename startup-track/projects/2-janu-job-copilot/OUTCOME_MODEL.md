# Janu Job Copilot — JTBD & Outcome Model

**Status:** Product outcome contract  
**Last verified:** 2026-08-23

## 1. Whole product job to be done

Job Copilot is a personal **career operating system**, not only an application-preparation workflow.

Its whole job is to reduce low-value operational work across the Senior Product Manager job search while improving the probability of reaching genuinely qualified interviews and offers using truthful candidate evidence.

The product lifecycle is:

```text
DISCOVER
  -> VERIFY
  -> PRIORITIZE
  -> PREPARE
  -> REVIEW
  -> SUBMIT
  -> FOLLOW UP / OUTREACH
  -> OBSERVE EMPLOYER OUTCOMES
  -> PREPARE / LEARN FROM INTERVIEWS
  -> ANALYZE OFFERS / DECIDE
  -> CALIBRATE SOURCING, POSITIONING AND SKILL STRATEGY
  -> repeat
```

## 2. North-star outcome

**Maximize qualified interview conversion per unit of genuine user effort**, subject to truthfulness, quality, safety, reliability, cost and latency constraints.

This is deliberately different from optimizing:
- number of jobs sourced,
- number of applications sent,
- ATS score alone,
- resume-generation throughput,
- autonomous action count,
- green health checks.

Those may be useful intermediate signals but are not the product outcome.

Until the sample is large enough for a stable ratio, track the two components separately:
1. **Qualified interview yield** — qualified interviews attributable to pursued/submitted applications, segmented by source/role/company/domain/fit/positioning where useful.
2. **User effort** — genuine human minutes/actions required across discovery, review, submission, interview and repair, separated into necessary judgment/authority versus avoidable system relay.

## 3. Outcome ladder

### Layer A — Opportunity supply
Question: Are we finding enough real, relevant, sufficiently fresh opportunities without overwhelming the user?

Signals:
- relevant verified opportunities per period,
- source coverage and source contribution,
- duplicate/stale/closed rate,
- precision of surfaced opportunities,
- time from posting/discovery to verified intake.

### Layer B — Opportunity selection
Question: Are we spending effort on the opportunities most likely to be worth pursuing?

Signals:
- Apply/Hold/Skip distribution,
- fit/evidence quality,
- priority/desirability signal kept distinct from fit,
- later response/interview conversion by decision inputs.

Outcome data may calibrate prioritization, but delayed hiring outcomes must not be silently folded into a factual JD-fit score.

### Layer C — Application readiness
Question: Can an eligible opportunity reach a truthful, high-quality submission-ready package with minimal avoidable user work?

Signals:
- source -> Resume Review / Ready-to-Submit completion,
- QA first-pass result,
- human approval/revision rate,
- evidence-grounding/representation violations,
- latency and cost,
- avoidable blocker/manual-relay rate.

### Layer D — Submission integrity
Question: Was the real application submitted against a still-open role using the exact approved artifact, with immutable provenance?

Signals:
- Ready-to-Submit -> Submitted conversion,
- vacancy freshness at submission,
- exact Resume Version ID frozen after confirmation,
- Applied Date and canonical apply URL correctness,
- no fabricated/pre-confirmation submission state.

### Layer E — Employer engagement
Question: Do pursued applications create useful recruiter/employer engagement?

Signals:
- acknowledgements,
- recruiter replies,
- assessments,
- screening invitations,
- qualified interviews,
- rejection/offer outcomes,
- time-to-response.

Outcome events must be matched with confidence and fail closed when ambiguous.

### Layer F — Interview / offer effectiveness
Question: Are we converting engagement into later-stage interviews and strong offers, and learning why we do or do not?

Signals:
- interview-stage progression,
- recurring question/skill/failure themes,
- offer rate,
- offer quality / decision factors,
- interview-preparation usefulness.

### Layer G — Product/candidate learning
Question: Does experience improve the next search cycle?

Learning targets may include:
- which sources produce high-quality opportunities,
- which role/domain/company patterns convert better,
- which positioning/evidence gaps recur,
- which outreach strategies help,
- which interview skill gaps recur,
- which system failure classes recur.

Learning must preserve scope and provenance. It must not rewrite candidate facts or treat correlation as causal truth.

## 4. User-attention contract

User attention is scarce. The system should request human action only for:
- genuine preference/strategy judgment,
- final resume/revision review,
- exact missing evidence that authorized retrieval cannot recover,
- authenticated external submission or other privileged action that cannot safely be automated,
- interview participation/practice and final offer/negotiation decisions.

System-owned retrieval, queue repair, reconciliation, rendering, QA, retries, health inspection and routine deployment evidence are not legitimate user jobs when the system has an authorized control path.

## 5. Causal product hypothesis

The current product strategy assumes:

```text
better opportunity coverage/selection
+ better evidence-grounded application quality
+ faster execution while roles are fresh
+ lower avoidable user effort
+ disciplined follow-up/interview learning
        -> higher qualified interview yield per unit user effort
```

Each arrow is a hypothesis. Outcome analytics and experiments should test it rather than assuming every internal metric improvement raises the north star.

## 6. Product loops

### Execution loop
One opportunity progresses safely through its next legitimate state.

### Outcome loop
Submission and employer/interview events are captured and attributed back to the opportunity, source and exact submitted artifact.

### Learning loop
Repeated outcomes/corrections become scoped hypotheses, evals, strategy adjustments, procedures or executable prevention only after evidence supports promotion.

### Builder/Lab loop
Changes proposed by the AI Systems Lab are separately measured in `LAB_IMPROVEMENT_LEDGER.md`; improving internal observability or reliability counts only when it supports the product outcome or reduces risk/effort.

## 7. Architectural consequence

The application-preparation pipeline is necessary but insufficient. A complete Job Copilot needs durable entities/events for at least:
- opportunities/sources and vacancy/JD evidence,
- applications and immutable submitted-artifact provenance,
- outreach/follow-up actions,
- employer/email outcome events,
- interview sessions/outcomes,
- recurring skill/evidence gaps,
- offer/decision outcomes,
- product traces/evals/costs/releases/failures.

The current Google-stack implementation may project these across Sheets/Docs/Gmail. A future portal should normalize these contracts rather than redefine them.

## 8. Scope rule

New work is prioritized by its contribution to the whole outcome model:
1. close missing links in the end-to-end value/outcome loop,
2. make those links observable/evaluable/recoverable,
3. improve throughput/quality/autonomy using evidence,
4. migrate or add agentic complexity only when the proven product loop justifies it.
