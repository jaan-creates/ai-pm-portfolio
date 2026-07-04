# DECISIONS.md — Daybreak (Morning Briefing, Project 1)

> Every non-obvious choice and its one-line reason. Written to survive a hostile
> interview question. A hiring manager should read this in 4 minutes and form a
> view of how I think.

## Architecture

**n8n (visual workflow) over writing Python** — n8n handles OAuth, scheduling, HTTP,
and six integrations as drag-connect nodes: ~200 tokens of config versus 5000+ of
code I'd have to maintain when an API changes. Lowest layer that solves the problem.

**One monorepo, folder per project** — easier to browse range; both tracks coexist;
less repo sprawl.

**The n8n workflow is committed as `workflow.json`** — makes an app-based build
reproducible and visible to anyone who can't see my localhost.

**HTTP Request node for the Claude call, not n8n's native Anthropic node** — for a
single call, HTTP is transparent and portable; "I knew what every header did" is a
stronger interview answer than "I used the built-in node."

**Request body built in a Code node, HTTP node just forwards it** — n8n's JSON field
validator chokes on multi-line expressions. Building the payload as a JS object and
passing `JSON.stringify()` guarantees valid JSON. Separation of concerns: construction
in code, transport in the HTTP node.

**One Build-Email Code node parses + prices + renders** — rather than three nodes,
one node turns Claude's text into JSON, computes the run cost from token usage, and
renders the HTML. Rendering logic lives in code, not scattered in the Gmail field.

## The brain (the actual product)

**Curation = cluster → score → select → demote, not aggregate-into-boxes** — the
differentiator. Clustering across sources produces one line ("your 11am — deck landed
at 7am, thread still arguing scope"), not three scattered entries.

**Two-layer priorities.md (principles + known senders)** — Layer 1 principles judge
any sender including ones never seen before (a first recruiter email); Layer 2 is
shortcuts for known senders. Designed this way specifically to avoid overfitting to
the sample inbox — the day something important arrives from a new sender, Layer 1
still catches it.

**Structured 8-key JSON output** — separates reasoning from rendering; the same brain
renders to email now, WhatsApp/voice later, with zero change to the judging logic.

**Permission to say "nothing urgent" is a designed feature** — a quiet brief is more
trustworthy than four manufactured bullets. Trust is the retention mechanic.

**Pre-forgiven, ADHD-optimized tone** — shame-removal is structural, not cosmetic. A
brief that guilts you about backlog gets muted.

**Ordered by decision-urgency, not by source** — one-thing → actionables → dated items
→ FYIs → news. An FYI needs nothing from me, so it never sits above something that does.

## Scope / cost

**priorities.md ships as a flat file, no editing UI** — building a config editor before
the system is proven is yak-shaving. Tune through real use instead.

**Emails trimmed to sender/subject/snippet before the Claude call** — 50 full bodies
would be 30-50k tokens/run and cost 4-5x more daily; snippet is enough to judge. Cost
discipline. (Snippet at 300 chars in v1; widening to 600 is a logged v2 tweak.)

**Gmail→Gmail delivery for v1; WhatsApp deferred** — WhatsApp is the real thesis, but
must not block shipping the brain. Prove curation on the easy channel first.

**CSS gradient header; animated GIF deferred to v2** — Gmail strips CSS keyframes and
JS; only hosted GIFs survive. Not worth blocking the ship for motion.

**Secrets stay in n8n's credential store, never committed** — the workflow export omits
credentials; `.gitignore` blocks stray `.env`; required keys documented in README.

## Failure modes (identified, and how handled)

1. **Model wraps JSON in ``` fences** → Build-Email node strips fences + `JSON.parse`
   with a try/catch fallback, so malformed output degrades instead of crashing.
2. **Empty node halts the run** (n8n default) → "Always Output Data" ON for Calendar,
   so a quiet-calendar day doesn't kill the brief.
3. **Buried actionable missed by snippet trimming** → real risk: an ask below the first
   300 chars gets misjudged. Accepted for v1 (N=1, I still glance at the inbox; ship
   gate is "I keep reading it," not perfect recall). v2 fix is tiered retrieval:
   cheap triage over all 50 snippets, full-body read only on the few flagged. This is
   a deliberate precision-vs-cost tradeoff, documented rather than hidden.
4. **Laptop off at 9am** → no run. Accepted v1 limitation; always-on hosting is v2.
5. **News query pulls occasional junk** → v2 query tuning.

## What I'd change in v2

Split judgment pass from render pass; tiered email retrieval (triage → deep-read);
calendar write-back to log the one-thing; birthdays; one-tap actionable links (HITL);
WhatsApp delivery; always-on hosting.
