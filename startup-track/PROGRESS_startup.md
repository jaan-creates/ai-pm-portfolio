# Portfolio Progress — Startup Track

**Active Project:** 2 — Job-Copilot (PM job-search agent)
**Last Updated:** 2026-07-21

---

## Project Status

| # | Project | Status | Notes |
|---|---------|--------|-------|
| 1 | Daybreak — Morning Briefing Automation | ✅ Complete | n8n + Claude workflow; case study, decisions, costs shipped in `projects/1-morning-brief/` |
| 2 | Job-Copilot — PM job-search agent | 🔄 In progress | Competitor autopsy complete (career-ops + hiring-agent). Next: v1 PRD + PM fit rubric + golden set |
| 3–10 | TBD | ⬜ Not started | — |

---

## Project 2 — Job-Copilot: phase log

| Phase | Status | Output |
|-------|--------|--------|
| Competitor autopsy (career-ops, hiring-agent) | ✅ Done | `projects/Job-Copilot/MANIFEST.md`, `EDGE_CASES.md` (76 cases, adopt/adapt/skip verdicts), `ARCHITECTURE_NOTES.md` |
| v1 PRD / scope cut | ⬜ Next | — |
| PM fit rubric + archetypes | ⬜ Next | — |
| Golden-set eval (10 synthetic PM JDs) | ⬜ Next | — |
| Pipeline scaffold (parse → normalize → validate → clamp) | ⬜ Later | — |

Scope reminder (from autopsy brief): JD parsing + fit assessment, application tracking, JD-tailored resume scoring/generation, analytics/decision support, skills-similarity matching. Outreach mined but **not** committed scope.

---

## Cost Log

Portfolio build spend is not separately metered. The one measured **product runtime** figure to date:

| Date | Project | Item | Cost |
|------|---------|------|------|
| 2026-07-03 | 1 — Daybreak | Per-run LLM cost (Sonnet, ~10.7k in / ~0.8k out) | ~$0.044/run (~$1/mo) |

> Daybreak's cost is bounded by design (one call per morning, no user-facing traffic). See `projects/1-morning-brief/COSTS.md`.
