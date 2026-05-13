# Study Log — AI PM Curriculum

> Append-only history of every learning session. Newest entries at the top. **Never edit a past entry.** If a past entry was wrong, append a correction entry today with a note. The error stays visible; the correction is dated.
>
> Authority rank: `STUDY_LOG.md` (this file) > `PROGRESS.md` (derived snapshot) > project memory > unverified claim.
>
> **Schema:** v2 (2026-05-13). Session entry format follows file `08_Continuity_and_State_Management.md`, Part 3. Session headers from Session 2 forward use `YYYY-MM-DD HH:MM — Session N` format. Session 1's header omits HH:MM and is preserved as-is per the immutability rule.

---

**Streak:** 1 consecutive session with clean boot + close
**Last session date:** 2026-05-12
**Total sessions logged:** 1

---

## 2026-05-12 — Session 1

- **Boot source:** First session — no prior log; ran 5-question intake instead of BOOT
- **Phase / Module / Lesson worked on:** Phase 0 (Builder's Toolkit) / Module 0.1 / Lesson 1 — The non-coder's mental model of software
- **Lessons completed today:**
  - Lesson 1 — The non-coder's mental model of software (passed review at 18/25, greenlit)
- **Artifacts produced (with repo paths):**
  - `phase-0-foundations/01-software-mental-model.md` — 1-page cheat sheet covering Program, Runtime, Library, Framework, Package, Client/Server, API, JSON, Terminal + e-commerce sequence diagram + walkthrough
- **Decisions made (with rationale):**
  - Track chosen: 240-day FAANG-Ready Track (8–10 hrs/week across 5 weekdays) — matches FAANG AI PM goal at sustainable pace
  - Goal: FAANG / top-AI-startup AI PM role + portfolio building (intake answers (a) + (c))
  - Phase 0 (Builder's Toolkit) confirmed mandatory based on intake — no terminal comfort, no prior LLM API calls, partial Git CLI experience
  - Folder structure standardized: open the inner `ai-pm-portfolio/` repo as the VS Code workspace; phase artifacts live in `phase-N-*/` subfolders; nested duplicate-name folder (outer `AI-PM-PORTFOLIO/`) deprecated
  - Coding stance: prefer no-code where possible; Claude-generated code where not; will not need to write production Python from scratch but will need to read and modify it by Phase 2
  - Editor for Phase 0: TBD next session (Cursor vs VS Code — Cursor recommended, decision deferred to Lesson 2)
- **Checkpoints during session:** 1 (Lesson 1 close)
- **Open commitments going into next session:**
  - Confirm GitHub username and that `ai-pm-portfolio` repo exists publicly
  - Decide Cursor vs VS Code before Lesson 2
  - Apply two minor unblocking fixes to Lesson 1 artifact (move Django/Flask example to Framework entry; refine JSON definition to include "human-readable AND machine-parseable")
- **Weak areas surfaced:**
  - Why a virtual environment exists (carried forward to Lesson 2)
  - How Git commit / push works mechanically (carried forward to Lesson 5)
  - Tendency to skip examples in definitions when filling out templates — pattern flagged for future artifacts
  - Tendency to paste templates and edit inside them rather than re-typing — minor habit to watch
- **Refresh / audit ran?** N/A (Session 1)
- **Time spent:** ~75 minutes (intake + Lesson 1 + 2 review cycles)
- **Energy / pacing read:** Medium. Took two review cycles to clear Lesson 1 — this is normal and the right level of friction; not a sign to slow down or speed up.
- **Notes for next session:**
  - Start with `BOOT` and paste the top of this log
  - Lesson 2 is the longest setup lesson in Phase 0 (~75 min, may split across two sessions)
  - Pre-work: have GitHub username handy, decide editor, ensure Python 3.11+ confirmed working
  - Capstone ideas intake offered but not yet used — learner can send `CAPSTONE IDEAS:` whenever ready, no rush

---

## How to use this file going forward

- Every session ends with `SAVE STATE` or `WEEK CLOSE`. Both append a new entry **above** all prior entries (newest at top, immediately below the streak header).
- Every meaningful event during a session can be captured by typing `CHECKPOINT`. The mentor produces a 5–10 line block to append to the top.
- **Past entries are immutable.** If a past entry was wrong, append a new entry today with `## YYYY-MM-DD HH:MM — Correction to Session N` in the header.
- Commit this file to git after every update. The git history is the audit trail.
- Schema reference: `STUDY_LOG_TEMPLATE.md` (same repo) — blank skeleton with all required fields.
