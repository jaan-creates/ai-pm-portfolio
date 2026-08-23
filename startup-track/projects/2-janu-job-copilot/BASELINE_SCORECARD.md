# Janu Job Copilot — Baseline Scorecard

**Baseline date:** 2026-08-23  
**Status:** v0 observational baseline; normalized trace metrics not yet available

## Why this baseline exists

The AI Systems Lab must be able to show whether a proposed improvement actually helps Job Copilot. This file freezes what can be measured today and explicitly marks what cannot yet be measured cleanly.

Do not retroactively rewrite this baseline to make later changes look better. Add dated comparison sections or a new scorecard snapshot.

## 1. Current live snapshot

### Applications with `Decision = Apply`
Current bounded tracker inspection found 13 explicit Apply rows:

| Current status | Count |
|---|---:|
| Closed | 3 |
| Scoring | 3 |
| Tailoring | 2 |
| QA | 2 |
| Verifying JD | 1 |
| Resume Review | 1 |
| Worker Error | 1 |

This is a state distribution, not a success rate. The rows span different releases and historical repair states.

### System health
At the 2026-08-23 read:
- Daily Sourcing: HEALTHY / circuit CLOSED / last success 2026-08-23,
- OpenAI: HEALTHY / circuit CLOSED / last success 2026-08-23,
- Google Drive / Docs: HEALTHY / circuit CLOSED / last success 2026-08-23,
- Regression Gate: HEALTHY / circuit CLOSED / last success 2026-08-23,
- Budget: HEALTHY / circuit CLOSED / last success 2026-08-23,
- Worker Runtime: HEALTHY / circuit CLOSED / last checked/success 2026-08-21,
- Trigger Topology: HEALTHY / circuit CLOSED / last success 2026-08-19.

### Known current defect
`FL-045` / Metaforms remains a concrete live system-owned failure: `RESUME_GENERATE` hit deterministic `RENDER_BULLET_LOSS`, and the application is currently Worker Error.

### Latest learning signal
`FL-046` captured a missed sourcing cadence that had incorrectly remained healthy. The automation/health state was repaired and the current sourcing health now reports a 2026-08-23 success.

## 2. Baseline by dimension

| Dimension | Baseline | Confidence |
|---|---|---|
| Fresh source -> Resume Review/Ready-to-Submit E2E | Not yet cleanly demonstrated from a fresh held-out source under the current complete contract | High |
| Closed vacancy stops downstream work | Historical failure existed (`FL-042`); prevention work exists but needs ongoing regression/live evidence | High |
| Avoidable user relay | Historical Failure Learning contains multiple user-required release/repair cycles; no normalized rate yet | High qualitative / low quantitative |
| Terminal worker reliability | Queue has rich history but spans many releases/replays/cancellations; no clean cohort metric yet | High qualitative / low quantitative |
| Autonomous recovery rate | Not normalized across failure classes yet | Low |
| Duplicate/idempotency violations | Historical failures exist; current rate not normalized | Medium |
| Resume QA first-pass pass rate | Not cleanly cohortized by release | Low |
| Human resume approval/revision rate | Insufficient normalized sample | Low |
| End-to-end latency | Not reconstructable reliably across the full journey with current telemetry | Low |
| Model/retrieval cost per completed application | Cost ledger exists, but end-to-end attribution is not yet canonical | Low/Medium |
| Trace completeness | Partial: Queue/Audit/Worker State/Health/Regression/Failure Learning exist; no stable trace/span linkage | High |
| Failure recurrence after prevention | Many regressions exist, but no canonical recurrence metric yet | Medium |
| Release provenance | Release/version/suite checks exist; exact final transformed source hash is not yet first-class evidence | High |
| Customer/user-facing release-note decision coverage | No canonical gate before this baseline | High |
| Lab-improvement attribution | No product-local ledger before this baseline | High |

## 3. Initial next-release acceptance targets

These are engineering acceptance targets, not permanent SLOs:
- 100% of new instrumented worker executions have trace/release identity and terminal outcome evidence.
- 0 system-owned failures create a user blocker when an authorized automatic recovery path exists.
- 0 verified CLOSED vacancies continue expensive downstream work.
- 0 duplicate Application/JD/resume/queue artifacts in the clean golden-path fixture.
- 100% of production-changing releases have a targeted eval + required regression result + rollback + explicit release-note/build-note decision.
- 100% of AI Systems Lab-sourced product changes have a `LAB_IMPROVEMENT_LEDGER` entry and a later Keep/Revise/Reject outcome.
- at least one fresh held-out source completes source -> Resume Review under the current architecture with complete trace evidence before claiming E2E confidence.

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

### Learning/release
- recurrence rate of failure classes with a claimed prevention control,
- regressions added per material incident,
- trace completeness,
- release evidence completeness,
- Lab intervention win/revise/reject rate.

## 5. Comparison rule

Every future claim such as "Job Copilot is more reliable/autonomous/cheaper" must name:
- baseline/cohort,
- release/change ID,
- metric definition and denominator,
- observation window,
- eval/trace evidence,
- relevant cost/quality guardrails.

Anecdotal success is useful evidence, but it is not an aggregate improvement claim.