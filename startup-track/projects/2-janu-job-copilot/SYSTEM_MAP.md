# Janu Job Copilot — System Map

**Status:** Current architecture map  
**Last verified:** 2026-08-23

## 1. System classification

Janu Job Copilot is currently best classified as a **stateful AI workflow system**: deterministic orchestration/state transitions + bounded AI workers + external tools + durable state + verification + explicit human boundaries.

It is not currently one unconstrained autonomous agent, and it is not a multi-agent system. Some bounded model calls can use tools (for example web search), which is agentic behavior inside a controlled workflow.

## 2. High-level runtime

```text
User / scheduled triggers / source intake
                 |
                 v
        Apps Script harness
  triggers -> orchestrator -> queue
                 |
                 v
       bounded worker dispatch
   JD / SCORE / COMPANY / CONTACT
       RESUME / QA / PDF
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
       Sheets / Drive / Docs
       public web / ATS APIs
                 |
                 v
     durable product state
                 |
                 v
   human review/submission boundary
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
- human escalation only when evidence/authority genuinely requires it.

Representative runtime surfaces include `phase1Tick`/health tick variants, `orchestrate_` or current patched equivalents, `enqueue_`, `processQ_`, `runQ_`, worker functions and release/health helpers.

## 4. Model layer

The OpenAI model is used for semantic/generative work such as:
- JD extraction into strict schema,
- requirement/evidence mapping,
- company/contact research with bounded web search,
- evidence-grounded resume content,
- application-pack drafting,
- PDF/semantic QA where deterministic checks are insufficient.

The model does **not** own queue lifecycle, release gates, retries, durable state, final submission authority or proof that a side effect happened.

## 5. Context assembly

Typical model context is assembled just in time from selected product state, for example:
- canonical JD snapshot,
- candidate evidence registry,
- evidence map,
- base resume,
- company/contact enrichment,
- explicit instructions and JSON schema.

Context is not equivalent to all product state. Only data selected by the harness for the current call is model context.

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
- `Audit Log`,
- `__Processing Queue`,
- `__Worker State`,
- `__Cost Ledger`,
- `__Company Cache`,
- `__System Health`,
- `__Sourcing Runs`,
- `__Regression Results`,
- `__JD Artifacts`,
- `__Failure Learning`.

Script Properties also hold configuration and operational state. Product current state is not treated as "memory" merely because it persists.

## 7. Tools and environments

| Interface/tool | Environment/resource | Primary use | Side effect? |
|---|---|---|---|
| Spreadsheet APIs | Live Tracker | state, queue, audit, health | Yes |
| Drive/Docs APIs | candidate evidence, resumes, packs, captures | read/write artifacts | Yes |
| HTTP fetch | public ATS/job pages and provider APIs | retrieval | Usually read-only |
| OpenAI Responses API | model inference | semantic/generative work | External call |
| OpenAI web search tool | public web | research/enrichment | Read-only discovery |
| GitHub Actions + clasp | GitHub / Apps Script | validation/deployment | Yes, production after gate |
| Gmail (planned/partial) | mailbox | outcome monitoring | Read + controlled writeback |

Secrets belong in secure properties/CI secrets and never in committed source or generic telemetry.

## 8. Verification boundaries

Strong verification examples:
- schema/contract validation,
- read-back of persisted JD/artifact state,
- vacancy-state checks before expensive downstream work,
- evidence-ID validation,
- rendered-document structural checks,
- PDF QA,
- regression gates before deployment,
- live acceptance fixtures,
- post-write environment read-back.

Rule: a model/tool saying "success" is weaker evidence than verified state in the target environment.

## 9. Human boundary

Human involvement is intentional for:
- strategic/personal Apply/Hold/Skip judgment,
- final resume review,
- privileged external-account submission/OTP/CAPTCHA,
- materially expanding permissions or product scope.

Human involvement is a defect signal when requested only because system-owned retrieval, orchestration, queue repair, rendering, QA, reconciliation or deployment inspection failed and the system had an available control path.

## 10. Deployment architecture

```text
GitHub branch/commit
    -> GitHub Actions
    -> pull live Apps Script baseline
    -> apply idempotent patch scripts
    -> syntax + release + regression/contract validation
    -> push with clasp
    -> health/self-tests/live evidence
```

This architecture is currently safer than manual copy/paste but weaker than a fully reproducible source build because the final transformed production source is not a single checked-in canonical artifact. Deployment-source hashing/manifest evidence is a priority improvement.

## 11. Current autonomy shape

The deterministic harness owns the critical workflow path. Model freedom is bounded to semantic tasks and explicitly provided tools. More agentic routing should be introduced only when a measured failure cannot be solved reliably by the simpler workflow and a verifier can distinguish better outcomes.

See `AUTONOMY_CONTRACT.md` for permissions/stopping policy and `TRACE_SCHEMA.md` for the target evidence model.