# Janu Job Copilot — Current State

**Status:** Verified snapshot; update when material runtime truth changes  
**Last verified:** 2026-08-23  
**Evidence window:** repository `main`, private live tracker, live system-health/failure-learning state

## Public/private evidence boundary

This repository is public. Therefore this file records product architecture/capability truth and privacy-safe summaries only. Exact live application rows, candidate content, private tracker values, detailed traces and user-specific operating metrics remain in the authorized private tracker/telemetry surface. Public docs may reference opaque failure/change IDs or non-sensitive aggregate conclusions when needed.

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

This makes release provenance and reproducibility weaker than a normal source-controlled build. The baseline branch therefore adds a privacy-safe deployment manifest/hash so a release can identify the exact transformed source without publishing its contents.

## 2. Live system-health conclusion

A private live read on 2026-08-23 showed the major control-plane components reporting healthy/closed state, including sourcing, model/API access, Drive/Docs, regression gate and budget. Some components had older last-success timestamps than others, so component health must not be interpreted as proof of a complete current end-to-end application journey.

The latest sourcing-health failure-learning class showed why this distinction matters: a coarse health rule had previously remained healthy despite a missed expected sourcing cycle. The corrected design treats expected outcome/cadence evidence as stronger than a generic freshness flag.

Exact private timestamps and tracker values are intentionally not reproduced here.

## 3. Current application-state conclusion

The private tracker contains applications across multiple non-terminal and terminal lifecycle stages, including at least one current system-owned worker error. Exact companies, counts, application IDs and user-specific status distribution remain private.

This state is not a clean outcome-rate baseline because historical rows span multiple releases, migrations, retries and containment events. Aggregate reliability/autonomy claims should be calculated from versioned/cohortized traces rather than copied from mixed historical tracker rows.

## 4. Demonstrated capabilities

Verified examples include:
- durable queued workers with idempotency keys, retries, terminal failure state and error detail,
- official vacancy/JD retrieval and provenance for supported sources,
- persisted JD snapshots and completeness gates,
- evidence-grounded requirement mapping and scoring,
- company/contact enrichment,
- resume/application-pack generation,
- deterministic and model-assisted artifact QA,
- human resume-review boundary,
- regression/health telemetry,
- structured private Failure Learning with many concrete historical defects/prevention controls,
- controlled GitHub -> Apps Script deployment with syntax and release-contract gates.

## 5. Current known gaps

### Product/E2E
- A clean fresh-source -> Ready to Submit -> real submission -> post-submission golden path is not yet fully accepted end to end under the complete current contract.
- A current deterministic resume-render integrity failure remains system-owned and unresolved in live state; exact application details stay in the private tracker.
- P1-B/P1-C capabilities remain only partially runtime-integrated; helper/contract presence must not be confused with end-to-end completion.

### Observability
- Queue rows, Audit Log, Worker State, System Health and Failure Learning provide useful evidence, but there is no stable end-to-end `trace_id`/`span_id` model across worker/model/tool/verification operations.
- Model/tool cost and latency cannot yet be reliably attributed to one logical application journey from current product-level telemetry alone.

### Release provenance
- Exact final production source is patch-transformed from a live pull rather than represented as a normal immutable checked-in source build.
- The baseline branch narrows production deployment triggers away from documentation-only changes and adds a transformed-source manifest/hash, but this is not production truth until promoted and verified.

### Memory/learning
- Failure Learning is strong incident evidence, but memory types, promotion rules, supersession and retrieval-usefulness evaluation are not yet formalized in runtime behavior.

### Metrics
- Existing private sheets can produce point-in-time operational signals, but normalized metric definitions/cohorts and complete trace attribution are still required before claiming quantitative product improvement.

## 6. Do not infer as current truth

Do not infer that:
- a passing helper self-test proves full feature wiring,
- a healthy component row proves an entire product journey works,
- an application `Status` implies a corresponding active worker exists,
- a model output proves the related Drive/Sheet/external side effect occurred,
- an old `TrackerWorkflow` copy is the exact deployed source after patch transforms,
- a public repository file is an appropriate place for private live tracker evidence merely because the repository is the product code source.

## 7. Required state-maintenance rule

Update this file after a material release, architecture change, verified new capability, important failure-class fix, changed autonomy boundary, or when environment evidence contradicts this snapshot. Keep private evidence in the private product surface and publish only the minimum non-sensitive conclusion/reference needed for reproducibility.