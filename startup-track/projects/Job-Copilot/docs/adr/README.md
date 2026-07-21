# Architecture Decision Records

**The rule:** every architecture decision for job-copilot gets an ADR — one short file: decision, reasoning, rejected alternative. No exceptions. *An undocumented architecture decision doesn't exist.*

Each ADR follows: **Status · Context · Decision · Reasoning · Rejected alternative · Consequences.**

## Index

| # | Title | Status |
|---|-------|--------|
| [001](ADR-001-apify-deferred.md) | Apify connection deferred to after pipeline validation | Accepted |
| [002](ADR-002-no-vector-db-v1.md) | No vector database in v1; embeddings in one narrow role only | Accepted |
| [003](ADR-003-deterministic-three-signal-recompute.md) | Harness recomputes S1/S2/S3 + composite from parts; model composite is a cross-check | Accepted |
| [004](ADR-004-prompt-rubric-split.md) | Prompt/rubric composition split (behavior+schema vs. what-to-measure) | Accepted |
