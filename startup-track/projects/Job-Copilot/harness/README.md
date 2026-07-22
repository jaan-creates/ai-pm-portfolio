# Golden-set harness

Runs the PM fit rubric against the frozen golden set (`../golden/`) and reports the 6 pass gates (`GOLDEN_SET.md`). The judge model is chosen in `../config/harness.json` and routed by id (ADR-005): `gemini-*` → Google (free tier, default), `claude-*` → Anthropic. The run is gated only on the matching API key in `../.env`.

## To run

```bash
cd harness
npm install
# Put the matching key in ../.env (gitignored). Default model is FREE Gemini Flash:
#   GEMINI_API_KEY=...   (free, no card: https://aistudio.google.com/app/apikey)
# For the Claude path instead, set ANTHROPIC_API_KEY and a claude-* model in config.
node run.mjs           # LIVE: one call per run (throttled to the free-tier RPM for Gemini)
node run.mjs --batch   # BATCH (Anthropic only): Message Batches API, 50% cost, async
node report.mjs        # recomputes composites, evaluates gates → golden/report.md
```

**Model / cost.** Default `gemini-2.5-flash` on the free tier ≈ **$0** (throttled to `requests_per_min`, ~15). The report's cost line reads $0 for free Gemini. Switch `model` to `claude-sonnet-5`/`claude-opus-4-8` for the paid/private judge (set `pricing_per_mtok_usd` too). **Resumability is model-aware:** a saved run is reused only if it came from the current model, so switching judges re-scores rather than mixing. **Privacy:** the free Gemini tier may train on inputs — fine for the synthetic golden set; for real-resume runs use Gemini's paid tier or a local model (ADR-005).

`run.mjs` is resumable in both modes: a run whose result file is already `ok:true` is skipped and never re-billed; only prior failures are redone. Delete a `golden/results/*.json` to re-score just that run, or the whole dir for a clean pass. In `--batch` mode the in-flight batch id is saved to `golden/results/_batch.json`, so if you interrupt the poll and re-run, it reconnects to the same batch instead of resubmitting.

**Cost levers.** The critic prompt + rubric (~3.6k tokens, identical every call) are cached via `cache_control` on the system block — charged full once, then ~10% per later call within the 5-min TTL (calls are ~70s apart, so the cache stays warm). Every result records real `usage` (input/output/cache tokens) so cost is measured, not estimated. `--batch` halves the whole bill. Combine them for the cheapest full run.

## What each module does

| file | role |
|---|---|
| `anonymize.mjs` | strips candidate name + aliases employers/institutions (`../golden/aliases.json`); `aliasEmployers:false` keeps real logos for the G8 probe |
| `perturb.mjs` | run-2 perturbation (Rev 2): deterministic bullet shuffle within each role + alias-synonym relabel; `preserveNames` = shuffle only (G8 un-anon) |
| `schema.mjs` | validates the v2.0 Score JSON; recomputes S1/S2/S3 + composite from parts (ADR-003); resolves archetype weights from `../config/rubric_weights.json` |
| `score.mjs` | one Anthropic call (Opus 4.8, adaptive thinking, effort high, streamed); strips fences/`<think>` and slices the JSON |
| `run.mjs` | 62-run orchestrator (10×3×2 + G8 logo-swap pair), resumable, writes `_meta`+result JSON |
| `report.mjs` | mean-composite ranks, decoy margins, stability deltas, per-case assertions, 6 gates → `../golden/report.md` |

## Config

- `../config/harness.json` — model, thinking/effort, S2/S3/composite recompute constants. **No `temperature`** — Opus 4.8 rejects sampling params (400); the stability gate is perturbation-based, so it isn't needed.
- `../config/rubric_weights.json` — base + per-archetype shifts (the calibration tunable). Every change is logged in `PM_RUBRIC.md`'s changelog with the motivating case ID.

## Iterating (§3)

On a gate failure, edit **rubric anchors / weights / confusion-rules only** — never labels or resumes — log the change in `PM_RUBRIC.md`, and re-run the full set. When all 6 gates are green: bump the rubric to v1.0, freeze `../golden/` (FROZEN marker + checksums), and it becomes the permanent regression suite.
