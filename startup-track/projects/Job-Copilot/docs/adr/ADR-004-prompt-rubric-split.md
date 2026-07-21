# ADR-004 — Prompt/rubric composition split

**Status:** Accepted · 2026-07-21

## Context
The scoring instrument has two kinds of content that change at different rates and for different reasons: the *behavioral contract* (persona, procedure, hard rules, output schema) is stable and must stay fixed so results remain comparable across time; the *measurement calibration* (archetype weights, named anchors, confusion-pair rules) is tuned repeatedly against the golden set.

## Decision
Keep them in two files:
- **CRITIC_MODE_PROMPT.md** — how to behave: persona, the ordered procedure, hard rules, and the Score-JSON schema.
- **PM_RUBRIC.md** — what to measure: the archetype table + weight shifts, seniority ladder, named anchors, confusion-pair rules.

When the two conflict, **the rubric wins on *what to measure*, the prompt wins on *how to behave*** — and the conflict is fixed the same day (CRITIC_MODE_PROMPT.md v2.0, line 2).

## Reasoning
Calibration (rubric anchors/weights) must iterate against the frozen golden set without churning the behavioral/schema contract. If schema and behavior lived in the same file as the anchors, every anchor tweak would risk changing the output shape and break result comparability across rubric versions. The split also gives the harness a clean seam: it governs execution mechanics (batching, recompute, stability handling — see ADR-003) while the prompt governs scorer behavior.

## Rejected alternative
A single monolithic scoring prompt — rejected because every anchor tweak would churn the schema/behavior contract and break the comparability the frozen golden set depends on.

## Consequences
Iteration edits PM_RUBRIC.md (and `config/rubric_weights.json`) only; the schema in CRITIC_MODE_PROMPT.md and the harness's `schema.mjs` stay in lockstep and change rarely, deliberately, same-day when they must.
