# Janu Job Copilot — Current State

**Status:** Verified snapshot; update when material runtime truth changes  
**Last verified:** 2026-08-23  
**Evidence window:** repository `main`, live tracker, live system-health/failure-learning state

## 1. Current executable/control-plane state

- Product repository: `jaan-creates/ai-pm-portfolio`.
- Product path: `startup-track/projects/2-janu-job-copilot/`.
- Production deployment workflow: `.github/workflows/janu-job-copilot.yml`.
- Accepted production baseline identity remains `1.3.8 / p0-regression-v19` before additive P1 patching.
- The deployment workflow pulls the current Apps Script project into an ephemeral `.janu-live` workspace, applies additive P1 patch scripts, validates syntax/P0/P1 contracts, and pushes the resulting source with `clasp`.

### Important source-of-truth caveat

The repository does **not** currently contain one canonical checked-in file equal to the exact final production Apps Script source. The deployed result is produced from:

```text
live Apps Script baseline
+ repository patch scripts
+ deployment workflow
= final deployed Apps Script
```

This makes release provenance and reproducibility weaker than a normal source-controlled build. Until this is improved, the exact deployed runtime must be verified from live pull/release identity plus workflow evidence. A deployment-manifest/source-hash control is therefore a required next infrastructure improvement.

## 2. Live system health snapshot

As of the 2026-08-23 tracker read:

| Component | Reported status | Last success evidence |
|---|---|---|
| Worker Runtime | HEALTHY / circuit CLOSED | 2026-08-21 |
| Daily Sourcing | HEALTHY / circuit CLOSED | 2026-08-23 |
| OpenAI | HEALTHY / circuit CLOSED | 2026-08-23 |
| Google Drive / Docs | HEALTHY / circuit CLOSED | 2026-08-23 |
| Regression Gate | HEALTHY / circuit CLOSED | 2026-08-23 |
| Trigger Topology | HEALTHY / circuit CLOSED | 2026-08-19 |
| Budget | HEALTHY / circuit CLOSED | 2026-08-23 |

`FL-046` recorded that a missed weekday sourcing cycle had incorrectly remained healthy; the scheduler/health outcome was corrected and the current tracker now shows Daily Sourcing healthy with a 2026-08-23 success.

## 3. Current application snapshot

The latest bounded tracker inspection found 13 rows explicitly in `Decision = Apply`:
- 3 Closed,
- 3 Scoring,
- 2 Tailoring,
- 2 QA,
- 1 Verifying JD,
- 1 Resume Review,
- 1 Worker Error.

This is a state snapshot, not an outcome-rate metric. Historical rows include multiple releases, retries, migrations and containment events, so aggregate reliability claims must wait for normalized traces/eval cohorts.

## 4. Demonstrated capabilities

Verified examples include:
- durable queued workers with idempotency keys, retries, terminal failure state and error detail,
- official vacancy/JD retrieval and provenance for supported sources, including Ashby recovery,
- persisted JD snapshots and completeness gates,
- evidence-grounded requirement mapping and scoring,
- company/contact enrichment,
- resume/application-pack generation,
- deterministic and model-assisted artifact QA,
- human resume-review boundary,
- regression/health telemetry,
- structured `__Failure Learning` records; current history reaches at least `FL-046`,
- controlled GitHub -> Apps Script deployment with syntax and release-contract gates.

## 5. Current known gaps

### Product/E2E
- A clean fresh-source -> Ready to Submit -> real submission -> post-submission golden path is not yet fully accepted end to end.
- `FL-045` remains visible in live state: Metaforms resume generation hit deterministic `RENDER_BULLET_LOSS` and the application is in Worker Error.
- P1-B/P1-C capabilities remain only partially runtime-integrated; helper/contract presence must not be confused with end-to-end completion.

### Observability
- Queue rows, Audit Log, Worker State, System Health and Failure Learning provide useful evidence, but there is no stable end-to-end `trace_id`/`span_id` model across worker/model/tool/verification operations.
- Model/tool cost and latency cannot yet be reliably attributed to one logical application journey from current product-level telemetry alone.

### Release provenance
- Exact final production source is patch-transformed from a live pull rather than represented as a normal immutable source build.
- Documentation-only changes currently fall under the same broad workflow path filter as runtime patch changes, creating avoidable deployment coupling.

### Memory/learning
- Failure Learning is strong incident evidence, but memory types, promotion rules, supersession and retrieval-usefulness evaluation are not yet formalized product-wide.

### Metrics
- Existing sheets can produce point-in-time operational signals, but no canonical baseline scorecard yet binds definitions, denominators, cohort/version and target thresholds.

## 6. Do not infer as current truth

Do not infer that:
- a passing helper self-test proves full feature wiring,
- a healthy component row proves an entire product journey works,
- an application `Status` implies a corresponding active worker exists,
- a model output proves the related Drive/Sheet/external side effect occurred,
- an old `TrackerWorkflow` copy is the exact deployed source after patch transforms.

## 7. Required state-maintenance rule

Update this file after a material release, architecture change, verified new capability, important failure-class fix, changed autonomy boundary, or when environment evidence contradicts this snapshot. Routine low-level commits do not require an update.