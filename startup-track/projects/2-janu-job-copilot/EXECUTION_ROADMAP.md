# Janu Job Copilot — Outcome-Aligned Execution Roadmap

**Status:** Active priority plan  
**Last verified:** 2026-08-24  
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

### P0.0 — Restore bounded runtime and truthful release health
**Goal:** no later golden-path proof is valid while the worker can spend its execution window discovering that there is no runnable job, or while release health can auto-close around open blockers.

Current blockers:
- `FL-080`: Worker Runtime `RUNTIME_BUDGET`; production evidence narrows this occurrence to the no-runnable queue-selection path rather than a claimed heavy worker.
- `FL-072`: source push/pull hash can succeed while target function execution/readback remains unavailable through the current clasp Execution API path.
- `FL-078` family: Regression Gate can still appear healthy while renderer/runtime release blockers remain open.

Work:
- source-confirm `nextQ_` / semantic-freshness selection behavior,
- bound queue selection with a hard slice/deadline and batch/cursor reads,
- preserve execution reserve before historical queue scanning,
- keep maintenance/reconcile/trace hooks separately sliced,
- prove blocker-aware health persistence across repeated target cycles,
- obtain legitimate target runtime/self-test/readback evidence without confusing source transport success with execution success.

Required tests:
- `QUEUE-NOJOB-BUDGET-001`,
- `RUNTIME-PREMAINT-BUDGET-001`,
- `RUNTIME-ONEJOB-RESERVE-001`,
- `E2E-LIVENESS-BUDGET-001`,
- `REGRESSION-HEALTH-BLOCKER-JOIN-001`,
- `DEPLOY-ATOMIC-READBACK-001`.

Exit:
- Worker Runtime can complete a production-shaped no-runnable cycle within its slice and leave reserve,
- one clean target cycle succeeds without manual symptom clearing,
- Regression Gate stays fail-closed while any material release/runtime blocker is open,
- source identity and target execution/readback are both attributable.

### P0.1 — Finish renderer recurrence containment
**Goal:** make the shared resume renderer safe before broad resume work resumes.

Source contract currently includes:
- `RENDER-CAREERBREAK-V2`,
- exact `RENDER-CAREERBREAK-001`,
- executable enqueue/claim quarantine,
- recurrence-prevention identity `PREVENTION-RECURRENCE-001`,
- blocker-aware health enforcement source.

Work:
- obtain target renderer self-test/readback under the exact deployed source generation,
- keep normal `RESUME_GENERATE` blocked,
- after P0.0 passes, authorize exactly one canary,
- verify semantic 3/3 Career Break / Independent Building bullet preservation in the target artifact,
- only then unlock bounded backlog replay.

Exit:
- exact escaped regression + target self-test pass,
- target source/release provenance is exact,
- one live canary passes,
- recurrence family remains quiet through required monitoring cycles.

### P0.2 — Close approval/projection semantics before visual-template work
**Goal:** one user approval signal must cleanly move the product from content review to a system-owned finalization stage without stale user actions or contradictory surfaces.

Active contract (`CS-20260824-033`):

```text
JD/evidence
→ Tailoring
→ Content Review
→ Approved
→ Generate Submission Assets
→ Post-Render QA
→ Ready to Submit
→ Submitted
```

`Revision Needed` returns to Tailoring/Content Review with immutable version history.

Work now, independent of final HTML/CSS design:
- approval closes the review action exactly once,
- zero `My Actions` during system-owned render/QA/finalization,
- Applications / Resume Registry / Resume Review projections converge,
- readiness is derived from approved current version + passed QA + exact final asset + current/open vacancy evidence + no system blocker,
- stale/UNKNOWN vacancy cannot coexist truthfully with `Submission Ready = Yes`,
- final artifact provenance contract includes approved content hash, resume version, template version, renderer build/release, PDF hash and QA evidence,
- Submission Assets is the canonical artifact home; My Actions may only link to it for a genuine manual-submission boundary.

Visual HTML/CSS styling, section order and the user’s Enhancv-inspired reference are explicitly deferred to a later design turn. Do not make the renderer state machine depend on those visual choices.

Required tests include:
- `MYACTION-SUPERSESSION-001`,
- `MYACTION-POSTAPPROVAL-001`,
- `APPROVAL-GATE-001`,
- `APPROVAL-GATE-002`,
- `POST-APPROVAL-LIVENESS-001`,
- `ARTIFACT-HOME-001`,
- `IMMUTABLE-SUBMISSION-001`,
- vacancy-readiness consistency negative case.

Exit:
- Approved path and Revision Needed path both converge without stale projections,
- no system-owned work appears as a user action,
- exact approved version and final artifact are derivable,
- existing pre-approval PDFs are treated only as migration evidence, not proof of the new flow.

### P0.3 — Fresh URL intake -> correct application decision with trace
**Goal:** start the acceptance journey from a genuinely fresh source, not a pre-existing Application row, and reconstruct the same journey.

Work:
- URL canonicalization and official evidence retrieval,
- deterministic/strong-key dedupe first,
- JD/vacancy persistence and provenance,
- no PDF/manual upload when authorized official evidence is sufficient,
- system-sourced opportunity must not hard-code Apply before decision policy,
- user-sourced direct URL may carry Apply intent per policy but still obey safety/evidence gates,
- `TRACE-GOLDEN-V0-2` correlation across source, queue, artifact, QA and state transitions.

Exit:
- one real current relevant URL enters once,
- rerun creates no duplicate application/JD/action/queue artifact,
- decision and promotion are correct and traceable,
- stale fixture locks cannot masquerade as fresh proof.

### P0.4 — Score -> tailor -> review -> approval-gated render/QA -> Ready
**Goal:** drive the same fresh accepted fixture through the new lifecycle without silent stalls.

Work:
- scoring/evidence map continuation,
- company enrichment non-blocking,
- structured `ResumeDocument` generation,
- content review/revision boundary,
- approval freezes exact content version/hash,
- only then render the official submission asset,
- deterministic + semantic post-render QA,
- vacancy revalidation before readiness,
- every non-terminal system state has active work/retry or a genuine blocker.

Exit:
- fresh fixture reaches Ready to Submit,
- no avoidable user blocker,
- no pre-approval official PDF,
- artifact provenance/QA/trace/release evidence complete.

### P0.5 — Real submission + immutable provenance
**Goal:** close the genuine authenticated application boundary honestly.

Ready gate requires:
- approved current resume content/version,
- final submission asset exists and matches approved content/template provenance,
- QA passed,
- canonical application URL,
- vacancy OPEN/current per policy,
- no system blocker.

After genuine user-authenticated submission:
- explicit confirmation/evidence,
- set Submitted/Applied Date only afterward,
- freeze exact Resume Version ID + artifact/provenance actually used,
- audit the mutation,
- duplicate rerun cannot create a second submission state/event.

### P0.6 — Negative and recovery confidence
Before declaring the application loop stable, prove:
- verified CLOSED vacancy stops downstream work,
- stale/UNKNOWN vacancy blocks readiness,
- duplicate source is idempotent,
- transient provider error retries boundedly,
- deterministic failure fails closed/learns,
- no hidden/stale `My Actions` blocker,
- no-work queue path remains bounded,
- production release/regression gates reflect material blockers truthfully.

**P0 completion definition:** one fresh source-to-real-submission journey + negative/idempotency/liveness paths with traceable current-release evidence.

---

## P1 — Close the employer-outcome and communication loop

### P1.1 — Outcome event model
Create a durable event contract for acknowledgement, recruiter response, assessment, screen/interview scheduling/progression, rejection/withdrawal and offer/compensation. Preserve source/message reference, observed time, application match confidence, classifier/model/release provenance and final deterministic state transition.

### P1.2 — Gmail monitor/matcher
Wire existing helper contracts into a real bounded monitor:
- privacy-minimized mailbox retrieval,
- classify relevant event,
- deterministic/high-confidence application match,
- ambiguous match -> review/UNKNOWN, never silent mutation,
- dedupe repeated mail,
- write event + derived state + audit evidence.

### P1.3 — Outreach/follow-up
After real submission:
- create timed actions when useful,
- use public verified contacts,
- stop/suppress when reply/outcome makes outreach obsolete,
- keep drafts distinct from sent actions/authority.

### P1.4 — Interview Room activation
Verified employer engagement creates/updates the Interview Room and hands off deep coaching without duplicating canonical application state.

**P1 completion definition:** submitted applications progress to response/interview/rejection/offer events with reliable attribution and no manual tracker bookkeeping.

---

## P2 — Make Job Copilot outcome-learning, not merely outcome-recording

### P2.1 — North-star analytics
Normalize private metrics by cohort/version: qualified interview yield, user effort, source→Apply→Submit→Response→Screen→Interview→Offer funnel, posting age/latency, fit/representation bands, source/role/domain/company patterns, outreach/referral effects, cost per prep/submission/interview, reliability/autonomous-recovery/avoidable-relay metrics.

### P2.2 — Sourcing quality optimization
Use downstream outcomes to optimize useful opportunity supply: coverage, precision, fresh-role recall proxies, source contribution to qualified applications/interviews, duplicate/closed/noise rate.

### P2.3 — Priority/decision calibration
Keep factual JD Fit separate from desirability/opportunity priority. Use outcomes for a distinct, explicit prioritization layer rather than corrupting factual fit.

### P2.4 — Candidate improvement loop
Operationalize recurring evidence/experience gaps, market-demand gaps, interview themes, bridgeability and scoped learning/project/practice suggestions. Evaluate interventions against later outcomes without claiming causality from small cohorts.

### P2.5 — Failure-learning effectiveness
Normalize Failure Learning so policy can be queried operationally:
- primary/secondary failure class,
- severity,
- failure-family recurrence linkage,
- scoped prevention lifecycle/effectiveness,
- supersession/refinement relation,
- Verification Ledger linkage rather than duplicated proof.

See issue `#19`. Raw traces/application/mail data remain private evidence, not automatic memory.

**P2 completion definition:** the product can explain what appears to work, what repeatedly fails, which prevention is effective/ineffective, and which scoped change to test next using attributable evidence.

---

## P3 — Expand useful surface area only after the loop works

Rank behind P0-P2 unless evidence changes priority:
- browser extension / gated source capture,
- offer analysis,
- selective memory/retrieval only after a retrieval benchmark,
- safer authorized submission automation only with per-action authority/audit/stop conditions.

Do not prioritize multi-agent orchestration, vector memory or fine-tuning without a measured capability gap.

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

- visual HTML/CSS resume template implementation before the user supplies the reference structure/order,
- multi-agent orchestration for its own sake,
- vector memory before a retrieval benchmark,
- fine-tuning/post-training,
- a portal UI before current behavior is proven,
- maximizing application volume,
- fully autonomous privileged submission.

## Next executable work package

The immediate bounded work package is now:

> **FL-080 runtime-reserve recovery — source-confirm and bound no-runnable queue selection, prove clean target liveness, then resume the renderer/approval-gated TRACE golden path.**

After that, continue the same outcome-first rule: fix every blocking system-owned defect encountered rather than bypassing the fixture or converting system work into user work. Use the Iteration Evidence Gate, Failure Learning, Verification Ledger and privacy-safe Git references for attribution.
