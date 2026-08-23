# Janu Job Copilot — Memory Policy

**Status:** Policy v0; no vector-memory dependency  
**Last verified:** 2026-08-23

## Principle

Memory is selective durable information promoted for future reuse. It is not a synonym for current state, logs, traces or a vector database.

## What is not memory

- `Applications` current lifecycle state is **product state**.
- `__Processing Queue` is **execution state**.
- a raw worker/model/tool trace is **experience/evidence**.
- the current product specification is **canonical product truth**.

These may produce memory after analysis, but they are not automatically memory.

## Memory types

### Episodic — what happened
Use for meaningful specific incidents or experiences likely to matter again.

Primary current source: `__Failure Learning` and selected acceptance/release incidents.

Required metadata: incident ID, scope, release/time, evidence reference, outcome, confidence, current/superseded state.

### Semantic — what we know
Verified reusable facts/relationships, for example supported provider behavior or a stable domain rule.

Do not promote rapidly changing job/company facts into generic long-lived semantic memory when they belong in current retrieval/state.

### Procedural — how we work
Reusable operational method proven useful, for example release preflight, exact target read-back, schema migration procedure or source-retrieval fallback order.

Best storage is often a runbook/skill/procedure rather than free text injected everywhere.

### Decision — what we chose and why
Architecture/product/security decisions with alternatives, rationale, evidence and conditions for revisiting.

Examples: deterministic orchestrator retained instead of agentic orchestration; production merges approval-gated until release reliability improves.

### Executable — prevention that runs
Tests, evals, linters, schema validators, release gates, guardrails and invariants.

Prefer executable memory for recurring mechanically checkable failures.

## Promotion criteria

Promote experience only when at least one is true:
- it materially changes current product truth,
- it explains an important decision,
- it is a meaningful incident or recurring pattern,
- it creates a reusable procedure,
- it can prevent recurrence through an executable control,
- it is a valuable assumption/opportunity requiring future retrieval.

Do not promote:
- one-off noise,
- unverified model claims,
- stale facts already represented in canonical state,
- sensitive raw content when a reference/generalized lesson is enough.

## Required memory metadata

Every durable memory record should preserve:
- `memory_id`,
- `memory_type`,
- `product/component scope`,
- `statement/procedure/decision`,
- `evidence_refs`,
- `confidence`,
- `created_at`,
- `last_verified_at`,
- `valid_from` / optional expiry or review trigger,
- `release/version context`,
- `status`: current / superseded / disputed / expired,
- `supersedes` / `superseded_by`,
- sensitivity/data class,
- retrieval tags/decision boundaries where it is useful.

## Retrieval policy

Retrieve memory just in time based on task/component/entity/failure class. Do not load all memory into every prompt.

Before use, filter by:
- scope,
- provenance/evidence strength,
- freshness,
- supersession,
- sensitivity/permission,
- relevance to the current decision.

## Retrieval evaluation

When a retrieval system is implemented, test:
- relevant memory retrieved,
- relevant memory missed,
- irrelevant/context-polluting memory retrieved,
- stale/superseded memory retrieved,
- downstream usefulness compared with no-memory baseline.

A memory store that is never correctly retrieved has not improved the product.

## Current mapping

| Existing Job Copilot surface | Memory role |
|---|---|
| `__Failure Learning` | episodic incident source; some records can become procedural/executable memory |
| `__Regression Results` | executable-memory evidence |
| Git release/implementation docs | decision/current-state evidence, not model memory by default |
| canonical candidate evidence registry | product knowledge/state used as context; sensitive and separately governed |
| `Audit Log` | mutation evidence; not automatically memory |
| `BUILD_NOTES.md` | reader-facing narrative, not canonical memory store |
| AI Systems Lab Canon | parent reusable knowledge only after cross-product/generalization gate |

## No vector DB yet

A vector database is not required until:
- memory volume/recall need exceeds simple structured/lexical lookup,
- retrieval decision boundaries are known,
- a retrieval benchmark exists,
- privacy/supersession metadata can be enforced.

## Product -> Lab promotion

Only generalized, non-sensitive lessons with evidence may move to the parent AI Systems Lab. Preserve Job Copilot-specific state/PII/traces in the product boundary. A successful product lesson is a candidate for generalization, not automatic universal truth.