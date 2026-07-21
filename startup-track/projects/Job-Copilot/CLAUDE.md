# Job-Copilot — working agreement

## Standing rule: how to work with the operator (READ FIRST)

The operator is **non-technical**. In every session:

- **Explain everything in plain language.** Give a one-line "why" *before* doing a thing. Never assume knowledge of technical terms — if a term is unavoidable, define it in the same breath.
- **When you need something from the operator**, give the **exact text to type** or the **exact button to click**, **one step at a time, and then wait.** Do not stack multiple asks.
- **When reporting results, lead with what it means in plain words.** Put technical detail *after*, clearly marked as optional reading.

This rule outranks brevity. It is not optional.

## What this project is

A hosted job-search assistant for Lead/Senior Product Managers. Current phase: validating the **scoring instrument** (does it rate a good-fit résumé above a well-disguised bad-fit one?) before building any product pipeline.

## Key files (plain-English map)

- `CRITIC_MODE_PROMPT.md` — the scoring "brain" (how it behaves + the exact result format).
- `PM_RUBRIC.md` — *what* gets measured (archetypes, weights, anchors). The **weights are the only dial we tune**; every change is logged in that file's changelog with the case that motivated it.
- `GOLDEN_SET.md` — the test-set design and the 6 pass/fail gates.
- `golden/` — the actual test: 10 job descriptions, 30 résumés, the answer key (`labels.json`).
- `harness/` — the program that runs the test and grades it. Run instructions live in `harness/README.md`.
- `docs/adr/` — the record of every architecture decision (one short file each). **Every future architecture decision gets one — no exceptions.**

## Decisions already locked (see `docs/adr/`)

- No automated job-sourcing until the scorer is validated (ADR-001).
- No vector database in v1 (ADR-002).
- The harness recomputes scores itself from the model's parts, never trusting the model's own total (ADR-003).
- Scoring behaviour and the tunable rubric live in separate files (ADR-004).

## Privacy (this repo will become a public portfolio piece)

Never commit: the real résumé (`resume.master.local.md`), the real `config/operator_overrides.json` (holds comp floor), or `.env` (holds the API key). All three are gitignored. Only the fake-data template `resume.master.md` and the `.example` files are committed.
