# COSTS.md — Daybreak (Morning Briefing, Project 1)

> Per-run economics. A Series A/B interviewer asks "what does it cost to run?" — this
> is the answer.

## Measured (run of 2026-07-03)

- **Input tokens:** ~10,686
- **Output tokens:** ~793
- **Model:** Claude Sonnet
- **Cost per run:** ~$0.044

> ⚠️ VERIFY BEFORE PUBLISHING: the dollar figure uses early-2026 Sonnet per-token
> pricing. Token *counts* are real from the run; confirm current per-token rates in
> the Anthropic console before quoting the $ number publicly or in an interview.

## Why cost is bounded by design

One Claude call per morning, one recipient, no per-user request traffic. There is no
realistic path to a cost blow-up — a viral post can't spike spend because nothing is
user-facing. Daily ceiling ≈ one run.

## Monthly estimate

~$0.044 × ~22 weekday runs ≈ **~$1/month** at current usage.

## Cost levers already applied

- **Email trimming** — sender/subject/snippet(300) instead of full bodies. Full bodies
  would push each run to ~30-50k input tokens (4-5x cost).
- **Single call** — no multi-pass, no per-email calls.
- **Structured short output** — capped max_tokens; the brief is deliberately concise.

## Cheaper variant (documented, not yet applied)

Route quiet mornings (no complex triage needed) to **Claude Haiku** — roughly 10x
cheaper per token. A simple heuristic (few unread, no job-shaped senders) could pick
the cheap model, reserving Sonnet for high-signal days. Logged as a v2 optimization.

## The v2 cost tradeoff to watch

Tiered retrieval (full-body read on flagged emails) will *raise* per-run cost on busy
days — but only where accuracy matters. That's the precision-vs-cost dial, chosen
consciously rather than defaulted.
