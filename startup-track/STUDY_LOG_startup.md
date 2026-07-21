# Study Log — Startup Track

---

## Session 1 — 2026-05-22

**Duration:** —
**Focus:** Project setup and orientation

### What I did
- Initialized the startup-track repo structure
- Reviewed project list
- Ready to kick off the first project: Morning Briefing Automation

### Notes
- Starting fresh on the startup track
- First project is a practical automation task: build a morning briefing system

### Next session
- Begin the Morning Briefing Automation build

---

## Session 2 — 2026-07-21

**Duration:** —
**Focus:** Job-Copilot (Project 2) — competitor autopsy of career-ops + hiring-agent

### What I did
- Cloned two MIT-licensed reference tools (read-only, no code copied, ≤3-line snippets only): career-ops (santifer) and hiring-agent (InterviewStreet). Kept both out of git via `projects/Job-Copilot/.gitignore` (`_mined/`).
- Produced three deliverables in `projects/Job-Copilot/`:
  - **MANIFEST.md** — 811 files cataloged and domain-tagged (out-of-scope GitHub/engineer-artifact files excluded from mining).
  - **EDGE_CASES.md** — 76 edge cases across 7 domains, each with file:line evidence, an adopt/adapt/skip verdict, a robustness/UX/completeness tag, and PM-native reframes. Outreach findings flagged separately (not committed scope).
  - **ARCHITECTURE_NOTES.md** — 9 architecture decisions with engineer-assumption vs PM-native alternatives, a prompt/rubric pattern library, and a paste-ready MIT attribution block.

### Notes / top transplants identified
- Deterministic anti-hallucination fact gate between LLM tailoring and any user-facing output (career-ops `verify-cv-facts.mjs`).
- Three-state liveness classification (active/expired/uncertain — never binary).
- SimHash JD fingerprinting to catch agency re-posts that defeat URL + company dedup.
- Layered LLM-output defense: schema → normalize → validate → clamp (hiring-agent).
- Golden-set evals as the gate for any cheap-model routing decision.
- Fit score kept orthogonal to posting-legitimacy assessment.
- User-defined rubric overrides as the senior-PM personalization surface.

### Housekeeping
- Retired stale Project-0/1 scratch (`src/`, `package.json`) — superseded by the committed `projects/1-morning-brief/`.
- Refreshed `PROGRESS_startup.md` to reflect Project 1 complete, Project 2 active.

### Next session
- Draft the Job-Copilot v1 PRD from the autopsy verdicts.
- Define the PM fit rubric (archetypes + anchored bands) and build the 10-case golden set before writing pipeline code.
