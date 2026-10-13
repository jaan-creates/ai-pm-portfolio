# Janu Job Copilot — Current State

**Status:** Verified snapshot; update when material runtime truth changes  
**Last verified:** 2026-08-24  
**Evidence window:** repository control branches, private live tracker, live System Health/Failure Learning/Verification Ledger, current Master Product & Engineering Specification

## Public/private evidence boundary

This repository is public. Therefore this file records product architecture/capability truth and privacy-safe summaries only. Exact live application rows, candidate/mailbox content, private tracker values, detailed traces and user-specific operating metrics remain in authorized private product surfaces. Public docs may reference opaque failure/change IDs or non-sensitive aggregate conclusions when needed.

## 1. Current executable/control-plane state

- Product repository: `jaan-creates/ai-pm-portfolio`.
- Product path: `startup-track/projects/2-janu-job-copilot/`.
- Production deployment workflow: `.github/workflows/janu-job-copilot.yml`.
- Accepted production baseline identity remains `1.3.8 / p0-regression-v19`; P1/runtime contracts are applied additively to a live pull.
- The deployment workflow pulls the current Apps Script project into an ephemeral `.janu-live` workspace, applies patch scripts, validates syntax/P0/P1/current active contracts, builds a privacy-safe transformed-source manifest, pushes with `clasp`, then immediately pulls and verifies the aggregate source hash.
- On 2026-08-24 the controlled renderer/TRACE bundle passed transformed-source validation and production push/pull source-hash verification. The release job still failed at target function execution/readback because the Apps Script Execution API path returned the known permission/API-executable semantic error. Source-deploy proof and target-runtime proof therefore remain separate gates (`FL-072`).
- Renderer recurrence prevention source now includes the active `RENDER-CAREERBREAK-V2`, `RENDER-CAREERBREAK-001`, quarantine enforcement and `PREVENTION-RECURRENCE-001` contract. This is **not** renderer-canary completion until target self-test/readback and runtime-liveness gates pass.

### Important source-of-truth caveat

The repository does **not** contain one canonical checked-in file equal to the exact final production Apps Script source. The deployed result is produced from:

```text
live Apps Script baseline
+ repository patch scripts
+ deployment workflow
= final deployed Apps Script
```

A privacy-safe transformed-source manifest/hash proves the deployed generation without publishing private/full runtime source. A durable private full-source version store remains unresolved.

### Product-spec governance state

The active product contract now includes the approval-gated resume-rendering change set (`CS-20260824-033`, Master Specification 0.27.0): JD-specific content is reviewed/approved before the official submission PDF is generated; rendering is a deterministic, versioned artifact stage; system-owned render/QA work is not a `My Actions` task. The visual HTML/CSS template structure is deliberately deferred until the user supplies the preferred reference/section order; state/provenance/liveness contracts do not depend on that visual choice.

## 2. Live system-health conclusion

The live control plane is **not globally green**.

- Sourcing, model/API access, Drive/Docs and budget components have recent healthy evidence.
- Worker Runtime is `BLOCKED / OPEN` under `FL-080` after a one-job cycle exhausted the runtime budget before reaching maintenance. Production readback narrows this occurrence to the no-runnable queue-selection path: there was no queue claim near the failing cycle, while `processQ_` structurally routes through `nextQ_` before `runQ_`. Exact queue-selection implementation still needs source-level confirmation before a surgical fix.
- Required liveness tests now include `QUEUE-NOJOB-BUDGET-001`, `RUNTIME-PREMAINT-BUDGET-001`, `RUNTIME-ONEJOB-RESERVE-001`, and `E2E-LIVENESS-BUDGET-001`.
- The live Regression Gate can still appear `HEALTHY / CLOSED` while unresolved release/runtime blockers exist. This remains an open blocker-aware health-publisher recurrence family (`FL-078`); source-level prevention is not accepted until repeated target cycles prove fail-closed persistence.
- No renderer canary or broad resume replay is authorized while `FL-072`, `FL-078`, or `FL-080` remain unresolved.

A healthy component row must never be interpreted as proof that an entire application journey works.

## 3. Current application-state conclusion

The private tracker contains applications across non-terminal and terminal lifecycle stages. Current readback also demonstrates a projection-consistency gap at the approval boundary:

- the canonical application/resume registry may already record an approved resume,
- a derived Resume Review surface can still retain a stale pending-review value,
- a distinct manual-submission action may correctly exist after approval,
- readiness can still be inconsistent with latest vacancy evidence if the derived readiness gate is not recomputed atomically.

This is tracked under `FL-079` / `CS-031` / `CS-20260824-033`. The old evidence that counted an approved application as a Resume Review action is explicitly superseded in the Verification Ledger; history is preserved rather than rewritten.

## 4. Demonstrated capabilities

Verified component capabilities include:
- durable queued workers with idempotency keys, retries, terminal failure state and error detail,
- scheduled sourcing with durable sourcing-run/health evidence,
- official vacancy/JD retrieval and provenance for supported sources,
- persisted JD snapshots and completeness gates,
- evidence-grounded requirement mapping and scoring,
- company/contact enrichment paths,
- structured resume/application-pack generation,
- deterministic and model-assisted artifact QA,
- human resume-review boundary,
- regression/health/cost/audit telemetry,
- private Failure Learning + Verification Ledger with exact escaped-fixture/prevention evidence,
- controlled GitHub -> Apps Script transformed-source validation, hash verification and rollback-on-hash-mismatch,
- TRACE-GOLDEN v0.2 and continuation-v3 source/self-test contracts,
- executable renderer quarantine/prevention source contract.

These are capabilities/components, not proof of one complete current-release source -> submission -> outcome journey.

## 5. Current known gaps

See `PRODUCT_CAPABILITY_MAP.md` for the broader maturity map. Highest-impact current gaps are below.

### Runtime / release liveness — P0 blocker
- `FL-080`: no-runnable queue-selection path can consume the one-job runtime budget. Fix and prove runtime reserve before any renderer canary.
- `FL-072`: production source hash can be verified while target function execution/readback remains unavailable through the current clasp Execution API path. Target runtime evidence must come from a legitimate executable/trigger/readback path.
- `FL-078` family: Regression Gate must remain fail-closed while material release/runtime blockers exist; repeated target cycles are required before closure.

### Product/value loop
- A clean fresh-source -> approval -> post-approval render/QA -> Ready to Submit -> real submission -> post-submission golden path is not fully accepted end to end.
- Fresh URL intake/dedupe/promotion must be proven without unnecessary PDF/manual relay.
- Opportunity decision policy must keep factual fit separate from desirability and avoid premature hard-coded Apply for system-sourced roles.
- Revision Needed is not yet accepted as a real immutable V2/V3 worker path.
- Renderer recurrence is source-contained but target self-test/canary proof is still pending.
- Approval projection must converge across Applications, Resume Registry, Resume Review, My Actions and Submission Assets.
- Ready-to-Submit must be derived from current approved artifact + passed QA + current/open vacancy evidence, not a stale status flag.
- Real Submitted writeback with exact immutable used-resume provenance is not yet accepted as one current golden path.

### Employer outcome / communication loop
- P1-C Gmail classification/matching helper contracts are not yet a fully accepted live bounded monitor with fail-closed matching/deduped outcome events.
- Post-submission outreach/follow-up behavior is not yet live-accepted as an outcome-aware loop.
- Interview Room creation/update from verified employer engagement is not yet proven as a complete automated continuation.

### Learning / product intelligence
- Failure-learning policy is stronger than the current live incident schema. Policy requires class/severity/recurrence/prevention measurement, while the live table does not yet normalize primary/secondary failure class, severity, failure-family linkage, prevention lifecycle/effectiveness, or supersession. See issue `#19`.
- Exact verification/readback evidence remains canonical in the Verification Ledger; raw traces/mail/application content must not be promoted automatically to memory.
- Normalized employer-outcome events sufficient for response/interview/offer funnel analytics are not yet established.
- Qualified interview conversion per unit genuine user effort cannot yet be measured cleanly.
- Outcome-driven sourcing/priority/candidate-learning loops therefore remain downstream.

### Observability
- Trace v0.2 exists for the golden-path work package, but stable complete trace coverage across all intake/worker/model/tool/verification/submission/outcome operations is not yet accepted.
- Model/tool cost and latency cannot yet be reliably attributed to every logical application/outcome journey.
- A separate read-only runtime-diagnostic path is being introduced so production function structure can be inspected without using a production deployment as an inspection mechanism.

### Product surfaces deliberately deferred
- Visual HTML/CSS resume-template implementation is deferred until the user supplies the preferred reference structure/section ordering. The approval/render/provenance contract remains active now.
- Browser extension for gated/LinkedIn-only capture remains planned.
- Offer analysis is not operationally proven.
- Portal migration is downstream of current-stack semantic/value-loop acceptance.
- Multi-agent orchestration/vector memory/fine-tuning are not justified by measured need yet.

## 6. Do not infer as current truth

Do not infer that:
- a passing helper/self-test proves full feature wiring,
- a successful source push proves target runtime execution,
- a healthy component row proves an entire product journey works,
- an application `Status` proves all derived projections or gates are coherent,
- `Ready to Submit` means vacancy evidence is current/open or that the application was submitted,
- an existing PDF is the official approved submission asset unless the approval-gated artifact provenance proves it,
- a model output proves the related Drive/Sheet/Gmail/external side effect occurred,
- an old `TrackerWorkflow` copy is the exact deployed source after patch transforms,
- raw operational traces/incidents are automatically durable product memory,
- observed response/interview patterns are causal or should automatically modify factual fit scoring,
- portal/helper/agent architecture is a product capability until representative environment acceptance exists.

## 7. Current priority

The immediate order is now:

1. **Restore runtime reserve (`FL-080`)** — source-confirm and bound the no-runnable queue-selection path; pass the four runtime/no-work liveness tests and one clean target cycle.
2. **Complete release/health proof (`FL-072`, `FL-078`)** — target execution/readback + blocker-aware Regression Gate persistence.
3. **Finish renderer recurrence containment (`CS-032`)** — target renderer self-test, exact regression, single authorized canary only; no broad replay.
4. **Close approval/projection semantics (`CS-031` + `CS-20260824-033`)** — approval closes review action, system-owned finalization has zero user tasks, application/registry/review/readiness projections converge; visual template design remains deferred.
5. **Resume TRACE-GOLDEN-01** through approval-gated render/QA/Ready, then real authenticated submission with immutable provenance.
6. Gmail/outreach/interview outcome continuation.
7. Normalized north-star/funnel/user-effort metrics and outcome-driven sourcing/priority/candidate-learning experiments.
8. Portal migration only after the current stack is a trustworthy semantic reference.

See `EXECUTION_ROADMAP.md` and issues `#5`, `#18`, `#19`, and `#20`.

## 8. Required state-maintenance rule

Update this file after a material release, architecture change, verified capability promotion/demotion, important failure-class fix, changed autonomy boundary, or when environment evidence contradicts this snapshot. Preserve private evidence in private product surfaces and publish only the minimum non-sensitive conclusion/reference needed for reproducibility. When evidence changes a prior conclusion, record supersession/refinement rather than silently rewriting the historical evidence trail.
