# ADR-005 — Model providers: Gemini free tier as default judge, Claude as premium; paid/local for privacy

**Status:** Accepted · 2026-07-22

## Context
Scoring every job against the resume with a paid Claude model is too expensive at job volume, and it blocked validation when credits ran out. The scorer needs a near-$0 path to be a viable single-user product and a credible portfolio piece. Two external facts frame the choice: Google's Gemini API has a real free tier (Flash / Flash-Lite, ~1,000–1,500 calls/day, ~15 req/min, no card), but the *free* tier may use inputs to train Google's models; a ChatGPT Plus/Pro subscription includes **no** API credit (the OpenAI API is separate pay-as-you-go).

## Decision
The judge is chosen by model id, behind a thin provider layer (`harness/providers/{_shared,anthropic,gemini}.mjs`, dispatched in `score.mjs`):
- **Default: Gemini free Flash** (`gemini-2.5-flash`) — the everyday, $0 judge.
- **Premium fallback: Claude** (`claude-*`) — used only where the free model can't hold the rubric (the golden set shows which cases), or for the most trustworthy baseline. The Message Batches path stays Anthropic-only.
- **Privacy switch for real-resume runs:** change one config value to Gemini's **paid tier** (no training) or a **local model** (Ollama). The real resume is gitignored; the public repo stays synthetic-only.

The scoring contract (Score JSON, deterministic S1/S2/S3 recompute — ADR-003) is model-agnostic, so providers only differ in request shape and auth. `run.mjs` resumability is model-aware: a saved result is reused only if it came from the current model, so switching judges re-scores rather than mixing them.

## Reasoning
- The free tier makes the whole product plausibly $0/month, which is both the practical goal and a strong cost-engineering portfolio story.
- Which model to trust is an empirical question the golden set already answers (the autopsy's PR-13 "golden-set as routing gate"); the provider layer lets us run the same test on any model and pick the cheapest that passes.
- Keeping Claude one config-flip away preserves a private, high-trust option without committing to its cost.

## Rejected alternatives
- **Claude-only:** rejected on cost — unsustainable at job volume for a single user.
- **ChatGPT Pro subscription for the API:** rejected — it grants no API credit; using OpenAI would mean separate pay-as-you-go with no advantage over Gemini free.
- **Free tier for real-resume runs, permanently:** not chosen as the end state — the free tier's training-on-input terms make it unsuitable for sensitive data; hence the documented paid/local switch.

## Consequences
`config/harness.json` selects the provider via `model` (default `gemini-2.5-flash`) plus a `requests_per_min` throttle; keys live in the gitignored `.env` (`GEMINI_API_KEY` / `ANTHROPIC_API_KEY`). Real-resume use requires consciously switching off the free tier. The production pre-filter that keeps LLM volume under the free daily cap (ADR-001's deferred pipeline) is what makes "$0" hold at scale.
