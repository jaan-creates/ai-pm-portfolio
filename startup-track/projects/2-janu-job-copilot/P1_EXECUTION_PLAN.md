# Janu Job Copilot — P1 Execution Plan

Status: IN PROGRESS
P0 baseline: current production release must be pulled and validated at deployment time; P1 must not downgrade or rewrite the P0 identity.

## P1-A — retrieval and intake
- Retrieval route: cache -> direct official source -> Tavily -> SerpAPI fallback.
- Deterministic JobPosting JSON-LD/ATS recognition before model extraction.
- Provenance includes provider, canonical URL, retrieval timestamp, content hash and confidence.
- Vacancy revalidation before tailoring when evidence is >72h old and before submission when >24h old.
- Source promotion is content/evidence idempotent and closed vacancies fail closed.

Gate: deterministic P1-A contract tests plus the complete existing P0 regression/preflight gates.

## P1-B — cost/cache/queue lifecycle
- Hard monthly/per-application caps; optional paid work stops first.
- Versioned output cache and Company Cache TTLs.
- DLQ/replay/GC with semantic freshness.

## P1-C — revisions/outcomes/contacts
- Immutable resume revision lineage from unresolved comments.
- Gmail outcome classification/matching with ambiguous matches failing closed.
- RetrievalProvider-backed public contact discovery.

## Release invariant
P1 is additive. A P1 deployment must pull the live Apps Script first, assert it is on the accepted P0 baseline or newer compatible release, add P1 code, run syntax/contract checks, and only then push. No stale P0 patcher may run in the P1 deployment path.
