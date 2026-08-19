# Janu Job Copilot — P1 Execution Plan

Status: IN PROGRESS
Baseline: production P0 1.3.8 / p0-regression-v19
Authoritative product contract: `Janu Job Copilot — Master Product & Engineering Specification` v0.16.0 (Google Drive)

## P1 objective
Complete the P1 backlog defined by CS-20260818-015 while preserving every P0 reliability, provenance, state, budget and release invariant.

P1 is an expansion of the stabilized Google-stack production worker. It is not the portal migration (P2).

## Workstreams and acceptance gates

### P1-A Retrieval and intake
- RetrievalProvider abstraction and routing: cache/direct official -> Tavily -> SerpAPI precision fallback.
- Deterministic ATS parsers/JSON-LD extraction for supported ATS pages before model extraction.
- Source-intake promotion/replay worker remains typed/fail-closed/idempotent.
- Vacancy revalidation: before expensive tailoring when >72h stale; before submission when >24h stale.
- Provenance: provider, URL, retrieval timestamp, content hash, confidence.

Gate: retrieval contract tests + parser fixtures + duplicate/promotion/vacancy tests; no regression of SOURCE/SCHEMA/WRITE/RECON controls.

### P1-B Cost, cache and queue lifecycle
- Enforce monthly and per-application spend caps using Cost Ledger.
- Mandatory vs optional work policy: optional work stops first; paid work never runs past hard cap.
- Durable output cache keyed by content hash + evidence version + prompt/schema/policy version.
- Company Cache read/reuse/field TTL enforcement.
- Dead-letter queue, replay and garbage collection with semantic-freshness checks.

Gate: budget hard-cap drill, cache-hit zero-model-call test, company TTL tests, DLQ replay/obsolete rejection tests.

### P1-C Revision, Gmail and contacts
- Revision worker consumes unresolved Google Doc comments for active resume version and creates V2/V3 without overwriting prior versions.
- Gmail outcome monitor classifies and matches application acknowledgements, recruiter replies, assessments, scheduling/interviews, rejection and offer/comp; ambiguous matches fail closed to a precise user action.
- Replace legacy contact discovery with RetrievalProvider-backed public retrieval + optional low-cost classification; no routine OpenAI web search.

Gate: revision comments -> new immutable version lineage; Gmail outcome E2E; contact provenance/zero-result completion; no hidden user blockers.

## Cross-cutting requirements
- One bounded heavy job per scheduler invocation.
- Circuit checked before state-producing maintenance and paid work.
- Strict schema writes; no silent field drops.
- Queue leases/heartbeats, semantic freshness, idempotency and scoped test/production isolation.
- External artifacts contain zero internal provenance tokens.
- Every paid call attributed before execution.
- Runtime/deterministic failures enter failure-learning machinery and remain system-owned unless only the user can resolve them.
- Existing p0-regression-v19 suite remains a mandatory non-regression gate.

## Execution order
1. Repository/P1 contract baseline and tests.
2. P1-A RetrievalProvider + deterministic ATS parsing + vacancy revalidation.
3. P1-B budget enforcement + output cache + Company Cache + DLQ/replay/GC.
4. P1-C revision worker + Gmail outcome monitoring + contact replacement.
5. Run full P0 regression plus P1 suite.
6. Live-state preflight and limited production acceptance for each P1 workstream.
7. Update living spec/decision log with implementation evidence and freeze P1 release.

## Definition of P1 done
P1 is complete only when all three workstreams pass synthetic/fixture tests and limited live acceptance, P0 regression remains green, live preflight is green, no new deterministic defect is open without prevention evidence, and broad production remains bounded/cost-controlled. P2 portal migration may then begin from the frozen P1 contracts.
