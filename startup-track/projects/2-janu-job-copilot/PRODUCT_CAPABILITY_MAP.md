# Janu Job Copilot — Product Capability Map

**Status:** Current scope/maturity map  
**Last verified:** 2026-08-24 00:35 IST

## Purpose

Keep the whole Job Copilot JTBD visible while distinguishing **source implementation**, **deployed behavior**, and **environment-proven capability**.

Status vocabulary:
- **PROVEN** — representative live/environment evidence exists for the capability at its claimed boundary.
- **PARTIAL** — useful runtime behavior exists, but important paths/acceptance gates remain.
- **CONTRACT-ONLY** — helpers/schema/self-tests exist; end-to-end behavior is not proven.
- **NOT BUILT** — intended product capability is not operational.
- **HUMAN BOUNDARY** — intentionally human-owned unless separately authorized automation is added.

A source/helper/self-test PASS never promotes a capability to PROVEN by itself.

## Capability map

| JTBD capability | Current status | What exists now | Missing acceptance / next proof | Priority |
|---|---|---|---|---:|
| Scheduled multi-source opportunity discovery | PARTIAL | daily sourcing, source telemetry, public/official retrieval paths | prove source coverage/precision and expected-run completion across target channels | P2 |
| User-provided / fresh URL intake | PARTIAL / live pilot blocked | Sources Inbox plus TRACE same-fixture intake runner | repair live identity collision; deploy V0-2; fresh URL must canonicalize/dedupe/retrieve/promote once without unnecessary manual relay | **P0** |
| Browser capture for gated/LinkedIn-only roles | NOT BUILT / design specified | browser-extension pattern in Master Spec | safe structured DOM capture + provenance + same intake pipeline | P3 |
| Canonical opportunity dedupe | PARTIAL / prevention pending | canonicalization logic; V0-2 exact non-empty URL equality + match diagnostics in source | live held-out negative/positive identity proof; no false duplicate | **P0** |
| Internal Application identity | DEGRADED / repair required | existing Application IDs and source collision guards | migrate current duplicate internal ID state; concurrency-safe unique ID generation + cross-sheet referential proof | **P0** |
| Vacancy verification/freshness | PARTIAL | official/public verification, provenance fields, bounded worker | CLOSED lifecycle containment and <=24h Ready freshness end to end | **P0** |
| JD retrieval/completeness/provenance | PARTIAL, strong | official ATS recovery and canonical snapshots demonstrated | prove from clean fresh intake under current verified release across supported source classes | **P0** |
| JD parsing + fit/evidence map | PARTIAL, strong | structured extraction, mapping/scoring workers | clean continuation from fresh intake with release + trace identity | **P0** |
| Opportunity prioritization / Apply decision policy | PARTIAL | fit + Decision state; golden score policy exists | prove no premature Apply and later separate fit from opportunity desirability/calibration | **P0/P2** |
| Company enrichment | PARTIAL | bounded model/web enrichment; current live success examples | prove non-blocking continuation, cache/budget/freshness behavior | P1 |
| Contact discovery | CONTRACT-ONLY / PARTIAL legacy | public-contact enrichment and P1-C helper contract | actual retrieval-backed worker + provenance + usefulness gate | P2 |
| Tailored resume generation | PARTIAL / currently degraded | evidence-grounded generation and renderer pipeline | fix recurrent `FL-045` render bullet loss; held-out + one clean live generation before broad replay | **P0** |
| Application pack generation | PARTIAL | pack generation + sanitation controls | prove clean current-release path and user usefulness | P1 |
| Artifact render / ATS / semantic QA | PARTIAL | deterministic + model-assisted controls exist | renderer prevention effectiveness; clean first-pass/revision cohorts; no bullet/tag/provenance recurrence | **P0** |
| Resume Review checkpoint | PARTIAL / PROVEN boundary | review sheet + genuine live human review action | integrate immutable comment-driven revision and fresh held-out path | **P0** |
| Human-action projection (`My Actions`) | PARTIAL / reconciliation pending | current genuine Resume Review action is visible | executable exactly-one unresolved-boundary / zero-after-resolution invariant; no drift | **P0** |
| Revision Needed -> immutable V2/V3 | CONTRACT-ONLY | revision helpers/design | actual unresolved-comment worker + immutable version + re-QA | **P0** |
| Ready-to-Submit derivation | PARTIAL | state/gating concepts | approval + QA + canonical URL + OPEN/current vacancy + no blocker in live path | **P0** |
| Authenticated external submission | HUMAN BOUNDARY | user performs privileged third-party action | exact minimal handoff and post-confirmation evidence; no CAPTCHA/OTP bypass | **P0** |
| Submitted writeback / immutable provenance | PARTIAL design | state fields/contracts | real confirmation -> Submitted + Applied Date + exact Resume Version + audit; idempotent rerun | **P0** |
| Outreach/follow-up orchestration | PARTIAL / not accepted | sheets/contracts/drafts | response-aware timers/stopping after real submission | P1 |
| Gmail employer-outcome monitor | CONTRACT-ONLY | P1-C classification/matching helpers | real bounded monitor, fail-closed match, deduped event/writeback | **P1** |
| Interview Room lifecycle | PARTIAL product surface | Interview Rooms sheet/design | trigger from verified engagement; exercise continuation/outcome updates | P1/P2 |
| Interview learning | NOT BUILT operationally | product/spec concepts | structured events + recurring question/failure/skill learning | P2 |
| Skill-gap aggregation / improvement backlog | PARTIAL concept/state | Skill Gaps surface and evidence-gap concepts | aggregate recurring market/interview gaps and evaluate interventions | P2 |
| Offer analysis / decision support | NOT BUILT | product scope only | offer event model, decision dimensions, human authority contract | P3 |
| Outcome analytics / calibration | PARTIAL data, NOT CLOSED loop | tracker/cost/regression data | normalized submission/response/interview/offer events and lag-aware funnel | **P1** |
| Human-readable Trace Explorer | PARTIAL / live | visible private Trace Explorer plus golden/verification evidence surfaces | same fresh journey must produce meaningful stage rows through Resume Review and useful human annotation | **P0** |
| Native trace/span causal correlation | NOT BUILT runtime-wide | trace/group values exist in some enqueue payloads; Explorer reconstructs existing operational rows | propagate trace/span context through producer/consumer queue, worker, model/tool, persistence and verification boundaries | **P0** |
| Cost/latency attribution | PARTIAL | cost ledger + worker timing can be projected into Trace Explorer | reliable trace/outcome correlation; cost per successful stage/submission/interview | P1 |
| Failure learning | PARTIAL, strong | rich private Failure Learning and automatic deterministic-failure capture | prevention lifecycle/effectiveness and recurrence-driven reopen/demotion | **P0/P1** |
| Eval/regression | PARTIAL | regression suite + targeted source/build guards + Verification Ledger | more production-shaped behavioral fixtures; source PASS must be followed by deploy/environment/effectiveness proof | **P0/P1** |
| Release provenance / rollback | PARTIAL, materially improved | transformed-source hash, in-run rollback, connected provenance readback proved for controlled release | semantic CLI failure gate/readback automation (`FL-049`); durable private full-source rollback store | **P0** |
| Reproducible canonical runtime source | NOT BUILT | live pull + patch-chain deployment | `DEPLOY-SOURCE-01`: private full-source/versioned artifact, exact-build deployment and historical rollback | **P0 architecture debt** |
| Product memory/retrieval | POLICY ONLY | memory policy; candidate evidence/state separated | outcome experience + retrieval benchmark before new memory store/vector DB | P3 |
| Lab-to-product improvement attribution | PILOT / first intervention REVISE | private JC-LAB ledger; JC-LAB-001 measured | revise baseline from detection-heavy to prevention/effectiveness/causal-trace/source-live discipline; continue JC-LAB-002 through P0/outcome window | P0/P1 |
| Portal migration | DEFERRED | migration contract | only after current-stack behavior becomes accepted semantic baseline | P4 |
| Multi-agent orchestration | NOT JUSTIFIED | none required | measured simpler-workflow failure + verifier + held-out gain required | Deferred |

## Critical path

```text
verified source/runtime identity
 -> trustworthy internal + business identity
 -> fresh source/JD/vacancy
 -> score/decision
 -> resume/render/QA
 -> Resume Review / immutable revision
 -> Ready
 -> real submission + immutable provenance
 -> employer outcome capture
 -> interview/outcome learning
```

Do not broaden downstream P1 while the current P0/TRACE stabilization invariants are unresolved.

## Capability-promotion lifecycle

For consequential behavior, track separate states rather than one vague `done`:

```text
proposed
 -> source verified
 -> deployed
 -> environment verified
 -> monitoring
 -> effective / ineffective
```

Recurrence automatically reopens or demotes a prevention. `SOURCE PASS`, `CI PASS`, `DEPLOYED`, `ENVIRONMENT VERIFIED`, and `EFFECTIVE` are different claims.

For a material capability require as applicable:
- representative production-shaped fixture,
- persisted readback,
- allowed state transition,
- idempotent/upgrade-convergent rerun,
- trace/release attribution,
- targeted + broader regression,
- no avoidable user relay,
- privacy/budget/permission controls,
- recurrence/effectiveness check.

## Maintenance rule

Update this map when environment evidence changes a capability or prevention status. Do not promote from source/helper tokens alone. Where practical, derive this status from linked canonical evidence instead of manually copying the same state across multiple ledgers.