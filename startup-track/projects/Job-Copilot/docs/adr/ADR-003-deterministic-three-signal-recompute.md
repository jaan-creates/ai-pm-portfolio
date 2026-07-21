# ADR-003 — Harness recomputes S1/S2/S3 + composite from parts; model composite is a cross-check

**Status:** Accepted · 2026-07-21

## Context
The critic model (CRITIC_MODE_PROMPT.md v2.0) emits per-section scores, per-requirement statuses, and per-term classifications — plus its own `composite`. The composite is `0.50·S1 + 0.35·S2 + 0.15·S3`. If we trust the model's arithmetic, the score is unauditable, the weights aren't tunable without editing the frozen prompt, and the S2/S3 mechanics that several golden traps depend on (G9 reads `s3_terms.flagged_no_evidence`; G10's must-have drag lives in S2's double-weighting) become invisible.

## Decision
The harness recomputes all three signals **from the model's emitted classifications + evidence**, and computes the composite itself:
- **S1** = Σ(section.score × applied_weight)/100, applied_weight resolved from `config/rubric_weights.json` for the classified archetype (normalized to sum 100 after the floor-4 clamp).
- **S2** = Σ(statusVal × mustWeight) / Σ(mustWeight) × 100; statusVal met=1/partial=0.5/missing=0, mustWeight must=2/nice=1.
- **S3** = (|matched| + |synonym_matched|) / (total of all four term arrays) × 100; `flagged_no_evidence` credited 0.
- **composite** = 0.50·S1 + 0.35·S2 + 0.15·S3.

The model's own `composite` is retained only as a **cross-check**: `|harness − model| > 2` raises a scorer-integrity warning in the report. The harness also verifies each `applied_weight` matches `rubric_weights.json` (catches a mis-applied archetype shift).

**Stability deviation (recorded here):** the prompt's §Hard-rules step 3 says a >5-point divergence triggers a *third run*. The harness does **not** do that — at temp 0 a third canonical run just duplicates run 1. Instead the harness runs exactly two (a canonical run and a semantics-preserving *perturbed* run), and `|run1 − run2| > 5` sets `unstable: true` and **fails the stability gate**, forcing the fix into the rubric where instability actually lives. This is consistent with the ADR-004 split: the harness governs execution mechanics; the prompt governs scorer behavior.

## Reasoning
Direct transplant of the autopsy's recompute-from-parts guard (EDGE_CASES RS-11, SC-01/02): never trust an LLM's own total. It makes the composite weights and section weights the sole calibration tunables (editable in config, logged in the PM_RUBRIC changelog) without touching the frozen behavioral prompt, and it lets the S2/S3 mechanics actually drive the trap outcomes the golden set exists to test.

## Rejected alternative
Trust the model's emitted `composite` — rejected because it is unauditable, non-tunable, and hides the S2/S3 mechanics G9 and G10 depend on.

## Consequences
`harness/schema.mjs` owns the recompute formulas; `config/rubric_weights.json` and `config/harness.json` own the tunable constants. The stability gate is stronger (measures robustness to perturbation, not API nondeterminism) but can fail a scorer that the prompt alone would have papered over with a third run.
