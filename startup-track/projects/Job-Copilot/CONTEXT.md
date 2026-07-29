# CONTEXT.md — Job-Copilot, for a new reviewer

## 1. What this is

A hosted job-search assistant for Lead/Senior Product Managers, currently split across two tracks: (a) a **scoring instrument** (an LLM rubric that rates résumé-vs-JD fit) still failing its own validation gates, and (b) a **score-independent product app** (Next.js job tracker + dashboard) being built in parallel while the scorer is parked.

## 2. Stack

From `web/package.json` / `harness/package.json` lockfiles — not the READMEs (which are still create-next-app boilerplate):

- **App (`web/`):** Next.js 16.2.11 (App Router, Turbopack), React 19.2.4, TypeScript 5, Tailwind CSS 4, `@dnd-kit/core` 6.3.1 (drag-and-drop board). No test framework, no ORM, no auth library.
- **Eval harness (`harness/`):** plain Node (ESM, `type: module`), `@anthropic-ai/sdk` and `@google/genai` as the only dependencies. No test runner — the harness *is* the test.
- **Storage:** flat files. `web/data/jobs.json` (array) + `web/data/events.jsonl` (append-only log). No database anywhere yet.
- **External services wired:** Anthropic API (judge), Google Gemini API (free-tier judge), Apify (LinkedIn job scraping actor).

## 3. Architecture

**Plain language:** Two things live in this repo that don't yet talk to each other. One is a test rig that repeatedly asks an LLM to score fake résumés against fake job descriptions, to find out whether the LLM can reliably tell a good match from a good-looking fake. The other is a real (if small) job-tracking web app — a kanban board for job applications plus a stats dashboard — built to not depend on that unresolved scoring question at all: fit scores shown in the app are explicitly fake ("sample") placeholders, labelled as such in the UI.

**Components:**
- `harness/` — orchestrates 62 scoring runs (10 cases × 3 résumés × 2 repeats, plus one fairness pair), calls the judge model, recomputes scores independently of the model's own math (`schema.mjs`), and produces `golden/report.md`.
- `golden/` — the frozen(-ish) test fixtures: 10 JDs, 30 résumés, `labels.json` ground truth, and `results/*.json` (62 raw judge outputs from a real run).
- `config/harness.json` — judge model selection + scoring constants.
- `docs/adr/` — 8 ADRs, one per architecture decision, each with a rejected-alternative section.
- `web/` — the Next.js app:
  - `app/tracker/page.tsx`, `app/jobs/[id]/page.tsx` — kanban board + job detail.
  - `lib/store.ts` — **the only** file that touches `data/jobs.json` / `data/events.jsonl` (explicit swap-point for a future Postgres backend).
  - `lib/metrics.ts` — dashboard math, splits "real" (event-log-derived) numbers from "sample" (score-derived, fake) numbers.
  - `lib/sourcing/apify.ts`, `normalize.ts` — on-demand LinkedIn job import via Apify.

## 4. Verified state

**Build:** ✅ Runs. `npx tsc --noEmit` in `web/` — clean, no errors. `npm run build` (Next.js production build via Turbopack) — **succeeds**, compiles in ~31s, generates all 4 routes (`/`, `/_not-found`, `/jobs/[id]`, `/tracker`). `npm run lint` (ESLint) — clean, exit 0.

**Tests:** There is no unit-test suite (no Jest/Vitest, no `*.test.*` files found). The golden-set harness (`harness/`) is the only automated correctness check, and it targets the scoring rubric only, not the web app. It has been **run for real**: `golden/results/` contains 62 dated JSON files (2026-07-22, 14:40–14:46) with actual judge outputs and token usage, and `golden/report.md` is a genuine computed report, not a template.

**Referenced but absent / not yet wired:**
- No auth (PRD mentions "hosted deploy behind auth," ADR-006 defers it to "F8").
- No Postgres — ADR-006 commits to it "on deploy" but it doesn't exist; the file-backed store is the only implementation.
- No repost/liveness re-checking for sourced jobs (`repost_of` field exists, never populated — flagged as a TODO in `store.ts:144`).
- No automated sourcing scheduler — ADR-008 explicitly keeps this manual-button-only; the "4-hour scheduler" from ADR-001 remains unimplemented by design.

**Hardcoded / placeholder / sample:**
- Every fit score shown in the app is `{ composite, sample: true }` — literally labelled fake in the type system (`lib/types.ts:90-92`) and the UI (`components/ui.tsx:31`, `"sample"` pill).
- `APPLY_CUTOFF = 75` in `lib/metrics.ts:13` is a hardcoded placeholder, commented as "real cutoff set at calibration."

**Evidence it has run for real (not just written):**
- `web/data/jobs.json` contains 1,608 lines of **real LinkedIn postings** (real company names — Nasdaq etc. — real URLs, real posted dates), evidence the Apify sourcing button (ADR-008) was actually exercised against LinkedIn, not just coded.
- `golden/results/*.json` — 62 real judge-model responses with captured token usage, timestamped 2026-07-22.
- `golden/report.md` — computed gate results from that real run (see below), not a hypothetical.
- Live secrets are present in `.env` and `web/.env.local` (Anthropic key, Apify token) — confirms these integrations were actually called, not just stubbed. **Do not print or commit these values** — both files are correctly gitignored, but they exist in the working tree with real key material.

**Last commit (this subtree):** `5f08731` · 2026-07-22 · "env loader also accepts a bare Gemini (AIza…) key." 34 commits total touch this path; activity is dense over 2026-07-21→22 (ADRs, golden set, harness, first live run, cost/caching, Gemini routing) then resumes for the `web/` app on 2026-07-22→23 (currently uncommitted — see below).

**Uncommitted work in the working tree right now:**
- `web/` (the entire Next.js app) is **untracked** — not yet committed to git at all.
- `golden/report.md`, three ADRs (006/007/008), and `BACKLOG_HARVEST.md` are also untracked.
- `config/harness.json`, `docs/adr/README.md`, `harness/loadenv.mjs` have unstaged modifications (small diffs, a handful of lines each).

## 5. Decisions recoverable from the repo

All from `docs/adr/`, each dated and reasoned:

- **ADR-001:** Apify job-sourcing deferred until the scorer is validated — later refined (not reversed) by ADR-008.
- **ADR-002:** No vector database in v1.
- **ADR-003:** The harness recomputes S1/S2/S3 + composite itself from the model's raw parts; the model's own stated total is only a cross-check, never trusted directly.
- **ADR-004:** Scoring *behavior* (prompt) and the *rubric* (weights/anchors) are split into separate files so weight tuning doesn't require touching the harder-to-review behavioral prompt.
- **ADR-005:** Gemini free tier is the default judge (to make golden-set runs free); Claude is the paid/premium path; **routing is entirely by model-name string prefix** (`gemini-*` vs `claude-*`).
- **ADR-006:** Next.js + file-backed local storage now, Postgres deferred to a hosted deploy; reasoning explicitly rejects `better-sqlite3` because it's a native module with Windows build friction and doesn't persist on Vercel's ephemeral filesystem.
- **ADR-007:** Build score-independent features now because the free judge (`gemini-flash-lite-latest`) **failed validation** (documented: 6/10 rank-order gate, 6 stability violations, 28 evidence-integrity violations) — this is a decision made *because of* a failure, not despite one.
- **ADR-008:** Manual "Fetch from LinkedIn" button via Apify's `simpleapi~rapid-linkedin-jobs-scraper` actor; confirmed working via a live probe (69 real jobs) on 2026-07-23; reasoning distinguishes this explicitly from the *automated scheduler* still deferred under ADR-001.

Where reasoning isn't in the ADR text, this document doesn't invent it.

## 6. Risks and fragility

- **The scoring instrument does not currently pass its own bar.** `golden/report.md`'s verdict is explicit: 🔴 NOT YET, 5 of 6 gates red (rank order 6/10 needed ≥9/10; 6 stability violations; 28 evidence-integrity violations — nonzero section scores with no supporting résumé quote). Gate 7 verdict also flags a mismatch between the model's stated per-archetype weight and `rubric_weights.json` in ~20 of 62 runs — the applied weighting may silently diverge from the config file.
- **File-backed storage is not concurrency-safe** (ADR-006 says so outright) — fine for one local user, but any move toward multi-user or hosted use before the Postgres swap risks silent data races or lost writes on `jobs.json`.
- **Two live API keys and one live scraping token sit in plaintext in the working tree** (`.env`, `web/.env.local`). They are correctly gitignored, but a `git add -A`, a misconfigured `.gitignore` edit, or copying the tree elsewhere would leak them immediately.
- **The entire `web/` app is uncommitted.** If this working tree is lost (disk failure, accidental `git clean`/reset) the whole product build since 2026-07-22 disappears with no git history to recover it.
- **No tests for the web app at all.** Type-checking and lint passing verifies syntax and types, not behavior — the board's drag-and-drop transitions, dedupe logic in `addSourced`, and dashboard math in `metrics.ts` have no automated regression coverage.
- **`repost_of` and liveness re-checking are unimplemented stubs** — sourced jobs never get marked `expired` automatically, so the backlog will silently accumulate dead postings the longer sourcing runs unattended.
- **Public-portfolio intent vs. current state:** CLAUDE.md states this repo "will become a public portfolio piece" — as-is, publishing it would require committing `web/`, scrubbing the two live secrets, and being honest that the scoring instrument (this project's stated reason for existing) has not yet passed validation.

## 7. Where a reviewer should start

1. **[`golden/report.md`](golden/report.md)** — ~10 minutes here tells you the actual state of the core hypothesis this project is testing: does the rubric distinguish real fit from a well-disguised fake? Right now the answer is "not reliably, on the free judge," and the report shows exactly which of the 6 gates fail and why. This is the single most load-bearing artifact in the repo.
2. **[`docs/adr/ADR-007-build-score-free-core-first.md`](docs/adr/ADR-007-build-score-free-core-first.md)** — explains *why* there's a whole Next.js app sitting next to a failing scorer, and what guardrail (the `sample: true` labelling) keeps the two honestly separated. Read this before judging the app's fit-score UI as "fake" — it's fake on purpose, and documented as such.
3. **[`web/lib/store.ts`](web/lib/store.ts)** — the single seam the whole app's persistence goes through. Fifteen minutes here (plus `lib/types.ts`) shows you the entire data model, the append-only event-log invariant, and where a Postgres swap would land — the fastest way to understand what the product actually does today.
