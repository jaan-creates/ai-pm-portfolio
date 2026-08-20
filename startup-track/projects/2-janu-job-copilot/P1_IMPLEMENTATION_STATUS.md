# Janu Job Copilot — P1 Implementation Status

Production baseline: 1.3.8 / p0-regression-v19

## Evidence already live
- P1-A contract/self-test: PASS.
- P1-A runtime adapter self-test: PASS (`P1-A-RUNTIME-1`).
- P1-B contract/self-test: PASS.
- P1-C contract/self-test: PASS.
- Direct-official/Tavily/SerpAPI runtime adapters are present in production and preserve P0 release validation.
- Applications vacancy/provenance schema migration is complete and read back successfully.

## Important implementation truth
The A/B/C self-tests prove the helper contracts execute safely in production. They do **not** by themselves prove every P1 capability is wired end to end.

### P1-A completed
- Direct-official HTTP retrieval gateway.
- Tavily and SerpAPI adapters using Script Properties, with no key stored in GitHub.
- Safe public-URL guard before direct HTTP retrieval.
- Runtime adapter telemetry on the scheduled health path.
- Applications schema columns added for vacancy verification timestamp/status/source/hash/URL/confidence.
- Bounded vacancy worker implemented and promoted through the controlled pipeline: scans at most 250 rows, verifies at most one stale active Apply row per health tick, writes only the six vacancy evidence fields, and disallows paid fallback on this health path.
- Revalidation policy is encoded as >72h before tailoring and >24h when Submission Ready is Yes.

### P1-A live acceptance pending
- Await `p1a_vacancy_self_test = PASS` / `P1-A-VACANCY-1` from scheduled health telemetry.
- Confirm at least one eligible live application receives vacancy evidence without changing Decision/Status fields.
- Then connect the same retrieval/provenance path directly into JD/source-intake processing so deterministic extraction can prevent avoidable JD-upload blockers and LLM calls.

### P1-B remaining wiring
- Enforce budget decision before every paid call.
- Persist/reuse versioned output cache.
- Apply Company Cache TTL rules to actual enrichment reads.
- Wire dead-letter/replay/GC decisions into queue lifecycle.

### P1-C remaining wiring
- Google Docs unresolved-comment revision worker.
- Gmail outcome monitor and tracker writeback with fail-closed matching.
- RetrievalProvider-backed contact enrichment replacement.

## Release discipline
P1 is not closed until the above behavior is integrated into real workers, deterministic/regression tests pass, limited live acceptance passes, P0 preflight remains green, and the Master Product & Engineering Specification is updated. No P1 release identity bump occurs before that release-candidate gate.
