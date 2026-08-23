# Janu Job Copilot — System Map

**Status:** Current architecture + target product-loop map  
**Last verified:** 2026-08-23

## 1. System classification

Janu Job Copilot is currently best classified as a **stateful AI workflow system**: deterministic orchestration/state transitions + bounded AI workers + external tools + durable state + verification + explicit human boundaries.

It is not currently one unconstrained autonomous agent, and it is not a multi-agent system. Some bounded model calls can use tools (for example web search), which is agentic behavior inside a controlled workflow.

The product scope is broader than the currently most-proven application-preparation path. The target system is a personal career operating system spanning discovery -> application -> submission -> employer outcomes -> interview/offer learning.

## 2. High-level runtime

```text
Sources / user URLs / scheduled discovery
                 |
                 v
        Apps Script harness
  triggers -> orchestrator -> queue
                 |
                 v
       bounded worker dispatch
 intake / vacancy / JD / score
 company / contact / resume / QA
 outcome / outreach / interview (partial/planned)
                 |
      +----------+----------+
      |                     |
      v                     v
 deterministic code      OpenAI model
 + verifiers             structured outputs
      |                     |
      +----------+----------+
                 |
                 v
 Sheets / Drive / Docs / public web
      Gmail (partial/planned)
                 |
                 v
        durable product state
                 |
      +----------+----------+
      |                     |
      v                     v
 human review/submission   employer outcomes
 / strategy authority      / interview events
      |                     |
      +----------+----------+
                 v
      analytics / calibration
      product + candidate learning
```

## 3. Harness/control plane

Primary responsibilities:
- trigger installation and periodic ticks,
- locking/concurrency control,
- source/blocker reconciliation,
- deterministic orchestration,
- queue creation and idempotency,
- bounded worker dispatch,
- retry/backoff and terminal failure handling,
- state transitions,
- health/circuit/release gates,
- verification before advancing,
- event/outcome attribution where matching can be made safely,
- human escalation only when evidence/authority genuinely requires it.

Representative runtime surfaces include `phase1Tick`/health tick variants, `orchestrate_` or current patched equivalents, `enqueue_`, `processQ_`, `runQ_`, worker functions and release/health helpers.

The orchestrator should remain deterministic for critical lifecycle control until an eval demonstrates that more agentic planning improves outcomes without unacceptable reliability/cost risk.

## 4. Model layer

The OpenAI model is used for semantic/generative work such as:
- JD extraction into strict schema,
- requirement/evidence mapping,
- company/contact research with bounded web search,
- evidence-grounded resume content,
- application-pack drafting,
- PDF/semantic QA where deterministic checks are insufficient,
- later bounded email/outcome classification, interview synthesis and learning hypothesis generation.

The model does **not** own queue lifecycle, release gates, retries, durable state, final submission authority, factual candidate truth or proof that a side effect happened.

## 5. Context assembly

Typical model context is assembled just in time from selected product state, for example:
- canonical JD snapshot,
- canonical candidate evidence registry,
- evidence map,
- base/current resume artifact,
- company/contact enrichment,
- relevant outcome/interview history when the task needs it,
- explicit instructions and JSON schema.

Context is not equivalent to all product state or memory. Only data selected by the harness for the current call is model context.

## 6. Durable state

Primary state surfaces in the live tracker include:
- `Applications`,
- `Sources Inbox`,
- `My Actions`,
- `JD Snapshots`,
- `JD Evidence Map`,
- `Company Enrichment`,
- `Contacts`,
- `Resume Registry`,
- `Resume Review`,
- `Outreach`,
- `Interview Rooms`,
- `Skill Gaps`,
- `Weekly Review`,
- `Audit Log`,
- `__Processing Queue`,
- `__Worker State`,
- `__Cost Ledger`,
- `__Company Cache`,
- `__System Health`,
- `__Sourcing Runs`,
- `__Regression Results`,
- `__JD Artifacts`,
- `__Failure Learning`,
- `__Lab Improvements`.

Script Properties also hold configuration and operational state. Product current state is not treated as "memory" merely because it persists.

### Missing durable event layer

The whole JTBD needs a normalized, append-oriented event model for post-submission facts such as:
- submission confirmation,
- acknowledgement,
- recruiter reply,
- assessment,
- screening/interview scheduling,
- interview stage/result,
- rejection/withdrawal,
- offer/compensation/decision.

The current tracker may initially project these into existing sheets/rows, but the event identity/provenance must be durable enough for later analytics and portal migration.

## 7. Tools and environments

| Interface/tool | Environment/resource | Primary use | Side effect? |
|---|---|---|---|
| Spreadsheet APIs | private Live Tracker | state, queue, audit, health, outcome/event projections | Yes |
| Drive/Docs APIs | candidate evidence, resumes, packs, captures | read/write artifacts | Yes |
| HTTP fetch | public ATS/job pages and provider APIs | retrieval | Usually read-only |
| OpenAI Responses API | model inference | semantic/generative/classification work | External call |
| OpenAI web search tool | public web | research/enrichment | Read-only discovery |
| GitHub Actions + clasp | GitHub / Apps Script | validation/deployment | Yes, production after gate |
| Gmail (partial/planned) | mailbox | employer-outcome monitoring/matching | Read + controlled private writeback |
| Browser extension (planned) | gated job pages | structured source capture | Controlled intake write |
| Authenticated job site/browser | external application | final submission | Human boundary today |

Secrets belong in secure properties/CI secrets and never in committed source or generic telemetry.

## 8. Verification boundaries

Strong verification examples:
- schema/contract validation,
- read-back of persisted source/JD/artifact/outcome state,
- vacancy-state checks before expensive downstream work and before submission,
- evidence-ID validation,
- rendered-document structural checks,
- PDF QA,
- deterministic/fail-closed employer-event matching,
- exact submitted-resume version writeback after real confirmation,
- regression gates before deployment,
- live acceptance fixtures,
- post-write environment read-back.

Rule: a model/tool saying "success" is weaker evidence than verified state in the target environment.

## 9. Human boundary

Human involvement is intentional for:
- strategic/personal Apply/Hold/Skip judgment when not captured by explicit policy,
- final resume review/revision judgment,
- privileged external-account submission/OTP/CAPTCHA,
- interview participation and irreducible reflection,
- final offer/negotiation/career decisions,
- materially expanding permissions or product scope.

Human involvement is a defect signal when requested only because system-owned retrieval, orchestration, queue repair, rendering, QA, reconciliation, monitoring or deployment inspection failed and the system had an available control path.

## 10. Deployment architecture

```text
GitHub branch/commit
    -> GitHub Actions
    -> pull live Apps Script baseline
    -> apply idempotent patch scripts
    -> syntax + release + regression/contract validation
    -> transformed-source manifest/hash
    -> push with clasp
    -> post-push source verification
    -> health/self-tests/live evidence
```

This architecture is currently safer than manual copy/paste but weaker than a fully reproducible private source build because the final transformed production source is not yet stored as one durable private canonical artifact. The baseline branch adds hash/manifest/rollback controls; a private runtime-source version store remains a future infrastructure gap.

## 11. Current autonomy shape

The deterministic harness owns the critical workflow path. Model freedom is bounded to semantic tasks and explicitly provided tools. More agentic routing should be introduced only when a measured failure cannot be solved reliably by the simpler workflow and a verifier can distinguish better outcomes.

Potential future agentic candidates include multi-source sourcing/research where the path is genuinely open-ended. They are not prerequisites for the current E2E/value loop.

## 12. Product outcome loops

### Loop A — Opportunity/application execution
```text
source -> verify -> score/decide -> tailor -> QA/review -> submit
```

### Loop B — Employer outcome
```text
submitted -> outreach/follow-up -> email/employer event -> interview/rejection/offer
```

### Loop C — Candidate/product learning
```text
outcomes + user corrections + interview evidence
 -> scoped pattern/hypothesis
 -> sourcing/priority/positioning/skill/product change
 -> targeted eval/experiment
 -> later outcome comparison
```

### Loop D — AI Systems Lab / builder improvement
```text
product traces/failures/metrics
 -> Lab/builder change hypothesis
 -> implementation
 -> independent eval/real outcome
 -> Keep / Revise / Reject
```

`OUTCOME_MODEL.md` defines the user-value ladder. `PRODUCT_CAPABILITY_MAP.md` marks current proof status. `EXECUTION_ROADMAP.md` defines the dependency order.

## 13. Future portal boundary

Portal migration should normalize the proven domain/events rather than copy the spreadsheet UI. Expected stable concepts include:
- source/opportunity/job,
- application,
- retrieval attempt / vacancy verification / JD snapshot,
- evidence mapping,
- resume version / submitted artifact,
- outreach action,
- employer outcome event,
- interview session/event,
- skill gap / learning intervention,
- worker attempt / trace / cost / audit / failure / release.

See `PORTAL_MIGRATION_CONTRACT.md`; UI work is downstream of semantic acceptance.

See `AUTONOMY_CONTRACT.md` for permissions/stopping policy and `TRACE_SCHEMA.md` for the target evidence model.
