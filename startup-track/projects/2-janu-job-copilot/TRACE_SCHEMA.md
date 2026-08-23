# Janu Job Copilot — Trace Schema

**Status:** v0 design; implementation target for Module 2  
**Last verified:** 2026-08-23

## Goal

Make a material Job Copilot run reconstructable without storing unnecessary sensitive content.

The design uses the vendor-neutral OpenTelemetry mental model: **trace -> spans -> events**, plus aggregate metrics derived from those records. GenAI-specific attribute names are intentionally kept product-owned until the relevant external semantic conventions are stable enough to depend on.

## Trace boundary

A **trace** represents one logical workflow execution episode, for example:
- one source-intake journey,
- one application progression/recovery episode,
- one explicit E2E acceptance fixture,
- one release/deployment verification run.

Multiple traces for the same application are linked with `group_id = application_id`.

Do not use one infinitely long trace for the lifetime of an application.

## Required trace fields

| Field | Meaning |
|---|---|
| `trace_id` | globally unique run ID |
| `group_id` | stable grouping ID, normally Application ID / Intake ID / release ID |
| `workflow_name` | e.g. `application_progression`, `source_intake`, `release_deploy` |
| `started_at`, `ended_at` | timestamps |
| `status` | `success`, `failed`, `blocked`, `cancelled`, `partial` |
| `release_version` | Job Copilot runtime release identity |
| `regression_suite` | bound suite/version when relevant |
| `git_commit` | code provenance when known |
| `environment` | production / test / acceptance |
| `trigger_type` | schedule, edit, recovery, manual acceptance, deployment |
| `outcome_code` | stable terminal/partial outcome classification |
| `verified_outcome_ref` | privacy-safe pointer/hash to environment evidence |

## Required span fields

| Field | Meaning |
|---|---|
| `span_id` | unique operation ID |
| `trace_id` | parent trace |
| `parent_span_id` | optional parent |
| `span_type` | orchestration / queue / worker / model / tool / persistence / verification / human_boundary |
| `name` | stable operation name |
| `started_at`, `ended_at`, `duration_ms` | timing |
| `status` | success/failed/etc. |
| `attempt` | retry attempt where relevant |
| `error_class`, `error_code` | normalized failure metadata |
| `input_ref`, `output_ref` | hash/reference, not full sensitive payload by default |
| `state_before_ref`, `state_after_ref` | optional state snapshot hash/reference |
| `cost_usd` | when attributable |
| `input_tokens`, `output_tokens` | model usage when available |

## Core span types

### Orchestration
Examples: health tick, source reconciliation, application orchestrator.

Record decisions such as `next_worker`, `stop_reason`, `circuit_state` and `precondition_result`.

### Queue
Examples: enqueue, claim, retry, cancel, terminal completion.

Existing Queue Job ID should be recorded as `queue_job_id`; idempotency key and policy/release version are important attributes.

### Worker
Examples: `JD_RETRIEVE`, `JD_PARSE_SCORE_MAP`, `COMPANY_ENRICH`, `CONTACT_ENRICH`, `RESUME_GENERATE`, `QA_FINALIZE`, `PDF_CAPTURE`.

### Model
Record model/provider, operation/schema name, tool availability, usage, latency and structured success/error. Do not store full prompt/output by default.

### Tool
Examples: official ATS fetch, Drive read/write, Sheets write, web search, provider retrieval.

Record provider/tool, result class, HTTP/status code where safe, retryability and environment verification reference.

### Persistence
Record important durable state mutations and read-back verification. This does not replace the business Audit Log.

### Verification
Examples: JD completeness gate, evidence-ID validator, artifact render integrity, vacancy-open check, PDF QA, release regression gate.

### Human boundary
Record that human authority/judgment was required, the boundary type, and whether the request was later judged avoidable. Do not log private response content in generic traces.

## Trace vs Audit vs Failure Learning

- **Trace:** what happened during an execution.
- **Audit:** important durable product/business state mutation; who/what changed it and why.
- **Failure Learning:** analyzed incident/root cause/prevention after a meaningful defect.

One event may appear in all three at different levels, but they are not interchangeable.

## Mapping from current telemetry

Existing surfaces provide a migration path:
- `__Processing Queue` -> queue/worker spans,
- `Audit Log` -> business mutation evidence,
- `__Worker State` / `__System Health` -> control-plane events/metrics,
- `__Regression Results` -> verification spans/eval evidence,
- `__Cost Ledger` -> cost metrics,
- `__Failure Learning` -> post-run incident/learning evidence.

Phase 1 tracing should normalize these existing signals before introducing a new external observability vendor.

## Minimal trace-completeness rule

For each instrumented worker execution, require at least:
1. trace/run identity,
2. queue/worker start,
3. model/tool spans where used,
4. durable state mutation or explicit no-mutation result,
5. verifier/result,
6. terminal worker outcome,
7. release/version provenance.

## Derived metrics

The schema must support derivation of:
- task completion rate,
- terminal worker failure rate by class/release/worker,
- retries per completion,
- autonomous recovery rate,
- avoidable human blocker rate,
- stall/no-active-work rate,
- end-to-end latency,
- tool/model latency and failure rate,
- model/retrieval cost per completed application,
- trace-completeness rate,
- failure-class recurrence after prevention,
- release regression/incident rate.

## Privacy

See `TELEMETRY_PRIVACY.md`. By default store IDs, hashes, metadata, schema names and outcomes—not full JD, resume, email, candidate evidence, prompts or model outputs.

## Implementation acceptance

Tracing v0 is accepted when one fresh source/application journey can be reconstructed across orchestration -> queue -> worker -> model/tool -> persistence -> verification -> outcome with one trace/group linkage, and the same data can produce at least reliability, latency, autonomy and cost metrics without manual log stitching.