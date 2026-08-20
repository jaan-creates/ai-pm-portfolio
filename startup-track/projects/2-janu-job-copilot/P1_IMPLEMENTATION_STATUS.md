# Janu Job Copilot — P1 Implementation Status

Production baseline: 1.3.8 / p0-regression-v19

## Evidence already live
- P1-A contract/self-test: PASS.
- P1-A runtime adapter self-test: PASS (`P1-A-RUNTIME-1`).
- P1-B contract/self-test: PASS.
- P1-C contract/self-test: PASS.
- P1-A bounded vacancy worker self-test: PASS (`P1-A-VACANCY-1`).
- `p1a_vacancy_last_result = PASS` from scheduled health telemetry on 2026-08-20.
- Direct-official/Tavily/SerpAPI runtime adapters are present in production and preserve P0 release validation.
- Applications vacancy/provenance schema migration is complete and read back successfully.
- Metaforms application `2026-08-04-002` received live vacancy evidence without changing Decision/Status: provider `DIRECT_OFFICIAL`, canonical Ashby URL, non-empty content hash, vacancy state `UNKNOWN`. This proves bounded retrieval/writeback but not yet full JD recovery.

## Important implementation truth
The A/B/C self-tests prove the helper contracts execute safely in production. They do **not** by themselves prove every P1 capability is wired end to end.

### P1-A completed
- Direct-official HTTP retrieval gateway.
- Tavily and SerpAPI adapters using Script Properties, with no key stored in GitHub.
- Safe public-URL guard before direct HTTP retrieval.
- Runtime adapter telemetry on the scheduled health path.
- Applications schema columns added for vacancy verification timestamp/status/source/hash/URL/confidence.
- Bounded vacancy worker deployed through the controlled pipeline on 2026-08-20 in workflow run 32400455590: syntax validation PASS, full P0 validator PASS, P1-A/B/C validation PASS, Apps Script push PASS.
- Bounded vacancy worker scans at most 250 rows, verifies at most one stale active Apply row per health tick, writes only the six vacancy evidence fields, and disallows paid fallback on this health path.
- Revalidation policy is encoded as >72h before tailoring and >24h when Submission Ready is Yes.
- Live acceptance of the bounded worker is complete: `p1a_vacancy_self_test = PASS`, contract `P1-A-VACANCY-1`, and one real application evidence writeback verified.

### P1-A next wiring
- Connect the retrieval gateway into the actual `workerJD_` / source-intake path.
- On JD retrieval: existing canonical artifact/cache first; direct official page next; deterministic JobPosting/ATS extraction before LLM fallback; configured paid provider fallback only after P1-B budget/cost enforcement is active.
- Persist retrieval provenance and source-artifact linkage when a JD is recovered.
- Clear `full_jd_unavailable` / JD-PDF user action only after canonical JD artifact persistence succeeds and immediate readback verifies it.
- Limited acceptance fixture: Metaforms `2026-08-04-002` first, then Hinge Health `2026-08-06-003`. Success means automatic JD recovery, canonical snapshot, avoidable PDF blocker removed, and downstream processing resumes without manual upload.

### P1-B remaining wiring
- Enforce budget decision before every paid call, including OpenAI, Tavily and SerpAPI.
- Persist/reuse versioned output cache.
- Apply Company Cache TTL rules to actual enrichment reads.
- Wire dead-letter/replay/GC decisions into queue lifecycle.

### P1-C remaining wiring
- Google Docs unresolved-comment revision worker.
- Gmail outcome monitor and tracker writeback with fail-closed matching.
- RetrievalProvider-backed contact enrichment replacement.

## Portal migration contract
- Master Product & Engineering Specification reconciled to version `0.20.0` with `CS-20260820-027 — P1 Runtime Integration, Vacancy Provenance & Portal Normalization Contract`.
- Repository companion: `PORTAL_MIGRATION_CONTRACT.md`.
- Portal is not a spreadsheet UI rewrite. It will use normalized append-only retrieval/vacancy evidence history, typed domain/state contracts, preserved Failure Learning guardrails, and contracts-first/backend-parity-before-UI migration.

## Release discipline
P1 is not closed until the above behavior is integrated into real workers, deterministic/regression tests pass, limited live acceptance passes, P0 preflight remains green, and the Master Product & Engineering Specification remains synchronized. No P1 release identity bump occurs before that release-candidate gate.
