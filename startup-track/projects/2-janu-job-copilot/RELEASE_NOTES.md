# Janu Job Copilot — Release Notes

User-facing release notes for meaningful usable behavior, reliability or limitation changes.

This is deliberately different from `BUILD_NOTES.md` and `OPERATOR_CHANGELOG.md`:
- **Release Notes:** what changed for the user.
- **Build Notes:** why/how we built it, evidence, tradeoffs, learning and next opportunities.
- **Operator Changelog:** privacy-safe turn-level engineering execution and verification state.

Do not add a release note for every commit or internal refactor.

## Status labels

- **Released / proven:** behavior is verified in the target environment.
- **Released / limited:** usable behavior is live with an explicit limitation.
- **Pending proof:** code/configuration exists, but target-environment verification is incomplete.
- **Blocked:** the behavior must not be relied on yet.

---

## 2026-08-24 — Resume review workflow clarity

**Status:** Released / proven

**What changed**  
Genuine Resume Review boundaries are surfaced in `My Actions`, with an explicit no-change approval path.

**What this means for you**  
If a tailored resume needs no changes, or all comments are resolved and you accept the exact active version, set the application’s **Resume Review Decision = Approved**. Approval means the system should accept that exact version and continue freshness, QA and readiness checks toward `Ready to Submit`.

If revisions are needed, use anchored comments rather than directly editing the generated resume body, so the revision path can create an immutable successor version. `Revision Needed` and `Withdraw` remain the other review choices.

**Important limitation / action required**  
`Approved` is not the same as `Submitted`. Do not manually set `Submission Ready?`; readiness must be derived from system checks. Authenticated employer-site submission remains the human boundary.

**Verified**  
The live `My Actions` surface currently contains genuine Resume Review actions and has been read back after wording reconciliation.

---

## 2026-08-24 — Renderer recurrence protection

**Status:** Pending proof

**What changed**  
A production-shaped Career Break / Independent Building regression, structural renderer repair, deterministic same-policy replay protection, renderer quarantine, and one-canary-before-backlog policy have been authored in the controlled Job Copilot deployment branch.

**What this means for you**  
The system is being changed so a known deterministic renderer failure cannot simply be replayed across multiple applications after being declared blocked.

**Important limitation / action required**  
This is not yet a proven runtime release. Resume-generation backlog remains quarantined until target Apps Script readback shows the new renderer contract, exact deployment provenance and one clean canary.

**Verified**  
Source/test controls exist; target-environment proof is still pending.

---

## 2026-08-24 — Golden trace durability and continuation recovery

**Status:** Pending proof

**What changed**  
TRACE-GOLDEN V0-2 adds exact URL identity so the Tekion journey cannot silently bind to another application, non-destructive trace publication, continuation-v3 starvation prevention and latest-attempt queue semantics.

**What this means for you**  
When proven live, the same fresh job should remain traceable through the workflow, and earlier terminal rows or stale historical successes should no longer strand later system-owned work.

**Important limitation / action required**  
Production still reported TRACE V0-1 / continuation v2 at the latest readback. Do not treat these controls as released until live contract/provenance evidence changes.

**Verified**  
Source controls and regressions exist; production proof pending.

---

## 2026-08-23 — Exact release provenance

**Status:** Released / proven

**What changed**  
The exact deployed Git execution commit and transformed source SHA-256 are recorded in connected product state.

**What this means for you**  
A production behavior can now be tied back to the exact verified deployment rather than an assumed source branch/version.

**Important limitation / action required**  
Automatic `clasp run` writeback semantics still have a separate release-engineering defect; release identity itself was independently verified and read back.

**Verified**  
REL-PROV-01 closed with exact deployment identity in live Worker State.

---

## Unreleased — AI Systems Lab operating baseline

**User-visible runtime change:** None from documentation alone.

The branch prepares stronger product governance, observability/evaluation contracts, release provenance, memory boundaries and privacy checks. Documentation/governance work must not be described as a runtime release until production-changing parts are explicitly deployed and verified.

Runtime tracing, fresh-source end-to-end confidence, immutable revision/submission provenance and employer-outcome learning remain acceptance work rather than completed capabilities unless separately marked Released / proven above.

---

## Release-note decision template

For every material iteration, explicitly decide `required / not required`.

When required:

### [release/date] — [short user-facing title]

**Status:** Released / proven | Released / limited | Pending proof | Blocked

**What changed**  
...

**What this means for you**  
...

**Important limitation / action required**  
...

**Verified**  
State only what has actually been verified in the target environment.
