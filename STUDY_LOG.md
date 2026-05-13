# Study Log — AI PM Curriculum

> Append-only history of every learning session. Newest entries at the top. **Never edit a past entry.** If a past entry was wrong, append a correction entry today with a note. The error stays visible; the correction is dated.
>
> Authority rank: `STUDY_LOG.md` (this file) > `PROGRESS.md` (derived snapshot) > project memory > unverified claim.
>
> **Schema:** v2 (2026-05-13). Session entry format follows file `08_Continuity_and_State_Management.md`, Part 3. Session headers from Session 2 forward use `YYYY-MM-DD HH:MM — Session N` format. Session 1's header omits HH:MM and is preserved as-is per the immutability rule.

---
**Streak:** 2 consecutive sessions with clean boot + close
   **Last session date:** 2026-05-13
   **Total sessions logged:** 2

   2026-05-13 14:00 — Session 2

Boot source: Clean — pasted top of STUDY_LOG.md (Session 1 block) + full PROGRESS.md v2
Phase / Module / Lesson worked on: Phase 0 / Module 0.2 / Lesson 2 — Set up your machine (Windows / Cursor edition)
Lessons completed today:

Lesson 2 — Set up your machine (closed without self-check; self-check deferred to Session 3 start as 5-min retrieval warmup)
Decision recorded: Lesson 3 (originally reserved as "Lesson 2 part 2 if it splits") is merged into Lesson 2. No separate Lesson 3 needed. All Module 0.2 work is complete. Session 3 jumps to Lesson 4 (Command line literacy).


Artifacts produced (with repo paths):

uv installed at v0.11.14 (verified uv --version in fresh terminal)
Workspace file: ai-pm-portfolio.code-workspace on Desktop (one-click open at correct path)
README.md rewritten with real content (one-line description, "Who I am" section with destination, structure, track + timeline, contact)
CHANGELOG.md initialized with 2026-05-12 baseline entry per 09_Curriculum_Currency_and_Refresh.md
.env.example created with Anthropic / OpenAI / HuggingFace key placeholders (Anthropic filled in real .env; OpenAI/HF deferred)
Permanent git PATH fix applied via [Environment]::SetEnvironmentVariable(...) and verified working in fresh non-Cursor PowerShell
All work landed on GitHub in 2 clean commits: lesson-2: readme, changelog baseline, env example (rebased as 49720f2) and session-1 catch-up: gitignore and hello_claude.py (5661306)


Decisions made (with rationale):

Editor: Cursor confirmed as primary (Session 1 was VS Code; switched today). Session 1's VS Code work transferred via repo.
Shell: PowerShell for Phase 0; defer "PowerShell vs Git Bash" decision to Lesson 4 (Command line literacy) where it belongs as content.
Source-of-truth rule going forward: commits originate from local repo only, edited in Cursor, pushed manually. GitHub web UI for emergencies only. Three-surface editing yesterday (VS Code + GitHub web UI + Cursor today) caused the divergence resolved this session.
Lesson 3 merged into Lesson 2. Session 3 jumps to Lesson 4.
Deferred housekeeping (not blocking): reinstall Git at default C:\Program Files\Git\ location (currently at C:\Program Files\AI Project\Git\); decide fate of outer wrapper folder and learning-journal/.
Deferred installs (correct deferrals): Docker Desktop (defer to Phase 4), OpenAI API key (defer to Lesson 7), Hugging Face API key (defer to Phase 1 Lesson 13).


Checkpoints during session: 1 explicit (Cursor opened at correct path); rest of session was a single extended remediation block, closed at SAVE STATE.
Open commitments going into next session:

Lesson 2 self-check (4 questions) — to be answered at start of Session 3 as 5-min retrieval warmup
Optional housekeeping (defer-able): reinstall Git at default location; decide fate of outer wrapper folder + learning-journal/
Pre-work for Lesson 4: none (no installs needed; uses tools already in place)


Weak areas surfaced:

Verification ritual missing — yesterday's "Push Lesson 1 confirmed" claim was true on one surface (GitHub via web UI) but false on another (local git index never knew). No mechanism existed to catch this until today's git status discovered it. Proposed forcing function (for adoption Session 3 onward): end every session with a 60-second verification — run git status + git log --oneline -3, paste both outputs into the SAVE STATE block. Three commands. Catches drift in real time.
Single-source-of-truth violation — editing via three surfaces (VS Code yesterday, GitHub web UI yesterday, Cursor today) created the rebase tangle. New rule (above): commits from local repo only.
Recurrence of an existing weak-area pattern — PROGRESS.md's calibration note "using 'I think / hoping' rather than verifying state" was added 2026-05-13 morning, then the same pattern hit hours later on git state. Calibration notes alone don't fix patterns; only forcing functions do. The verification ritual above is the forcing function for this one.
Carried forward (still open from Session 1): virtual environments (covered in Lesson 2 implicitly via .venv/ already existing — but the "why does it exist" question still wasn't directly answered; surface again at Lesson 7 first-API-call); Git mechanics (covered partially today through real experience — full coverage in Lesson 5); Terminal fluency (Lesson 4, next session).


Refresh / audit ran? No formal refresh or audit. However, the Anti-Fabrication doctrine in 08_Continuity_and_State_Management.md Part 5 caught its first real-world case today when the "Push Lesson 1 confirmed" claim was surfaced as misleading. The system worked as designed. Worth banking as evidence the architecture has teeth.
Time spent: ~2 hours 15 minutes wall-clock, decomposed honestly:

BOOT + pre-lesson checks: ~10 min (clean)
Lesson 2 core content (uv, workspace, README, CHANGELOG, .env.example): ~25 min (clean)
Inherited Session 1 git debt cleanup (folder confusion → git PATH → push rejection → fetch/rebase tangle → encoding mojibake → final rebase): ~90 min
Close + audit conversation (this section): ~10 min


Energy / pacing read: Medium-low by the end. The lesson content went smoothly; the inherited debt was draining but not defeating. Pacing read for the track is still on-pace — today's overrun was inherited debt, not lesson difficulty. Phase 0 friction is bimodal (5-min smooth or 2-hour outlier); today was an outlier.
Mentor performance (calibration notes for honesty and future review):

Misread of git log divergence state — when local showed 1 commit ahead of origin/main, mentor concluded "GitHub has nothing new, just push." Wrong: origin/main is the local cache of where GitHub was last fetched. Should have run git fetch immediately before trusting the count. Cost: ~4 turns of confused "push rejected again?" before reaching the right diagnosis.
PowerShell Out-File -Encoding utf8 footgun — writes UTF-16-with-BOM on Windows in some PS versions, which made fc.exe produce "one character per line" mojibake. Should have used Set-Content -Encoding utf8 -NoNewline (or piped git show directly into Get-FileHash comparison) from the start. Cost: ~2 turns + a moment of "did I lose data?" anxiety for learner.
Assumed default git install path — gave C:\Program Files\Git\bin\git.exe as a workaround, which didn't exist on this machine (actual install: C:\Program Files\AI Project\Git\). Should have asked where.exe git first instead of guessing. Cost: ~1 turn.
Missed the divergence-pattern signal earlier — when learner said "files are empty locally, however in git and in VS studio editor all this seems to be updated," mentor treated this as folder confusion and didn't immediately probe "where did yesterday's commits originate from?" If that had been asked, the GitHub-web-UI realization would have come in turn 3 instead of turn 14. Cost: ~5 turns of indirect discovery.


Notes for next session:

Start Session 3 with a 5-min Lesson 2 self-check (the 4 questions deferred today) before opening Lesson 4
Lesson 4: Command line literacy (cd, ls/dir, pwd, mkdir, touch/echo > file, cat/type, grep/findstr, curl, pipes |, redirection >, env vars, chmod/equivalent, basic SSH) — all instructions must be Windows-native (PowerShell-flavored) per memory; compare to bash only when the curriculum explicitly demands it. The "PowerShell vs Git Bash" choice question, deferred from this session, gets discussed and resolved as part of Lesson 4.
Adopt the new verification ritual at Session 3 close: git status + git log --oneline -3 + paste both into SAVE STATE block.
Boot will paste the top of STUDY_LOG.md (this Session 2 block) + the regenerated PROGRESS.md v3.

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
