# Janu Job Copilot — Memory Policy

**Status:** Policy v0; no vector-memory dependency  
**Last verified:** 2026-08-23

## Principle

Memory is selective durable information promoted for future reuse. It is not a synonym for current state, logs, traces, analytics or a vector database.

For Job Copilot, learning must keep three things separate:
1. **candidate truth** — approved factual evidence about the user,
2. **product/outcome state** — what happened in applications, submissions, email, interviews and offers,
3. **promoted learning** — scoped conclusions/procedures/hypotheses worth retrieving in a future decision.

An employer outcome cannot rewrite candidate truth, and an observed correlation is not automatically a strategy rule.

## What is not memory

- `Applications` current lifecycle state is **product state**.
- `__Processing Queue` is **execution state**.
- a raw worker/model/tool trace is **experience/evidence**.
- raw Gmail messages/outcome events are **private source evidence/events**.
- Interview Room current state is **product state**.
- the current product specification is **canonical product truth**.
- an analytics dashboard is an **aggregate projection**, not memory by itself.

These may produce memory after analysis, but they are not automatically memory.

## Memory types

### Episodic — what happened
Use for meaningful specific incidents or experiences likely to matter again.

Examples:
- important product/release failure,
- unusual application/submission/outcome episode,
- specific interview learning episode when future preparation benefits from recalling it.

Primary current source: private Failure Learning plus selected acceptance/outcome/interview records.

Required metadata: incident/event ID, scope, release/time, evidence reference, outcome, confidence, sensitivity, current/superseded state.

### Semantic — what we know
Verified reusable facts/relationships.

Examples:
- stable provider/API behavior,
- a durable domain rule,
- a sufficiently evidenced statement that a particular job-search pattern appears relevant within a defined scope.

Do not promote rapidly changing job/company facts into generic long-lived semantic memory when they belong in current retrieval/state. Do not promote a small sample hiring correlation as a fact.

### Procedural — how we work
Reusable operational method proven useful.

Examples:
- release preflight,
- exact target read-back,
- source-retrieval fallback order,
- follow-up suppression after verified reply,
- interview-note capture procedure.

Best storage is often a runbook/skill/procedure rather than free text injected everywhere.

### Decision — what we chose and why
Architecture/product/security/strategy decisions with alternatives, rationale, evidence and revisit conditions.

Examples:
- deterministic orchestrator retained instead of agentic orchestration,
- production merges approval-gated until release reliability improves,
- factual JD Fit remains separate from learned opportunity priority,
- a particular sourcing/positioning experiment is adopted/rejected for a defined cohort.

### Executable — prevention or policy that runs
Tests, evals, linters, schema validators, release gates, guardrails and invariants.

Prefer executable memory for recurring mechanically checkable failures.

Examples:
- closed vacancy stops downstream work,
- ambiguous email match cannot mutate application state,
- duplicate source cannot create a second application,
- public docs cannot contain protected private identifiers.

## Outcome-learning candidates

The complete product loop may eventually promote scoped learning about:
- source/channel usefulness,
- role family/domain/company patterns,
- opportunity-priority factors distinct from factual fit,
- resume/positioning approaches,
- outreach/referral strategies,
- recurring evidence/skill gaps,
- interview question/failure themes,
- product-system failure/recovery patterns.

Each candidate learning must preserve:
- the underlying cohort/event/trace references,
- outcome-lag window,
- sample size or evidence sufficiency,
- whether the result is observation, hypothesis or demonstrated effect,
- scope/segments where it may apply,
- confidence,
- contraindications/known exceptions,
- a review/expiry/retest condition.

## Promotion criteria

Promote experience only when at least one is true:
- it materially changes current product truth,
- it explains an important decision,
- it is a meaningful incident or recurring pattern,
- it creates a reusable procedure,
- it can prevent recurrence through an executable control,
- it is a valuable product/candidate strategy hypothesis requiring future retrieval and evaluation.

Do not promote:
- one-off noise,
- unverified model claims,
- stale facts already represented in canonical state,
- a single rejection/response as a universal job-search lesson,
- correlation as causal strategy,
- sensitive raw content when a reference/generalized lesson is enough.

## Required memory metadata

Every durable memory record should preserve:
- `memory_id`,
- `memory_type`,
- `product/component/decision scope`,
- `statement/procedure/decision/hypothesis`,
- `evidence_refs`,
- `confidence`,
- `evidence_status`: observation / hypothesis / supported / demonstrated where relevant,
- `created_at`,
- `last_verified_at`,
- `valid_from` / optional expiry or review trigger,
- `release/version/cohort context`,
- `status`: current / superseded / disputed / expired,
- `supersedes` / `superseded_by`,
- sensitivity/data class,
- retrieval tags/decision boundaries where it is useful.

## Retrieval policy

Retrieve memory just in time based on task/component/entity/failure class/decision boundary. Do not load all memory into every prompt.

Examples:
- sourcing decision -> relevant sourcing/priority learning,
- resume generation -> canonical evidence + only validated positioning procedures, not unrelated interview history,
- interview preparation -> relevant role/JD/interview memories,
- incident repair -> relevant failure/procedure/executable memory.

Before use, filter by:
- scope,
- provenance/evidence strength,
- freshness/cohort relevance,
- supersession,
- sensitivity/permission,
- relevance to the current decision.

## Retrieval evaluation

When a retrieval system is implemented, test:
- relevant memory retrieved,
- relevant memory missed,
- irrelevant/context-polluting memory retrieved,
- stale/superseded memory retrieved,
- overly broad strategy learning applied outside scope,
- downstream usefulness compared with no-memory baseline.

A memory store that is never correctly retrieved has not improved the product.

## Current mapping

| Existing / planned Job Copilot surface | Memory role |
|---|---|
| private `__Failure Learning` | episodic incident source; some records become procedural/executable memory |
| `__Regression Results` | executable-memory evidence |
| Git release/implementation docs | decision/current-state evidence, not model memory by default |
| canonical candidate evidence registry | protected candidate truth/context; **not** learned memory |
| Application/submission/outcome/Interview state | product/event truth; input to learning, not memory by default |
| `Skill Gaps` | current candidate-improvement backlog; selected repeated patterns may later become scoped semantic/decision memory |
| `Audit Log` | mutation evidence; not automatically memory |
| `BUILD_NOTES.md` | reader-facing narrative, not canonical memory store |
| private `__Lab Improvements` | experiment evidence for builder/Lab learning |
| AI Systems Lab Canon | parent reusable knowledge only after cross-product/generalization gate |

## No vector DB yet

A vector database is not required until:
- memory volume/recall need exceeds simple structured/lexical lookup,
- retrieval decision boundaries are known,
- enough submission/outcome/interview experience exists to produce useful promoted memories,
- a retrieval benchmark exists,
- privacy/supersession metadata can be enforced.

Until then, structured records + explicit retrieval by IDs/tags/components are simpler and more auditable.

## Product -> Lab promotion

Only generalized, non-sensitive lessons with evidence may move to the parent AI Systems Lab. Preserve Job Copilot-specific state/PII/mailbox/traces in the product boundary. A successful product lesson is a candidate for generalization, not automatic universal truth.
