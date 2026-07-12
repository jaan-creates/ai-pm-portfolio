# DECISIONS.md — Daybreak (Morning Briefing, Project 1)

Every non-obvious choice and its one-line reason. Written to survive a hostile interview question. A hiring manager should read this in 4 minutes and form a view of how I think.

## Architecture

**n8n (visual workflow) over writing Python** — n8n handles OAuth, scheduling, HTTP, and six integrations as drag-connect nodes: ~200 tokens of config versus 5000+ of code I'd have to maintain when an API changes. Lowest layer that solves the problem.

**Self-hosted Community Edition over n8n Cloud** — Cloud's free tier was discontinued; self-hosted is free with unlimited executions. Trade-off: laptop must be on at trigger time. Accepted for v1.

**One monorepo, folder per project** — easier to browse range; both tracks coexist; less repo sprawl.

**Node contents committed as separate source files — NEVER the raw workflow.json export** — an early export leaked an API key into a public commit (incident logged below). The repo now holds prompt, Assemble code, and Build-Email code as individual files copied by hand; reproducibility is preserved by README wiring instructions, not by the export.

**HTTP Request node for the Claude call, not n8n's native Anthropic node** — for a single call, HTTP is transparent and portable; "I knew what every header did" is a stronger interview answer than "I used the built-in node."

**Request body built in a Code node, HTTP node just forwards it** — n8n's JSON field validator chokes on multi-line expressions. Building the payload as a JS object and passing JSON.stringify() guarantees valid JSON. Separation of concerns: construction in code, transport in the HTTP node.

**One Build-Email Code node parses + prices + renders** — rather than three nodes, one node turns Claude's text into JSON, computes the run cost from token usage, and renders the HTML. Rendering logic lives in code, not scattered in the Gmail field.

**Deterministic code for weather phrasing, LLM reserved for judgment** — weather sentences are rule-shaped (condition → phrase → advice), so they're 80 lines of null-safe JS at zero token cost. The model is spent only on the one thing that needs it: triage.

## The brain (the actual product)

**Curation = cluster → score → select → demote, not aggregate-into-boxes** — the differentiator. Clustering across sources produces one line ("your 11am — deck landed at 7am, thread still arguing scope"), not three scattered entries.

**Four-layer priorities.md (filter → principles → known senders → definitions, plus hard caps)** — Layer 0's Three-Test Filter (action / decision-changing / time-risk) gates everything; Layer 1 principles judge any sender including ones never seen before (a first recruiter email); Layer 2 is shortcuts for known senders; Layer 3 defines WORK vs PERSONAL so tax deadlines stop landing under Work. Designed to avoid overfitting to the sample inbox — the day something important arrives from a new sender, Layer 1 still catches it.

**Three-Test Filter added after a 3-email audit (2026-07-12)** — ~40% of "For You" lines required no action ("delivered ✓", receipts, settled bills). New rule: no line without action, changed decision, or time-risk; everything else collapses into one closure_line. "FYI" and "no action needed" are banned as inclusion justifications — if the brief writes them, the filter failed.

**closure_line as a first-class output key** — no-action items get one grey italic sentence ("Also: 3 deliveries done — nothing pending") instead of a section. Gives closure without spending attention; the render hides entirely when null.

**Structured 10-key JSON output** — separates reasoning from rendering; the same brain renders to email now, WhatsApp/voice later, with zero change to the judging logic.

**Rules in prose, plumbing in code** — judgment lives in the Priorities node as editable text; a misjudged bootcamp "last 2 seats!" email is fixed with one sentence, not a deploy. Known cost: rules and schema live in two places and can drift (closure_line existed in the rules for days before the schema knew about it) — so any new output field must touch three places together: priorities.md, Assemble INSTRUCTIONS, Build-Email render.

**Permission to say "nothing urgent" is a designed feature** — a quiet brief is more trustworthy than four manufactured bullets. Trust is the retention mechanic.

**Pre-forgiven, ADHD-optimized tone** — shame-removal is structural, not cosmetic. A brief that guilts you about backlog gets muted.

**Ordered by decision-urgency, not by source** — one-thing → actionables → dated items → news. Nothing that needs no action sits above something that does.

## Scope / cost

**priorities.md ships as a flat file, no editing UI** — building a config editor before the system is proven is yak-shaving. Tune through real use instead.

**Emails trimmed to sender/subject/snippet before the Claude call** — 50 full bodies would be 30-50k tokens/run and cost 4-5x more daily; snippet is enough to judge. Cost discipline. (Snippet at 300 chars in v1; widening to 600 is a logged v2 tweak.)

**Gmail→Gmail delivery for v1; WhatsApp deferred** — WhatsApp is the real thesis, but must not block shipping the brain. Prove curation on the easy channel first.

**CSS gradient header; animated GIF deferred to v2** — Gmail strips CSS keyframes and JS; only hosted GIFs survive. Not worth blocking the ship for motion.

**Per-run cost printed in every email footer** — token usage read off the API response, ~$0.04/run rendered next to the streak. Cost awareness as a habit, not a report. Pricing constants verified 2026-07-12 ($3/$15 per MTok, Sonnet 4.6) and the verified date ships in the footer so a stale rate discloses itself.

**Streak via n8n workflow static data, capped at one increment per calendar date** — no external DB; manual test re-runs don't inflate it. Honest caveat: it counts run-days, not consecutive days — a true streak-with-reset is v2.

## Security

**Secrets live in n8n's credential store, never in node fields, never in the repo** — enforced after the workflow.json incident. All three keys (Anthropic, NewsData, OpenWeatherMap) rotated; git history audited; .gitignore blocks stray .env; required keys documented in README without values.

## Failure modes (identified, and how handled)

- **Model wraps JSON in ``` fences** → Build-Email strips fences + JSON.parse with a try/catch fallback, so malformed output degrades instead of crashing. Rule: the fallback object must mirror the full schema — every new key gets added there too.
- **Model output-shape drift** → asked for time estimates on actionables and the model switched from strings to {task, time} objects; email rendered "[object Object]". Fix is defense in depth: shape pinned in the prompt AND a shape-tolerant toLine() renderer. Prompts are contracts the counterparty occasionally renegotiates.
- **Quote collision inside the prompt string** → an example containing double quotes, embedded in a double-quoted JS string, broke the Assemble node with a SyntaxError. Rule: example text inside instructions uses single quotes.
- **Empty node halts the run (n8n default)** → "Always Output Data" ON for Calendar; empty {} objects additionally filtered in Assemble so junk never reaches the prompt.
- **Silent failure at 9am** → Error Trigger node wired to a failure-alert email; a broken run now announces itself instead of just not arriving.
- **Buried actionable missed by snippet trimming** → real risk: an ask below the first 300 chars gets misjudged. Accepted for v1 (N=1, I still glance at the inbox; ship gate is "I keep reading it," not perfect recall). v2 fix is tiered retrieval: cheap triage over all 50 snippets, full-body read only on the few flagged. A deliberate precision-vs-cost tradeoff, documented rather than hidden.
- **NewsData.io returns cross-category duplicates and miscategorized items** → observed live (same headline ×3). Prompt-side caps hide it; the real fix is dedup in Merge News, logged for v2.
- **Laptop off at 9am** → no run. Accepted v1 limitation; always-on hosting is v2.

## What I'd change in v2

Split judgment pass from render pass; tiered email retrieval (triage → deep-read); news dedup in Merge News; calendar write-back to log the one-thing; birthdays; one-tap actionable links (HITL); WhatsApp delivery; always-on hosting; true streak-with-reset.

## Changelog

- **2026-07-12** — Added relevance filter after 3-email audit showed ~40% of items required no action. Three-test rule, explicit Work-Personal definitions, hard caps. Curation over aggregation, now enforced in prompt.
- **2026-07-12** — Wired closure_line end-to-end (rules → schema → render); fixed dangling "Bottleneck Test" reference; aligned read_more cap at 2; stripped editorial markers from the live prompt; real streak counter via static data; Error Trigger added; quote-collision and [object Object] bugs fixed and generalized into rules.
