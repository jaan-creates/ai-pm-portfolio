# Janu Job Copilot — P1 Implementation Status

Production baseline: 1.3.8 / p0-regression-v19

## Evidence already live
- P1-A contract/self-test: PASS.
- P1-B contract/self-test: PASS.
- P1-C contract package: deployed; live health telemetry pending.

## Important implementation truth
The A/B/C self-tests prove the helper contracts execute safely in production. They do **not** by themselves prove every P1 capability is wired end to end.

### P1-A remaining wiring
- Real direct-official HTTP retrieval gateway.
- Tavily and SerpAPI adapters using Script Properties, with no key stored in GitHub.
- Existing JD/source-intake worker routed through the gateway.
- Deterministic JobPosting extraction before LLM fallback.
- Persist vacancy status, verification timestamp/source/hash and retrieval provenance.

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
