# Case Study — Daybreak: An AI Morning Brief That Judges, Not Aggregates

> A curation-first morning briefing built on n8n + Claude. This case study folds the
> product thinking (persona, JTBD, solution) and the engineering (architecture, key
> decisions) into one narrative, and closes with the v1 → v2 versioning story.

---

## The problem

A working person's morning attention is pre-claimed by apps. Catching up means
opening five apps and self-triaging noise — promos, receipts, newsletters, the
occasional thing that actually matters — before the day even starts. The signal is
buried; the cost is 15–20 minutes and the risk of missing the one item that needed a
decision.

## The user & the job-to-be-done

**Persona:** a busy knowledge worker (v1: me — a PM, job-hunting, remote, attention
scattered in the mornings).

**JTBD:** *"When I start my day, tell me what changed overnight and what needs me
today, with zero app-shuffling, so I start deliberately instead of reactively."*

**The core insight:** the job is *less*, but the *right* less. The value is in what
the brief chooses to leave out. A tool that forwards more noise gets muted; one that
judges gets kept.

## The solution

Every weekday at 9am, an automation pulls email, calendar, weather, and news, hands
them to Claude alongside an operator profile that encodes "what matters to me," and
delivers a curated, decision-ready brief as a designed HTML email: one clear
priority, priority-ordered FYIs and actionables, a World Cup section, 2–3 news items,
newsletter read-more with positioning blurbs, and a build footer showing per-run cost.

The differentiator is **curation, not aggregation**. Most briefing tools drop each
item into a fixed box (work email in the work card). Daybreak clusters *across*
sources first — a calendar meeting + the email with the deck + the thread about it
becomes one line — then scores each cluster against the operator profile and surfaces
a single "today's one thing." It is also allowed to say *"nothing urgent today"* —
which, counterintuitively, is what makes it trustworthy.

## Architecture

```
Schedule (9am IST) → date/weather/news/email/calendar (5 sources)
  → Assemble (gather + trim + build request) → Claude (curate → JSON)
  → Build Email (parse + price + render) → Gmail (send)
```

The brain outputs structured JSON, which keeps *reasoning* separate from *rendering* —
the same judging logic can render to email today, WhatsApp or voice later, with no
change. That modality-independence is the long-term thesis: the channel that reaches
most working people (especially in India) is WhatsApp, not another inbox.

## Key decisions (full list in DECISIONS.md)

- **n8n over hand-rolled code** — lowest layer that solves six integrations + OAuth +
  scheduling; the right-tool answer beats the hardest-tool answer.
- **Two-layer operator profile** — principles that judge unseen senders + shortcuts
  for known ones, designed to avoid overfitting to the sample inbox.
- **Emails trimmed before the model** — cost discipline; snippet is enough to judge.
- **"Nothing urgent" as a feature** — trust over manufactured urgency.

## What it costs

~$0.044 per run (measured; ~10.7k in / ~800 out tokens on Claude Sonnet). One call per
day, so spend is bounded by design — roughly $1/month. (Verify current Sonnet pricing
before quoting.)

## Honest limitations (the part that matters)

- **Snippet trimming can miss a buried actionable** — an ask below the first ~300
  characters may be misjudged. Accepted for v1 (N=1; I still glance at the inbox; the
  ship gate is "I keep reading it," not perfect recall). The v2 fix is tiered
  retrieval: cheap triage over all items, full-body read only on the few flagged.
- **Laptop-hosted** — no run if the machine is off; always-on hosting is v2.
- **News query quality is rough** — occasional irrelevant items; v2 query tuning.

## Versioning: v1 → v2

**v1 (shipped):** the curation brain, five sources, designed email, measured cost.
Proves the core bet — that judgment beats aggregation — on the easy channel.

**v2 (roadmap):** split judgment from rendering; tiered email retrieval; calendar
write-back (log the one-thing as an event); birthdays; one-tap actionable links
(human-in-the-loop, no auto-send); WhatsApp delivery; always-on hosting.

The iteration itself is the point: ship the smallest version that proves the bet,
document where it misses, improve deliberately.
