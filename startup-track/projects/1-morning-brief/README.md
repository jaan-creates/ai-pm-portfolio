# Daybreak — AI Morning Briefing

**This is a curation-first morning brief** that reads my email, calendar, weather, and
news each morning, has Claude judge what actually needs me today (cluster across
sources → score → surface one priority → drop noise), and delivers it as a designed
HTML email at 9am IST. Built on **n8n + Claude Sonnet**. Cost: ~$0.04/run.

> It judges, it doesn't aggregate. A calendar meeting + the email with the deck + the
> thread about it become *one line*, not three. And it's allowed to say "nothing
> urgent today" — which is what makes it trustworthy.

**→ Read the [CASE_STUDY.md](CASE_STUDY.md) for the full product + engineering story.**

## What it does

Every weekday at 9am: pulls 5 sources, runs them through an operator profile
(`src/priorities.md`) that encodes "what matters to me," and renders a brief with one
clear priority, priority-ordered FYIs and actionables, a World Cup section, 2–3 news
items, newsletter read-more with positioning blurbs, and a build footer showing
per-run cost.

## Who it's for

One real user (me): a PM whose morning attention is pre-claimed by apps. JTBD: "tell
me what changed overnight and what needs me today, with zero app-shuffling."

## Stack

n8n (self-hosted CE) · Claude Sonnet (HTTP Request node) · NewsData.io · OpenWeatherMap
· Gmail (read + send) · Google Calendar · 9am IST weekday schedule.

## Architecture

```
Schedule (9am IST) → date · weather · news · email · calendar (5 sources)
  → Assemble (gather + trim + build Claude request)
  → Claude (curate → structured JSON)
  → Build Email (parse + compute cost + render HTML)
  → Gmail (send to self)
```

The brain outputs structured JSON, keeping reasoning separate from rendering — the
same judging logic can render to email now, WhatsApp/voice later.

## Run it yourself

1. Install n8n (self-hosted CE), start it (`localhost:5678`).
2. Import `workflow.json` (Workflows → Import from File).
3. Add credentials in n8n's credential store (NOT in this repo): Anthropic API key,
   NewsData.io key, OpenWeatherMap key, Gmail OAuth, Google Calendar OAuth.
4. Edit `src/priorities.md` with your own operator profile.
5. Run manually to test, then activate the 9am schedule.

## Ship gate

Runs autonomously for 7 consecutive weekday mornings without a manual fix, and the
brief is good enough that I read it instead of opening the apps. (Personal automation,
so "live" = the working scheduled run + this repo + the Loom, not a public URL.)

## Repo contents

```
1-morning-brief/
├── README.md            ← this file
├── CASE_STUDY.md        ← persona, JTBD, solution, architecture, v1→v2
├── DECISIONS.md         ← every non-obvious choice + why
├── COSTS.md             ← token math + per-run cost
├── workflow.json        ← the exported n8n workflow (reproducible source)
├── .gitignore
├── src/
│   ├── priorities.md        ← operator profile (the brain's fuel)
│   ├── prompt_template.txt  ← the curation prompt
│   └── email_template.html  ← email markup (reference; live version in Build Email node)
├── assets/              ← email screenshot, architecture diagram
└── docs/                ← supporting: PRD, TFR, learning module
```

## What's next (v2)

Split judgment from rendering; tiered email retrieval (triage → deep-read); calendar
write-back; birthdays; one-tap actionable links (HITL); WhatsApp delivery.
