# Janu Job Copilot — Release State

Last updated: 2026-08-20

## Frozen production baseline

- Production release: `1.3.8`
- Production regression suite: `p0-regression-v19`
- Live preflight: `PASS`
- P0 closure phase: `COMPLETE`
- Production worker: `enabled`
- Production queue at P1 start: clean (`running=0`, `queued=0`, `pendingPdf=0`)
- Master spec: `0.19.0`
- P1 development branch: `janu-job-copilot/p1-execution`
- P1 PR: `#2` (draft)

The previous 1.3.3/v14 text on this branch was documentation drift and is superseded by the connector-verified live tracker state above. P1 must not mutate or weaken the frozen P0 contracts while it is under development.

## P1 status

`P1-A IN IMPLEMENTATION`

Current P1-A contract patch adds:

- RetrievalProvider routing contract: cache -> direct official -> Tavily -> SerpAPI -> unavailable.
- Retrieval provenance contract: provider, URL, retrieval timestamp, content hash, confidence.
- Deterministic JobPosting JSON-LD parser before model extraction, plus ATS host classification for Greenhouse, Lever, Ashby and Workday.
- Vacancy revalidation contract: >72h before tailoring and >24h before submission.
- Vacancy fail-closed state decision: OPEN / CLOSED / UNKNOWN.
- Source promotion idempotency key and duplicate/closed-vacancy rejection.
- Synthetic P1-A contract self-test.

This is not yet a production release. Provider HTTP adapters, production intake wiring, regression integration, deployment and limited live acceptance remain gated.

## P1 gates

P1-A closes only after retrieval routing, parser fixtures, provenance, source promotion/replay and vacancy revalidation pass deterministic tests and limited live acceptance without regressing P0 SOURCE/SCHEMA/WRITE/RECON controls.

P1-B then adds budget hard caps, durable output cache, Company Cache TTL enforcement and DLQ/replay/GC. P1-C then adds immutable resume revision lineage, Gmail outcome monitoring and RetrievalProvider-backed contact discovery.

Full P1 closure requires the complete P0 suite to remain green, P1 regression green, live preflight green, bounded one-heavy-job runtime, cost attribution before paid calls, clean artifacts, and no unresolved deterministic defect without failure-learning prevention evidence.

## Execution-control contract

A release transition advances only on evidence, not intent:

`PATCHED -> VALIDATED -> DEPLOYED -> LIVE -> TESTED -> CLOSED`

A stalled state becomes `STALLED -> AUTO_DIAGNOSE -> AUTO_REPAIR_RETRY`. `USER_BLOCKED` is reserved for a genuine OAuth/security/user-approval/authenticated external-submission boundary.

## Automation boundary

Approved runtime actions remain constrained to the allow-listed operator-command plane and bounded production worker. ChatGPT owns repository changes, tracker inspection, regression/preflight inspection, defect triage, iterative patching and evidence-based progression. Human intervention is reserved for genuine security/OAuth and external approval/submission boundaries.
