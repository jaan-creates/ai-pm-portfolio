# ADR-001 — Apify connection deferred to after pipeline validation

**Status:** Accepted · 2026-07-21

## Context
Job-copilot will eventually source JDs automatically (Apify + a 4-hour scheduler, ~6 runs/day). The question is *when* to connect that metered sourcing — now, to start accumulating a corpus, or later, after the scorer and pipeline are validated.

## Decision
The Apify source and 4-hour scheduler connect only after ALL of:
- (a) the golden set is frozen (rubric v1.0);
- (b) the PRD is written;
- (c) the core pipeline (schema → normalize → validate → clamp) processes a manual batch of ~10 **real** JDs — pasted by the operator from actual portals — end-to-end cleanly, exercising liveness classification and SimHash dedup against reality;
- (d) `operator_overrides.json` is configured.

## Reasoning
- Metered sourcing volume into an unvalidated scorer is paid noise (standing project rule).
- Ingestion needs the Job schema and the dedup/liveness logic to exist first.
- A manual real-JD batch catches real-world parsing failures for free, before automation multiplies them 6×/day.

## Rejected alternative
Connect Apify now to accumulate a job corpus in parallel — rejected because unscored, unvalidated accumulation creates a backlog that must be re-processed anyway once the pipeline stabilizes, at cost, while adding zero learning now.

## Consequences
No automated sourcing until the four gates clear. The golden set (this phase) is gate (a) and the critical-path dependency; everything downstream waits on it.
