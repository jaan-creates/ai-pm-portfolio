# Janu Job Copilot — Baseline Scorecard

**Baseline date:** 2026-08-23  
**Status:** v0 observational baseline; normalized trace metrics not yet available

## Public/private scorecard rule

This repository is public. Metric definitions, targets and non-sensitive conclusions belong here. Exact live user/application counts, company/application identities, candidate content and detailed private tracker values remain in the authorized private tracker/telemetry surface.

A public comparison may publish privacy-safe aggregate deltas later when useful, but the authoritative numerator/denominator/evidence must remain traceable to the private source.

## Why this baseline exists

The AI Systems Lab must be able to show whether a proposed improvement actually helps Job Copilot. This file freezes what can be stated safely today and explicitly marks what cannot yet be measured cleanly.

Do not retroactively rewrite this baseline to make later changes look better. Add dated comparison sections or a new scorecard snapshot.

## 1. Current live conclusion

A bounded private tracker inspection on 2026-08-23 showed:
- multiple active and terminal application lifecycle states,
- at least one current system-owned worker failure,
- major system-health components reporting healthy/closed state at the time of inspection,
- a recent sourcing-health correction after an expected cadence was missed despite the prior generic health signal.

Exact application distributions, company/application identities and private health timestamps are intentionally omitted from this public repository.

This mixed historical/live state is **not** a clean success-rate cohort because rows and queue history span multiple releases, migrations, retries and containment events.

## 2. Baseline by dimension

| Dimension | Baseline | Confidence |
|---|---|---|
| Fresh source -> Resume Review/Ready-to-Submit E2E | Not yet cleanly demonstrated from a fresh held-out source under the current complete contract | High |
| Closed vacancy stops downstream work | Historical lifecycle-propagation failure existed; prevention work needs ongoing regression/live evidence | High |
| Avoidable user relay | Historical Failure Learning contains repeated user-required release/repair cycles; no normalized rate yet | High qualitative / low quantitative |
| Terminal worker reliability | Queue has rich history but spans many releases/replays/cancellations; no clean cohort metric yet | High qualitative / low quantitative |
| Autonomous recovery rate | Not normalized across failure classes yet | Low |
| Duplicate/idempotency violations | Historical failures exist; current rate not normalized | Medium |
| Resume QA first-pass pass rate | Not cleanly cohortized by release | Low |
| Human resume approval/revision rate | Insufficient normalized sample | Low |
| End-to-end latency | Not reconstructable reliably across the full journey with current telemetry | Low |
| Model/retrieval cost per completed application | Cost ledger exists, but end-to-end attribution is not yet canonical | Low/Medium |
| Trace completeness | Partial: Queue/Audit/Worker State/Health/Regression/Failure Learning exist; no stable trace/span linkage | High |
| Failure recurrence after prevention | Many regressions exist, but no canonical recurrence metric yet | Medium |
| Release provenance | Release/version/suite checks exist; exact final transformed source hash is being added by this baseline branch | High |
| Customer/user-facing release-note decision coverage | No canonical gate before this baseline | High |
| Lab-improvement attribution | No product-local intervention ledger before this baseline | High |

## 3. Initial next-release acceptance targets

These are engineering acceptance targets, not permanent SLOs:
- 100% of new instrumented worker executions have trace/release identity and terminal outcome evidence.
- 0 system-owned failures create a user blocker when an authorized automatic recovery path exists.
- 0 verified CLOSED vacancies continue expensive downstream work.
- 0 duplicate Application/JD/resume/queue artifacts in the clean golden-path fixture.
- 100% of production-changing releases have a targeted eval + required regression result + rollback + explicit release-note/build-note decision.
- 100% of AI Systems Lab-sourced material product changes have a `LAB_IMPROVEMENT_LEDGER` entry and later Keep/Revise/Reject/Insufficient-evidence outcome.
- at least one fresh held-out source completes source -> Resume Review under the current architecture with complete trace evidence before claiming E2E confidence.
- 0 private live application/candidate content is copied into public governance/telemetry artifacts when an opaque reference or private source is sufficient.

## 4. Metrics to activate once trace v0 exists

### Product outcome
- eligible source -> Resume Review completion rate,
- Resume Review -> Ready to Submit rate,
- Ready to Submit -> Submitted rate,
- Submitted -> recruiter response/interview as downstream product outcomes.

### Reliability
- terminal system failure rate by worker/release/failure class,
- retries per successful completion,
- stalled non-terminal state rate,
- duplicate/idempotency violation rate.

### Autonomy
- avoidable human blockers per eligible application,
- manual relay requests,
- autonomous recovery rate,
- time spent waiting on genuine human authority vs system repair.

### Quality
- QA first-pass pass rate,
- human Approve / Revision Needed / Withdraw distribution,
- evidence-grounding violations,
- representation/fit error rate on reviewed fixtures.

### Cost/latency
- end-to-end time to Resume Review,
- model/tool latency by stage,
- total model/retrieval cost per completed application,
- cost of failed/replayed work.

### Observability/privacy
- trace completeness/correlation rate,
- telemetry privacy-policy violation rate,
- spans missing release/model/tool attribution.

### Learning/release
- recurrence rate of failure classes with a claimed prevention control,
- regressions added per material incident,
- release evidence completeness,
- Lab intervention Keep/Revise/Reject/Insufficient-evidence distribution.

## 5. Comparison rule

Every future claim such as "Job Copilot is more reliable/autonomous/cheaper" must name:
- private authoritative baseline/cohort,
- release/change ID,
- metric definition and denominator,
- observation window,
- eval/trace evidence,
- relevant cost/quality guardrails.

Only the minimum privacy-safe summary/delta should be copied to this public repository. Anecdotal success is useful evidence, but it is not an aggregate improvement claim.