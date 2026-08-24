# Janu Job Copilot — User Release Notes

**Purpose:** user-facing record of meaningful capability, workflow, reliability and limitation changes. Internal refactors belong in `OPERATOR_CHANGELOG.md`; exact private application incidents remain in the Live Tracker.

## Status labels

- **Released / proven:** behavior is verified in the target environment.
- **Released / limited:** usable behavior is live with an explicit limitation.
- **Pending proof:** code or configuration exists, but target-environment verification is incomplete.
- **Rolled back / blocked:** behavior must not be relied on.

## 2026-08-24

### Resume Review actions — Released / proven
- Genuine Resume Review boundaries are surfaced in `My Actions`.
- Current approval choices are **Approved**, **Revision Needed**, or **Withdraw**.
- If the resume needs no changes and all comments are resolved, choose **Approved** on the application’s `Resume Review Decision`. Approval means: accept the exact active resume version and let the system continue freshness, QA and readiness checks toward `Ready to Submit`.
- Do not directly edit the generated resume body when requesting a revision; use anchored comments so an immutable successor version can be created.

### Renderer recurrence protection — Pending proof
- A production-shaped regression for Career Break / Independent Building content has been added.
- Structural rendering, same-policy deterministic replay prevention, and a single-canary-before-backlog policy have been authored.
- This is **not yet released/proven** until the target Apps Script runtime reports the new renderer contract, exact deployment provenance, and a live canary succeeds.

### Golden trace durability — Pending proof
- TRACE-GOLDEN V0-2 includes exact URL identity checks so the Tekion trace cannot silently bind to another job.
- Trace publication has been changed to append/readback/retire so a failed refresh should preserve the last-known-good trace.
- This remains pending target-environment proof.

### Continuation recovery — Pending proof
- Continuation v3 is designed to prevent an early terminal row from starving later applications and to use the latest queue attempt as current truth.
- This remains pending live runtime readback and stalled-application recovery evidence.

### Reliability status — Released / limitation visible
- Regression Gate is intentionally fail-closed while unresolved renderer/release blockers remain. A generic regression PASS must not be treated as permission to replay affected resume work.

## 2026-08-23

### Release provenance — Released / proven
- The exact deployed Git execution commit and transformed source SHA-256 are now stored in connected product state and used as release evidence.

### My Actions reconciliation — Released / proven with executable-regression follow-up
- A missing Resume Review action was repaired so genuine user-owned boundaries are visible instead of being hidden by system-owned processing state.

## Release-note rule

Add an entry only when the user gains, loses or changes a meaningful behavior, reliability guarantee, limitation or workflow. Never label source code or a passing unit test as released product behavior without target-environment proof.
