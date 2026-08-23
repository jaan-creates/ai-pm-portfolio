# Janu Job Copilot — Outcome-Aligned Execution Roadmap

**Status:** Active priority plan  
**Last verified:** 2026-08-23  
**Planning horizon:** prove the complete current-stack career loop before portal migration

## Planning rule

Prioritize by **JTBD value × dependency × risk reduction**, not by architectural novelty.

The whole product goal is qualified interview/offer progress with minimal avoidable user effort. Reliability, tracing, evals, memory and release engineering are enabling systems; they are not substitutes for closing the user outcome loop.

## Priority architecture

```text
P0 — Establish a trustworthy measurable application/submission path
      ↓
P1 — Close employer-outcome + follow-up loop
      ↓
P2 — Use outcomes to improve sourcing, prioritization and candidate/interview strategy
      ↓
P3 — Expand capture/decision/offer surfaces and selective memory
      ↓
P4 — Migrate proven contracts to portal
```

Agentic/multi-agent complexity is orthogonal and may enter only when a measured capability gap earns it.

---

## P0 — Prove one clean traceable source-to-submission journey

### P0.0 — Promote the operating baseline safely
**Goal:** establish the governance/control surface before the next material runtime change.

Work:
- finish review/CI for the AI Systems Lab baseline branch,
- ensure documentation-only changes cannot trigger production Apps Script deployment,
- verify deployment manifest/source-hash/rollback behavior,
- reconcile Master Specification version/current change-set metadata,
- make product truth hierarchy explicit across live environment, Git and Master Specification.

Exit:
- governance CI green,
- production-impacting workflow changes explicitly approved before merge,
- post-merge environment verification complete,
- no contradictory current-version/spec identity.

### P0.1 — Add minimal trace v0 while touching the golden path
**Goal:** avoid another important E2E run that cannot be reconstructed.

Instrument the minimum usable correlation first:
- `trace_id` per logical application journey/attempt episode,
- `span_id` / parent linkage for intake, queue/worker, model/tool, persist, verify,
- application/source/queue job IDs stored only in private telemetry where sensitive,
- release/commit/suite/model/provider/prompt-schema identity,
- timestamps/duration/attempt/error/result,
- environment verification reference,
- token/cost where available.

Do not first build a new observability platform. Extend current private Queue/Audit/Worker/Cost/Failure surfaces or a small dedicated trace table, then evaluate whether an external backend is justified.

Exit:
- one fresh journey can be reconstructed across the major stages,
- required trace privacy checks pass,
- trace completeness metric is computable.

### P0.2 — Fresh URL intake -> correct application decision
**Goal:** start the acceptance journey from a genuinely fresh source, not a pre-existing Application row.

Work:
- URL canonicalization and official evidence retrieval,
- deterministic/strong-key dedupe first,
- JD/vacancy persistence and provenance,
- no PDF/manual upload when authorized official evidence is sufficient,
- system-sourced opportunity must not hard-code Apply before decision policy,
- user-sourced direct URL may carry Apply intent per product policy but still obey hard safety/evidence gates.

Exit:
- one real current relevant URL enters once,
- rerun creates no duplicate application/JD/action/queue artifact,
- source decision and promotion are correct and traceable.

### P0.3 — Score -> tailor -> QA -> Resume Review with liveness
**Goal:** prove the current core preparation path without silent stalls.

Work:
- scoring/evidence map continuation,
- company enrichment non-blocking,
- resume + application-pack generation,
- close current deterministic render-integrity failure class,
- deterministic + semantic QA,
- non-terminal state monitor guarantees active work/retry/genuine blocker,
- system-owned failure auto-repairs or becomes actionable Failure Learning, not user work.

Exit:
- fresh fixture reaches Resume Review,
- no silent non-terminal stall,
- no avoidable user blocker,
- artifact provenance/QA/trace/release evidence complete.

### P0.4 — Make revision a real workflow
**Goal:** turn Resume Review into a learning/revision boundary rather than a terminal demo screen.

Work:
- unresolved Google Doc comments / structured revision input -> revision worker,
- generate immutable V2/V3 rather than overwrite,
- re-render/re-QA,
- preserve user corrections as high-value evidence for product learning without automatically generalizing them.

Exit:
- Approved path and Revision Needed path both pass,
- previous versions remain immutable/addressable,
- exact approved version is derivable.

### P0.5 — Ready-to-Submit + real submission provenance
**Goal:** close the real application boundary honestly.

Ready gate requires:
- approved current resume,
- QA passed,
- canonical application URL,
- vacancy OPEN with <=24h freshness when required,
- no system blocker,
- exact final artifact exposed.

After the genuine authenticated user submission:
- explicit confirmation/evidence,
- set Submitted/Applied Date only afterward,
- freeze exact Resume Version ID actually used,
- audit the mutation,
- no pre-confirmation auto-submit claim.

Exit:
- one real application is submitted through the intentional human authority boundary,
- tracker read-back proves exact immutable provenance,
- duplicate rerun cannot create a second submission state/event.

### P0.6 — Negative and recovery confidence
Before declaring the application loop stable, prove:
- verified CLOSED vacancy stops downstream work,
- stale/UNKNOWN vacancy blocks readiness appropriately,
- duplicate source is idempotent,
- transient provider error retries boundedly,
- deterministic failure fails closed/learns,
- no hidden/stale `My Actions` blocker,
- production release/regression gates stay green.

**P0 completion definition:** one fresh source-to-real-submission journey + negative/idempotency paths with traceable current-release evidence.

---

## P1 — Close the employer-outcome and communication loop

This is the largest missing piece relative to the whole JTBD.

### P1.1 — Outcome event model
Create a durable event contract for:
- application acknowledgement,
- recruiter response,
- assessment,
- screening/interview scheduling,
- interview progression,
- rejection/withdrawal,
- offer/compensation.

Preserve source/message reference, observed time, application match confidence, classifier/model/release provenance and final deterministic state transition.

### P1.2 — Gmail monitor/matcher
Wire the existing helper contracts into a real bounded monitor:
- privacy-minimized mailbox retrieval,
- classify relevant event,
- match to application deterministically/high-confidence,
- ambiguous match -> review/UNKNOWN, never silent mutation,
- dedupe repeated mail,
- write event + derived state + audit evidence.

### P1.3 — Outreach/follow-up
After real submission:
- create timed actions when useful,
- use public verified contacts,
- stop/suppress when reply/outcome makes outreach obsolete,
- keep generated outreach drafts distinct from sent actions/authority.

### P1.4 — Interview Room activation
Verified employer engagement should create/update the product Interview Room and hand off deep coaching to the appropriate learning/chat surface without duplicating canonical application state.

**P1 completion definition:** submitted applications can progress to response/interview/rejection/offer events with reliable attribution and no manual tracker bookkeeping.

---

## P2 — Make Job Copilot outcome-learning, not merely outcome-recording

### P2.1 — North-star analytics
Build normalized private metrics by cohort/version:
- qualified interview yield,
- user effort minutes/actions,
- source -> Apply -> Submit -> Response -> Screen -> Interview -> Offer funnel,
- posting age/latency,
- JD fit / representation bands,
- source/role family/domain/company patterns,
- outreach/referral effects,
- cost per prep/submission/interview,
- reliability/autonomous-recovery/avoidable-relay metrics.

Do not claim causality from small observational cohorts.

### P2.2 — Sourcing quality optimization
Once downstream outcomes exist, optimize discovery for **useful opportunity supply**:
- source coverage,
- precision of surfaced roles,
- fresh-role recall proxies,
- source contribution to qualified applications/interviews,
- duplicate/closed/noise rate.

This is where new retrieval/search providers or a more agentic multi-source sourcing worker may be tested—only against a baseline.

### P2.3 — Priority/decision calibration
Keep factual fit separate from desirability/opportunity priority. Use observed outcomes as evidence for a distinct prioritization layer, with explicit assumptions and recalibration rather than corrupting JD Fit.

### P2.4 — Candidate improvement loop
Operationalize recurring:
- evidence/experience gaps,
- market-demand gaps,
- interview question/failure themes,
- bridgeability,
- learning/project/practice suggestions.

The system may suggest a learning intervention; the user retains career strategy judgment. Later outcomes evaluate whether the intervention helped.

**P2 completion definition:** the product can explain what appears to be working, what repeatedly fails, and which scoped change to test next using attributable outcome data.

---

## P3 — Expand useful surface area only after the loop works

Candidates, ranked behind P0-P2 unless evidence changes priority:

### Browser extension / gated source capture
High value if target roles are frequently LinkedIn/authenticated-only. Capture structured DOM/text + provenance into the same intake contract; no OCR unless necessary.

### Offer analysis
Normalize offers/decision dimensions and support comparison/negotiation preparation while keeping final decision human-owned.

### Selective memory/retrieval
Introduce a retrieval system only when outcome/incident/procedure memory volume and decision boundaries justify it. Benchmark relevant/missed/stale/irrelevant retrieval before adding a vector DB.

### Safer submission automation
Only if a legitimate authorized tool can act within external-platform rules, with per-action authority, dry-run/preview, audit, stop conditions and rollback where possible. Never bypass CAPTCHA/OTP.

---

## P4 — Portal migration

Portal work begins only after the Google-stack product is a trustworthy semantic reference.

Sequence:
1. freeze proven domain/state/event/eval contracts,
2. build typed TypeScript domain package,
3. normalize PostgreSQL entities + append-only evidence/events,
4. preserve IDs/hashes/immutable artifacts/audit/failure history,
5. port regression fixtures before feature claims,
6. port durable workers/queue,
7. dual-run representative fixtures,
8. build UI last,
9. cut over with rollback after parity evidence.

See `PORTAL_MIGRATION_CONTRACT.md`.

---

## What we deliberately do not prioritize now

- multi-agent orchestration for its own sake,
- vector memory before a retrieval benchmark,
- fine-tuning/post-training,
- a portal UI before current behavior is proven,
- maximizing application volume,
- fully autonomous privileged submission.

## Next executable work package

After baseline/governance PR promotion, the **next runtime iteration** should be one bounded work package:

> **TRACE-GOLDEN-01 — minimal trace v0 + fresh URL intake through Resume Review, fixing every blocking system-owned defect encountered rather than skipping ahead.**

This package should use the Iteration Evidence Gate and `JC-LAB-002` attribution so we can measure whether outcome-first planning improves Job Copilot rather than merely adding documentation.
