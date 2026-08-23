# Janu Job Copilot — Product Capability Map

**Status:** Current scope/maturity map  
**Last verified:** 2026-08-23

## Purpose

Keep the whole Job Copilot JTBD visible while distinguishing **proven runtime behavior** from partial wiring, helper contracts and future scope.

Status vocabulary:
- **PROVEN** — representative live/environment evidence exists for the capability at its claimed boundary.
- **PARTIAL** — useful runtime behavior exists, but important paths/acceptance gates remain.
- **CONTRACT-ONLY** — helpers/schema/self-tests exist; end-to-end worker behavior is not yet proven.
- **NOT BUILT** — intended product capability is not yet operational.
- **HUMAN BOUNDARY** — intentionally human-owned unless separately authorized automation is added.

Passing a helper self-test never promotes a capability to PROVEN by itself.

## Capability map

| JTBD capability | Current status | What exists now | Missing acceptance / next proof | Priority |
|---|---|---|---|---:|
| Scheduled multi-source opportunity discovery | PARTIAL | daily sourcing, source telemetry, public/official retrieval paths | prove source coverage/precision and expected-run completion across target channels | P2 |
| User-provided URL intake | PARTIAL | Sources Inbox and source processing concepts | fresh URL must canonicalize/dedupe/retrieve/promote without unnecessary PDF/manual relay | **P0** |
| Browser capture for gated/LinkedIn-only roles | NOT BUILT / design specified | browser-extension pattern in Master Spec | safe structured DOM capture + provenance + same intake pipeline | P3 |
| Deduplication/canonical opportunity identity | PARTIAL | canonicalization/idempotency logic exists | fresh-source rerun must prove zero duplicate Application/JD/action/queue artifacts | **P0** |
| Vacancy verification/freshness | PARTIAL | official/public verification, provenance fields, bounded worker | CLOSED lifecycle containment and <=24h Ready-to-Submit freshness must be end-to-end proven | **P0** |
| JD retrieval/completeness/provenance | PARTIAL, strong | official ATS recovery and canonical snapshots demonstrated for representative path | prove from clean fresh intake and across supported source classes; no false user blocker | **P0** |
| JD parsing + deterministic fit/evidence map | PARTIAL, strong | structured extraction, evidence mapping/scoring workers | prove clean continuation from fresh intake under current release and trace identity | **P0** |
| Opportunity prioritization / Apply decision policy | PARTIAL | fit + Decision state exist | separate fit from desirability/priority; eliminate premature hard-coded Apply; later calibrate with outcomes | **P0/P2** |
| Company enrichment | PARTIAL | bounded model/web enrichment | prove non-blocking continuation, freshness/provenance, cache/budget behavior | P1 |
| Contact discovery | CONTRACT-ONLY / PARTIAL legacy | public-contact enrichment and P1-C helper contract | RetrievalProvider-backed actual worker + provenance + usefulness gate | P2 |
| Tailored resume generation | PARTIAL | evidence-grounded ResumeDocument/resume generation | close current render/provenance failure classes and prove fresh current-release path | **P0** |
| Application pack generation | PARTIAL | pack generation + sanitation controls | prove clean current-release path and user usefulness | P1 |
| Artifact render / ATS / semantic QA | PARTIAL, strong | deterministic + model-assisted QA and historical regressions | clean first-pass/revision cohorts; no tag/bullet/provenance regressions | **P0** |
| Resume Review checkpoint | PARTIAL / PROVEN boundary | review sheet + prior approved-review evidence | integrate comment-driven revision and fresh held-out path | **P0** |
| Revision Needed -> immutable V2/V3 | CONTRACT-ONLY | revision helper contracts/design | actual Google Docs unresolved-comment worker + immutable new version + re-QA | **P0** |
| Ready-to-Submit derivation | PARTIAL | state/gating concepts | require approval + QA + canonical URL + OPEN <=24h vacancy + no blocker in live path | **P0** |
| Authenticated external submission | HUMAN BOUNDARY | user performs privileged third-party action | exact minimal handoff; no CAPTCHA/OTP bypass; optional future safe tool separately authorized | **P0** to prove boundary |
| Submitted writeback / immutable provenance | PARTIAL design | state fields/contracts | real confirmation -> Submitted + Applied Date + exact used Resume Version + audit, never before | **P0** |
| Outreach/follow-up orchestration | PARTIAL / not live-accepted | sheets/contracts/drafts | timers/actions and response-aware stopping exercised after real submission | P1 |
| Gmail employer-outcome monitor | CONTRACT-ONLY | P1-C classification/matching helpers | real monitor, deterministic/fail-closed matching, private event provenance/writeback | **P1** |
| Interview Room creation / lifecycle | PARTIAL product surface | Interview Rooms sheet and product design | trigger from verified engagement; exercise prep/handoff/outcome updates | P1/P2 |
| Interview learning | NOT BUILT operationally | product/spec concepts | structured interview events + recurring failure/question/skill extraction + feedback loop | P2 |
| Skill Gap aggregation / improvement backlog | PARTIAL concept/state | Skill Gaps surface and evidence-gap concepts | aggregate recurring market/interview gaps; bridgeability + learning/project recommendation with evidence | P2 |
| Offer analysis / decision support | NOT BUILT | product scope only | offer event model, decision dimensions and human authority contract | P3 |
| Outcome analytics / calibration | PARTIAL data, NOT CLOSED loop | tracker state/cost/regression data | normalized submission/response/interview/offer events; north-star + funnel + source/fit/positioning cohorts | **P1** |
| Trace/span correlation | NOT BUILT runtime-wide | Queue/Audit/Worker/Health/Failure evidence | stable trace_id/span_id across intake -> worker -> model/tool -> verify -> outcome | **P0** alongside golden path |
| Cost/latency attribution | PARTIAL | cost ledger and worker timing | correlate to trace/application/outcome; cost per successful stage/submission/interview | P1 |
| Failure learning / regression | PARTIAL, strong | rich private Failure Learning + regression suite | normalize recurrence metric and make coverage systematic for new journey stages | **P0/P1** |
| Release provenance / rollback | PARTIAL | gated GitHub/clasp deployment; branch adds transformed-source hash/rollback | promote/verify branch; later durable private full runtime-source versions | **P0** |
| Product memory/retrieval | POLICY ONLY | memory policy; candidate evidence and state already separate | accumulate outcome experience, define retrieval benchmark before new memory store/vector DB | P3 |
| Lab-to-product improvement attribution | PILOT | JC-LAB-001 private/public contract | observe next material iterations and Keep/Revise/Reject | P1 |
| Portal migration | DEFERRED | migration contract | only after current-stack behavior becomes accepted semantic baseline | P4 |
| Multi-agent orchestration | NOT JUSTIFIED | none required | measured simpler-workflow failure + verifier + held-out gain required | Deferred |

## Critical path interpretation

The current critical path is **not** “build the portal” or “add more agents.” It is:

```text
fresh source
 -> correct identity/JD/vacancy
 -> score/decision
 -> resume/revision/QA
 -> Ready to Submit
 -> real submission + immutable provenance
 -> employer outcome capture
 -> interview/outcome learning
```

The product becomes self-improving only after the latter events can be attributed back to the earlier decisions and artifacts.

## Capability-promotion rule

Move a row toward PROVEN only when the relevant environment evidence exists and the acceptance boundary is explicit. For a material capability, require as applicable:
- representative real/synthetic fixture,
- persisted read-back,
- allowed state transition,
- idempotent rerun,
- trace/release attribution,
- targeted + regression eval,
- no avoidable user relay,
- privacy/budget/permission controls.

## Maintenance rule

Update this map when a capability becomes materially more or less proven. Do not change status merely because code/helper tokens were added.
