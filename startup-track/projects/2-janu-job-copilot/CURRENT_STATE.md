# Janu Job Copilot — Current State

**Status:** Verified snapshot; update when material runtime truth changes  
**Last verified:** 2026-08-23  
**Evidence window:** repository `main`, private live tracker, live System Health/Failure Learning, current Master Product & Engineering Specification

## Public/private evidence boundary

This repository is public. Therefore this file records product architecture/capability truth and privacy-safe summaries only. Exact live application rows, candidate/mailbox content, private tracker values, detailed traces and user-specific operating metrics remain in authorized private product surfaces. Public docs may reference opaque failure/change IDs or non-sensitive aggregate conclusions when needed.

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

This makes release provenance/reproducibility weaker than a normal source-controlled build. The baseline branch adds a privacy-safe deployment manifest/hash so a release can identify the exact transformed source without publishing its contents. A durable private full-source version store remains unresolved.

### Product-spec governance caveat

The current Master Product & Engineering Specification contains later change-set/reference material identifying spec `0.23.0`, while its visible current-version header still shows an older version. The intended product behavior is broader than the current Git `PRODUCT.md` had previously summarized. This baseline branch now re-anchors Git product docs to the full JTBD, and the Master Specification itself must be reconciled/version-bumped before the next material product iteration.

## 2. Live system-health conclusion

A private live read on 2026-08-23 showed the major control-plane components reporting healthy/closed state, including sourcing, model/API access, Drive/Docs, regression gate and budget. Some components had older last-success timestamps than others, so component health must not be interpreted as proof of a complete current end-to-end application journey.

The latest sourcing-health failure-learning class showed why this distinction matters: a coarse health rule had previously remained healthy despite a missed expected sourcing cycle. The corrected design treats expected outcome/cadence evidence as stronger than a generic freshness flag.

Exact private timestamps and tracker values are intentionally not reproduced here.

## 3. Current application-state conclusion

The private tracker contains applications across multiple non-terminal and terminal lifecycle stages, including at least one current system-owned worker error. Exact companies, counts, application IDs and user-specific status distribution remain private.

This state is not a clean outcome-rate baseline because historical rows span multiple releases, migrations, retries and containment events. Aggregate reliability/autonomy/outcome claims should be calculated from versioned/cohortized traces/events rather than copied from mixed historical tracker rows.

## 4. Demonstrated capabilities

Verified examples include:
- durable queued workers with idempotency keys, retries, terminal failure state and error detail,
- scheduled sourcing with durable sourcing-run/health evidence,
- official vacancy/JD retrieval and provenance for supported sources,
- persisted JD snapshots and completeness gates,
- evidence-grounded requirement mapping and scoring,
- company/contact enrichment paths,
- resume/application-pack generation,
- deterministic and model-assisted artifact QA,
- human resume-review boundary,
- regression/health/cost/audit telemetry,
- structured private Failure Learning with many concrete historical defects/prevention controls,
- controlled GitHub -> Apps Script deployment with syntax and release-contract gates.

These are capabilities/components, not proof of one complete current-release source -> submission -> outcome journey.

## 5. Current known gaps

See `PRODUCT_CAPABILITY_MAP.md` for the full maturity map. Highest-impact gaps are below.

### Product/value loop
- A clean fresh-source -> Resume Review -> Ready to Submit -> real submission -> post-submission golden path is not yet fully accepted end to end under the complete current contract.
- Fresh URL intake/dedupe/promotion must be proven without unnecessary PDF/manual relay.
- Opportunity decision policy must keep factual fit separate from desirability and avoid premature hard-coded Apply for system-sourced roles.
- Revision Needed is not yet accepted as a real Google Doc comment-driven immutable V2/V3 worker path.
- A current deterministic resume-render integrity failure remains system-owned and unresolved in live state; exact application details stay private.
- Ready-to-Submit must be end-to-end tied to OPEN/current vacancy evidence.
- Real Submitted writeback with exact immutable used-resume provenance is not yet accepted as one current golden path.

### Employer outcome / communication loop
- P1-C Gmail classification/matching helper contracts are not yet a fully accepted live bounded monitor with fail-closed matching/deduped outcome events.
- Post-submission outreach/follow-up behavior is not yet live-accepted as an outcome-aware loop.
- Interview Room creation/update from verified employer engagement is not yet proven as a complete automated continuation.

### Learning / product intelligence
- Normalized outcome events sufficient for response/interview/offer funnel analytics are not yet established.
- Qualified interview conversion per unit genuine user effort cannot yet be measured cleanly.
- Sourcing quality/coverage, opportunity-priority calibration, recurring interview/skill-gap learning and outcome-linked positioning learning are therefore not yet closed feedback loops.
- Product memory types/promotion rules now exist as policy, but runtime retrieval/usefulness evaluation is not implemented and should wait for enough promoted outcome experience.

### Observability
- Queue rows, Audit Log, Worker State, Cost Ledger, System Health and Failure Learning provide useful evidence, but there is no stable end-to-end `trace_id`/`span_id` model across intake/worker/model/tool/verification/submission/outcome operations.
- Model/tool cost and latency cannot yet be reliably attributed to one logical application/outcome journey from current product-level telemetry alone.

### Release provenance
- Exact final production source is patch-transformed from a live pull rather than represented as a normal immutable checked-in/private-versioned source build.
- The baseline branch narrows production deployment triggers away from documentation-only changes and adds a transformed-source manifest/hash/rollback, but this is not production truth until promoted and verified.

### Product surfaces deliberately deferred
- Browser extension for gated/LinkedIn-only capture remains a planned capability.
- Offer analysis is not operationally proven.
- Portal migration is downstream of current-stack semantic/value-loop acceptance.
- Multi-agent orchestration/vector memory/fine-tuning are not currently justified by measured need.

## 6. Do not infer as current truth

Do not infer that:
- a passing helper self-test proves full feature wiring,
- a healthy component row proves an entire product journey works,
- an application `Status` implies a corresponding active worker exists,
- a model output proves the related Drive/Sheet/Gmail/external side effect occurred,
- an old `TrackerWorkflow` copy is the exact deployed source after patch transforms,
- a public repository file is an appropriate place for private live tracker/mailbox evidence merely because the repository is the product code source,
- Ready to Submit means actually submitted,
- a resume/application-prep success means the product north star improved,
- an observed response/interview pattern is causal or should automatically modify factual fit scoring,
- portal/helper/agent architecture is a product capability until representative environment acceptance exists.

## 7. Current priority

The next product objective is not portal migration. It is to close a measurable current-stack value loop in this order:

1. promote/reconcile the operating baseline and product-spec identity,
2. minimal trace v0 + fresh URL intake,
3. score/tailor/QA/revision -> Resume Review/Ready,
4. real submission + immutable provenance,
5. Gmail/outreach/interview outcome continuation,
6. normalized north-star/funnel/user-effort metrics,
7. outcome-driven sourcing/priority/candidate-learning experiments.

See `EXECUTION_ROADMAP.md`.

## 8. Required state-maintenance rule

Update this file after a material release, architecture change, verified capability promotion/demotion, important failure-class fix, changed autonomy boundary, or when environment evidence contradicts this snapshot. Keep private evidence in private product surfaces and publish only the minimum non-sensitive conclusion/reference needed for reproducibility.
