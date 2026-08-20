# Janu Job Copilot — Portal Migration Contract

Status: active migration contract
Master spec: 0.20.0 / CS-20260820-027

## North star
Do not rebuild the spreadsheet as a website. The portal is a normalized, typed operational platform built from behavior and data contracts already proven in the Google-stack product. Sheets remain a migration/source/audit reference; Dashboard, My Actions and Resume Review are derived views, not canonical stores.

## Migration order
1. Close real P1 worker integration and freeze validated state semantics.
2. Build a reusable TypeScript domain package before UI work.
3. Create PostgreSQL migrations for normalized entities and append-only evidence/event history.
4. Import existing data while preserving stable IDs, hashes, timestamps, immutable resume/JD artifacts and audit lineage.
5. Port deterministic fixtures and Failure Learning guardrails before claiming feature parity.
6. Port backend workers/queues with the same idempotency, lease, retry, circuit, budget and failure semantics.
7. Dual-run representative Sheet and portal fixtures and compare state/evidence/output parity.
8. Build UI over typed APIs and derived views.
9. Cut over only after regression, preflight, migration-integrity and rollback gates pass.

## Required domain contracts
- Typed application/job/source/resume/interview/outreach states. No free-text state transitions in worker code.
- Contract self-test PASS is necessary but not sufficient: feature completion requires real worker wiring, representative live fixture acceptance, persisted evidence/readback and non-regression.
- Every external/paid operation is attributable to job/application, worker attempt, provider/model, cost and evidence/result.
- Submitted resume versions and canonical evidence artifacts are immutable.
- Ambiguous outcome/contact/source matches fail closed instead of guessing.
- User actions are created only for genuine user-only blockers.

## Retrieval and vacancy model
The current Sheet vacancy columns are a latest-state projection. Portal history is canonical in append-only entities.

### retrieval_attempts
Minimum fields:
- id
- job_id / application_id when applicable
- worker_attempt_id
- provider
- request_kind
- source_url / query fingerprint
- retrieved_at
- http/status outcome
- content_hash
- confidence
- source_artifact_id
- cost_ledger_id when paid
- error/failure classification

### vacancy_verifications
Minimum fields:
- id
- job_id
- verified_at
- vacancy_status: open | closed | unknown | superseded
- provider
- source_url
- content_hash
- confidence
- retrieval_attempt_id
- source_artifact_id
- worker_attempt_id

jobs/applications may denormalize latest vacancy state/timestamp for UI performance, but append-only vacancy_verifications remains authoritative history.

### jd_snapshots / source_artifacts
- jd_snapshots references the retrieval_attempt/source_artifact that produced it.
- source_artifacts are immutable and provenance-addressable by provider, source URL and content hash.
- deterministic ATS/JobPosting extraction runs before LLM fallback where sufficient.

## Provider and security contract
- Provider configuration stores capability flags and secret references only; never raw API keys in repo/domain rows.
- Server-side URL fetching rejects localhost, loopback, RFC1918/private ranges, link-local and cloud metadata endpoints before any request.
- Background health/vacancy refresh may not use paid fallback unless the callsite has explicitly passed budget policy and cost attribution.
- Retrieval route remains cheapest adequate source first: cache/evidence → official/public → configured low-cost provider → precision fallback → authenticated/user artifact boundary.

## Release and Failure Learning invariants
These are architectural requirements learned from production execution, not temporary Apps Script workarounds:
- Additive migrations/patches are idempotent at the smallest independently installable contract unit and converge safely from partial state.
- Release/schema/state identity is parsed from canonical structures, not broad global text regex/search.
- Source mutation never reuses stale character offsets after length-changing edits; structural anchors are re-resolved.
- Token/function presence alone cannot make a transformed artifact PASS. Syntax/type/full-contract/regression validation is required before promotion.
- Deployment failures should fail before production mutation wherever technically possible.
- Failure events feed a durable Failure Learning ledger with root cause, why tests missed it, blast radius, prevention, regression test and reusable guardrail.

## P1 acceptance required before portal parity baseline
### P1-A
At least one currently blocked official ATS fixture (preferred Metaforms 2026-08-04-002 or Hinge Health 2026-08-06-003) must recover the JD automatically, persist provenance/vacancy evidence, restore/generate the canonical JD snapshot, remove an avoidable JD-PDF blocker, and resume downstream processing without manual upload.

### P1-B
Real paid calls must be budget-gated and cost-attributed; output cache, Company Cache TTL, DLQ/replay and GC must execute in actual workers, not only helper self-tests.

### P1-C
Docs-comment revision handling must create immutable next versions; Gmail outcomes must classify and deterministically match or fail closed; contact enrichment must use RetrievalProvider-backed public evidence.

## Portal parity gate
A portal feature is not accepted because its UI looks equivalent. Parity is proven when the same fixture/input produces an equivalent allowed state transition, evidence/provenance, immutable artifacts, user blocker behavior, cost/failure telemetry and audit record under the same acceptance rules.
