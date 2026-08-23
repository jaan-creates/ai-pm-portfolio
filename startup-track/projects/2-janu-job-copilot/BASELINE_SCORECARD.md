# Janu Job Copilot — Baseline Scorecard

**Baseline date:** 2026-08-23  
**Status:** v0 observational baseline; normalized trace/outcome metrics not yet available

## Public/private scorecard rule

This repository is public. Metric definitions, targets and non-sensitive conclusions belong here. Exact live user/application counts, company/application identities, candidate/mailbox content and detailed private tracker values remain in the authorized private tracker/telemetry surface.

A public comparison may publish privacy-safe aggregate deltas later when useful, but the authoritative numerator/denominator/evidence must remain traceable to the private source.

## Why this baseline exists

The AI Systems Lab must be able to show whether a proposed improvement actually helps the **whole Job Copilot JTBD**, not merely whether an internal worker became more sophisticated.

The north star is qualified interview conversion per unit genuine user effort. That north star is not yet cleanly measurable because the current product has not closed normalized submission -> employer outcome -> interview attribution and end-to-end trace correlation. This absence is itself a baseline finding.

Do not retroactively rewrite this baseline to make later changes look better. Add dated comparison sections or a new scorecard snapshot.

## 1. Current live conclusion

A bounded private tracker inspection on 2026-08-23 showed:
- multiple active and terminal application lifecycle states,
- at least one current system-owned worker failure,
- major control-plane components reporting healthy/closed at the time of inspection,
- a recent sourcing-health correction after an expected cadence was missed despite the prior generic health signal,
- rich operational/failure evidence but no normalized trace/outcome cohort that supports a full product-funnel claim.

Exact application distributions, company/application identities and private health timestamps are intentionally omitted from this public repository.

The mixed historical/live state is **not** a clean success-rate cohort because rows and queue history span multiple releases, migrations, retries and containment events.

## 2. Baseline by outcome layer

| Outcome layer | Baseline | Confidence |
|---|---|---|
| North star: qualified interviews per unit genuine user effort | Not currently measurable end to end | High |
| Opportunity supply quality/coverage | Daily sourcing exists; cadence has live evidence, but normalized coverage/precision/source contribution is not established | Medium |
| Fresh source -> correct application decision | Not yet cleanly accepted from a held-out fresh URL under the complete policy | High |
| Fresh source -> Resume Review/Ready-to-Submit | Not yet cleanly demonstrated under the complete current contract | High |
| Ready-to-Submit -> real Submitted with exact immutable artifact | Not yet accepted as one current golden path | High |
| Submitted -> employer outcome event | Gmail helper/contracts exist but actual normalized monitor/matcher is not yet accepted | High |
| Employer response -> Interview Room / interview learning | Product surfaces/design exist; complete automation/outcome-learning path is not proven | High |
| Outcome -> sourcing/priority/positioning calibration | Not closed; attributable normalized outcome dataset is missing | High |
| Recurring skill/interview-gap learning | Partial conceptual/state support; no accepted outcome-learning loop | Medium/High |
| Offer analysis | Intended product scope, not operationally proven | High |

## 3. Baseline by AI-system dimension

| Dimension | Baseline | Confidence |
|---|---|---|
| Closed vacancy stops downstream work | Historical lifecycle-propagation failure existed; prevention work needs ongoing regression/live evidence | High |
| Avoidable user relay | Historical Failure Learning contains repeated user-required release/repair cycles; no normalized rate yet | High qualitative / low quantitative |
| Terminal worker reliability | Queue has rich history but spans many releases/replays/cancellations; no clean cohort metric yet | High qualitative / low quantitative |
| Autonomous recovery rate | Not normalized across failure classes yet | Low |
| Duplicate/idempotency violations | Historical failures exist; current rate not normalized | Medium |
| Resume QA first-pass pass rate | Not cleanly cohortized by release | Low |
| Human resume approval/revision rate | Insufficient normalized sample | Low |
| End-to-end latency | Not reconstructable reliably across the full journey with current telemetry | Low |
| Model/retrieval cost per completed application/interview | Cost ledger exists, but end-to-end outcome attribution is not canonical | Low/Medium |
| Trace completeness | Partial: Queue/Audit/Worker State/Health/Regression/Failure Learning exist; no stable trace/span linkage | High |
| Failure recurrence after prevention | Many regressions exist, but no canonical recurrence metric yet | Medium |
| Release provenance | Release/version/suite checks exist; exact final transformed source hash is being added by this baseline branch | High |
| Customer/user-facing release-note decision coverage | No canonical gate before this baseline | High |
| Lab-improvement attribution | JC-LAB-001 established the first product-local intervention contract; observed benefit still pending | High |

## 4. Initial acceptance targets

These are engineering/product acceptance targets, not permanent SLOs.

### P0 — trustworthy application/submission path
- 100% of new instrumented golden-path worker executions have trace/release identity and terminal outcome evidence.
- 0 system-owned failures create a user blocker when an authorized automatic recovery path exists.
- 0 verified CLOSED vacancies continue expensive downstream work.
- 0 duplicate Application/JD/resume/action/queue artifacts in the clean fresh-source fixture.
- one real fresh URL reaches Resume Review/Ready-to-Submit under the current complete policy.
- Revision Needed creates a new immutable version and returns to QA/review.
- one genuine external submission produces Submitted/Applied Date/exact immutable Resume Version only after confirmation.

### P1 — employer outcome loop
- mailbox/outcome classifier covers the required event taxonomy on representative fixtures.
- ambiguous application matching creates no silent state mutation.
- deduped real outcome events are attributable to the correct submission/application.
- follow-up/outreach actions are suppressed when a response/outcome makes them obsolete.
- verified interview engagement creates/updates the correct Interview Room without manual tracker relay.

### Operating-system governance
- 100% of production-changing releases have targeted eval + required regression + rollback + explicit release-note/build-note/current-state decision.
- 100% of AI Systems Lab-sourced material product changes have a `LAB_IMPROVEMENT_LEDGER` entry and later Keep/Revise/Reject/Insufficient-evidence outcome.
- 0 private live application/candidate/mailbox content is copied into public governance/telemetry artifacts when an opaque reference or private source is sufficient.

## 5. Metrics to activate as trace/outcome v0 lands

### North star
- qualified interviews per genuine user hour/minute over a lag-aware cohort,
- paired view: qualified interview yield + user effort rather than one noisy ratio when sample is small.

### Opportunity supply
- verified relevant opportunities per period,
- source coverage/contribution,
- duplicate/closed/noise rate,
- posting age at intake,
- precision of surfaced opportunities / user discard burden.

### Funnel / outcome
- relevant source -> Apply/Hold/Skip,
- Apply -> Resume Review,
- Resume Review -> Ready to Submit,
- Ready -> Submitted,
- Submitted -> response,
- response -> screen/qualified interview,
- interview -> later stage/offer.

### User effort / autonomy
- human minutes/actions per pursued/submitted application,
- avoidable system-relay actions,
- genuine judgment/authority actions,
- autonomous recovery rate,
- time waiting on system vs genuine human boundary.

### Quality
- QA first-pass pass rate,
- human Approve / Revision Needed / Withdraw distribution,
- evidence-grounding/representation violations,
- revision reasons/count.

### Reliability
- terminal system failure rate by worker/release/failure class,
- retries per successful completion,
- stalled non-terminal state rate,
- duplicate/idempotency violation rate,
- recurrence of supposedly prevented failure classes.

### Cost/latency
- discovery/intake -> Resume Review latency,
- Ready -> Submitted delay separated into human boundary vs system delay,
- model/tool latency by stage,
- cost per completed prep/submission/qualified interview,
- cost of failed/replayed work.

### Outcome learning
- response/interview rate by source/role family/domain/posting age/fit band,
- later conversion by representation/positioning/revision signals,
- outreach/referral outcome association,
- recurring interview/skill-gap patterns,
- learning intervention result where tested.

Do not present small observational differences as causal effects.

### Observability/privacy/release
- trace completeness/correlation rate,
- outcome-event attribution completeness,
- telemetry privacy-policy violation rate,
- spans missing release/model/tool attribution,
- release evidence completeness.

### Lab learning
- Lab intervention Keep/Revise/Reject/Insufficient-evidence distribution,
- product outcome/reliability movement attributable enough to justify retaining the Lab procedure.

## 6. Comparison rule

Every future claim such as "Job Copilot is more reliable/autonomous/better at sourcing/more likely to produce interviews" must name:
- private authoritative baseline/cohort,
- release/change ID,
- metric definition and denominator,
- observation window and outcome-lag handling,
- eval/trace evidence,
- relevant cost/quality/autonomy/privacy guardrails,
- whether the claim is causal evidence, observational association or hypothesis.

Only the minimum privacy-safe summary/delta should be copied to this public repository. Anecdotal success is useful evidence, but it is not an aggregate improvement claim.
