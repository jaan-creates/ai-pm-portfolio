# Janu Job Copilot — Release Notes

User-facing release notes for meaningful usable behavior, reliability or limitation changes.

This is deliberately different from `BUILD_NOTES.md`:
- **Release Notes:** what changed for the user.
- **Build Notes:** why/how we built it, evidence, tradeoffs, learning and next opportunities.

Do not add a release note for every commit or internal refactor.

---

## Unreleased — AI Systems Lab operating baseline

**User-visible runtime change:** None yet.

The current branch prepares stronger product governance, observability/evaluation contracts, release provenance and privacy checks. It is intentionally not described as a runtime release until the production-changing parts are explicitly approved, deployed and verified.

If promoted, the user-relevant reliability changes include:
- documentation/governance-only changes no longer causing an Apps Script production deployment,
- stronger evidence linking a deployment to its exact transformed source hash,
- clearer monitoring/learning/release evidence for future Job Copilot improvements.

Runtime tracing and fresh-source end-to-end confidence are still follow-up implementation/acceptance work, not completed capabilities in this note.

---

## Release-note decision template

For every material iteration, explicitly decide `required / not required`.

When required:

### [release/date] — [short user-facing title]

**What changed**  
...

**What this means for you**  
...

**Important limitation / action required**  
...

**Verified**  
State only what has actually been verified in the target environment.