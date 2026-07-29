# CONTEXT.md — Daybreak (Morning Brief, Project 1)

For a senior EM with ten minutes and no prior exposure to this repo.

## 1. What this is

A personal n8n automation ("Daybreak") that, per its docs, pulls email/calendar/weather/news
each weekday morning, sends them to Claude with an operator profile to decide what matters,
and emails the user a curated brief. This repo is the **documentation + exported workflow**
for that automation — it is a portfolio artifact, not an application you clone and run.

## 2. Stack

There is no manifest, lockfile, or package.json — this is not a buildable codebase. The stack
is entirely evident from the exported workflow (`Morning Debrief Email.json`, an n8n 17-node
JSON export):

- **n8n** (self-hosted, node version unspecified in the export) — orchestration/scheduling.
- **Claude API**, called directly via `n8n-nodes-base.httpRequest` (not n8n's native
  Anthropic node) — `POST https://api.anthropic.com/v1/messages`, model string hardcoded in
  the "Assemble" node as `"claude-sonnet-4-6"`. (README/CASE_STUDY say "Claude Sonnet"
  generically; the actual pinned model id is more specific than the prose implies.)
- **NewsData.io** — 5 parallel HTTP Request nodes (India/World/Business/Sports/Climate).
- **OpenWeatherMap** — 1 HTTP Request node, hardcoded to `Thiruvananthapuram,IN`.
- **Gmail node** (OAuth2) — read (`Get many messages`) and send (`Send a message`).
- **Google Calendar node** (OAuth2) — `Get many events`.
- Two `n8n-nodes-base.code` nodes carry the actual logic: `Assemble` (builds the Claude
  request payload) and `Build Email` (parses Claude's JSON reply, computes per-run cost,
  renders the HTML email).

No test framework, no CI config, no Dockerfile, no dependency manifest exists in this
directory or its parents relevant to this project.

## 3. Architecture

Plain language: a schedule trigger fires, five nodes fetch context (date, weather, 5 news
categories merged into one, unread Gmail messages, today's Calendar events), a `Priorities`
Set node injects the operator profile text, `Assemble` (JS) mashes all of it into one Claude
prompt and builds the API request body, `HTTP Request` sends it to Claude, `Build Email` (JS)
parses Claude's JSON output, computes cost from token usage, and renders a Gmail-safe HTML
email, and `Send a message` emails it to the user.

```
Schedule Trigger
  ├─ Edit Fields (date)
  ├─ Weather → Format Weather
  ├─ News India/World/Business/Sports/Climate → Merge News
  ├─ Get many messages (Gmail)
  ├─ Get many events (Google Calendar)
  └─ Priorities (Set: loads operator-profile text)
       ↓
     Assemble (Code: builds Claude request JSON)
       ↓
     HTTP Request (POST api.anthropic.com/v1/messages)
       ↓
     Build Email (Code: parse reply → compute cost → render HTML)
       ↓
     Send a message (Gmail send-to-self)
```

Directory map of what's actually in this folder (flat, not nested as README describes):

```
1-morning-brief/
├── README.md                    — pitch + claimed repo layout (see §6, layout is stale)
├── CASE_STUDY.md                — persona/JTBD/architecture narrative
├── DECISIONS.md                 — decision log + failure-mode list
├── COSTS.md                     — token math, cost claims
├── priorities.md                — the operator profile (real content, richly detailed)
├── prompt_template.txt          — human-readable copy of the prompt (labeled "reference")
├── email_template.html          — human-readable copy of the email markup ("reference copy")
└── Morning Debrief Email.json   — the real n8n export (17 nodes); README calls this
                                    file "workflow.json" and expects it under `src/` —
                                    it exists only at repo root, under a different name
```

## 4. Verified state

**Build:** N/A — no code to compile. There is nothing to "run" from this repo directly; the
artifact is an n8n workflow JSON meant to be imported into a running n8n instance.

**Tests:** none exist. No test files, no test runner config.

**Referenced but absent:**
- README's repo-contents tree lists `.gitignore`, `src/priorities.md`, `src/prompt_template.txt`,
  `src/email_template.html`, `assets/`, and `docs/` — **none of these exist**. The actual files
  sit flat at repo root, and the workflow file is named `Morning Debrief Email.json`, not
  `workflow.json` as the README states. This is Designed (in the README) but not Implemented
  (on disk).
- Credentials are referenced by n8n credential-store IDs in the export (Gmail OAuth2,
  Google Calendar OAuth2, a generic `httpHeaderAuth` for the Anthropic call) — consistent
  with DECISIONS.md's claim that secrets live in n8n's credential store, not this repo. That
  part checks out.

**Secrets that ARE committed, contrary to DECISIONS.md's claim ("secrets stay in n8n's
credential store, never committed"):**
- `Weather` node: OpenWeatherMap API key hardcoded in the URL (`appid=f0dc0104d2e10ba673ca9aed8f1da084`).
- Five `News *` nodes: NewsData.io API key hardcoded in the URL (`apikey=pub_6ef73d141b9247dfbefb2c032f4dec39`).

These are live in the current committed JSON at repo root. This is a real, present-tense risk,
not a historical one — see §6.

**Everything stubbed, mocked, hardcoded, or placeholder:**
- Weather location hardcoded to `Thiruvananthapuram,IN` (matches `priorities.md`'s stated
  location, so consistent, but not configurable without editing the JSON).
- Model id hardcoded as a string in the `Assemble` code node.
- Cost math in `Build Email` uses hardcoded per-token rates (`$3`/`$15` per 1M tokens) with an
  inline comment flagging them as "~early-2026 rates" to verify — the author already marked
  this as potentially stale, not something I'm inferring.
- `pinData` in the export is empty — no sample/pinned execution data was exported, so the
  repo itself carries no proof of a captured real run's I/O.

**Evidence it has ever run for real:**
- The workflow's `"active": true` flag is set in the export, and it references real-looking
  n8n credential IDs (not placeholders) for Gmail, Calendar, and the HTTP header auth — this
  is evidence it was wired into a live, credentialed n8n instance at export time.
- COSTS.md asserts a specific measured run ("run of 2026-07-03": ~10,686 in / ~793 out
  tokens, ~$0.044) and DECISIONS.md's tuning-log entry is dated 2026-07-12 describing a
  change made after auditing 3 real emails. These are specific, dated, falsifiable claims —
  more credible than a vague "it works" — but the repo contains no raw log, screenshot, or
  execution export to independently verify them. Treat as **claimed, plausible, unverified
  from the repo alone.**
- The README's "ship gate" (7 consecutive weekday mornings running unattended) is stated as
  the bar to clear, not stated as cleared. Whether it was actually cleared is unknown from
  this repo.

**Last commit / activity shape:**
- Last commit touching this project: `c101636 Update email_template.html`, 2026-07-12.
- History for this folder (8 commits): three raw "Add files via upload" commits
  (2026-07-12), then five documentation refinement commits the same day/window
  (prompt template relevance-filter rewrite, DECISIONS.md update, two email-template
  tweaks). All activity is clustered in a single day — no iterative multi-day commit
  history, no revert/fix commits, no CI.

## 5. Decisions recoverable from the repo

DECISIONS.md is unusually thorough and largely self-explaining — recoverable, not inferred:
- n8n chosen over hand-rolled code: cost of maintaining glue code vs. drag-connect
  integrations (stated reason: "lowest layer that solves the problem").
- HTTP Request node over n8n's native Anthropic node for the Claude call: transparency/
  portability, explicitly framed as a stronger interview answer.
- Claude request body built in a Code node rather than n8n's native JSON field: n8n's field
  validator "chokes on multi-line expressions" — confirmed by reading the `Assemble` node,
  which does build `claudeBody` as a JS object.
- One `Build Email` code node does parse + price + render rather than three nodes: confirmed
  in the export — one node performs all three steps in sequence.
- Emails trimmed before the Claude call for cost control: `Assemble` node confirms this —
  `snippet: (e.snippet || '').slice(0, 200)`. Note: DECISIONS.md and CASE_STUDY.md both state
  the trim is "300 chars"; the actual code trims to **200 chars**. This is a real, verifiable
  discrepancy between the documented design and the implemented code, not a rounding issue.
- 2026-07-12 tuning-log entry: relevance filter added after a 3-email audit showed ~40% of
  items needed no action — reason is recoverable and dated, matches the `prompt_template.txt`
  content (explicit ACTION/DECISION-CHANGING/TIME-RISK test is present in the file).
- Where DECISIONS.md doesn't give a reason (e.g., why 1800 `max_tokens` specifically, why
  Sonnet over Haiku for this workload rather than the documented "v2 idea"), that's a gap —
  no invented justification supplied here.

## 6. Risks and fragility

- **Committed API keys (real, present risk):** OpenWeatherMap and NewsData.io keys are
  plaintext in `Morning Debrief Email.json` at repo root, in git history, contradicting the
  repo's own stated secrets policy. Both are low-severity, free-tier keys (weather/news
  lookups, not financial or PII access), but they are exposed publicly if this repo is public,
  and should be rotated and moved to n8n credentials/env like the Gmail/Calendar/Anthropic
  auth already is.
- **Documentation/reality drift:** the README's repo-contents tree (`src/`, `assets/`, `docs/`,
  `.gitignore`, `workflow.json`) does not match what's on disk. A reviewer following the README
  literally will not find those paths. Low functional risk (nothing depends on the paths being
  right, since there's no build step), but it undermines trust in the rest of the documentation
  being current.
- **Snippet-length mismatch:** documented as 300 chars in two places, actually 200 in the code.
  Minor, but it's exactly the kind of prompt-input detail that changes real curation quality
  (the acknowledged failure mode #3 in DECISIONS.md — "buried actionable missed by snippet
  trimming" — is more likely at 200 chars than at the documented 300).
- **Single point of failure by design, acknowledged:** laptop-hosted, no run if the machine is
  off at 9am (DECISIONS.md failure mode #4, explicitly accepted for v1).
- **JSON-parse fallback is silent-degrade, not silent-fail:** `Build Email`'s try/catch on
  `JSON.parse` produces a malformed-but-sendable email rather than crashing the workflow — a
  reasonable choice, but it means a broken Claude response would still be emailed with no
  alerting; the user would only notice by reading a garbled brief.
- **Hardcoded cost rates:** the per-token pricing constants in `Build Email` are static and
  already flagged by the author as needing verification against current Anthropic pricing —
  will silently drift if the API's pricing changes.
- **No tests, no CI, no automated verification of any kind** for either the prompt template or
  the render logic — the only feedback loop is the author reading the daily email.

## 7. Where a reviewer should start

1. **`Morning Debrief Email.json`** (via Read or `n8n import`) — this is the only ground truth
   in the repo; everything else is prose describing it. Confirms/refutes every claim in
   README/DECISIONS/CASE_STUDY/COSTS in about five minutes, and is where the committed API
   keys and the 200-vs-300-char discrepancy are visible directly.
2. **`DECISIONS.md`** — the most information-dense file per minute of reading; written
   explicitly to survive a hostile interview question, and it does a good job of separating
   what was chosen from what's still a known gap (the failure-modes section in particular).
3. **`README.md`'s repo-contents tree vs. `ls` output** — takes thirty seconds to compare and
   is the fastest way to calibrate how much to trust the rest of the documentation's precision.
