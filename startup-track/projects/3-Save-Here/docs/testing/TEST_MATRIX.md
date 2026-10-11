# Save Here test matrix

This matrix is the release checklist for the personal pilot. It is intentionally separated from implementation tasks so a feature cannot declare itself complete without evidence.

| Area | Automated suite | Manual verification | Release gate |
| --- | --- | --- | --- |
| Capture | Domain/Vitest tests, recall evaluator | 10 iPhone Share Sheet captures | No silent loss; duplicate is idempotent |
| Metadata | Link-enrichment tests, provider fixtures | Public article, YouTube, Instagram URL | Provenance shown; no invented caption/audio |
| Evidence | Evidence policy evaluator, upload route tests | Screenshot upload from iPhone | Private path; owner-only access; SHA-256 recorded |
| Recall | Offline recall evaluator, search contract tests | Five loose searches | Expected item in top five |
| Lifecycle | Route/unit tests | Done, Reference, Remove, Restore | State persists after sign-in cycle |
| Privacy | Public-safety scan, RLS checks | Sign out and second-session check | No cross-owner visibility |
| Resurfacing | Review ranking tests | Weekly review completion | Under ten minutes |
| Export | Export schema/restore tests | Export then import into clean project | Restore is lossless or reports omissions |

## How to run the offline suites

From the project folder:

    pnpm eval:recall
    pnpm eval:evidence
    pnpm test
    pnpm check

The evaluators never call Supabase, OpenAI, Instagram, X, or any paid provider. Test fixtures must stay synthetic and must never contain private URLs, emails, tokens, screenshots, or recordings.

## Triage rule

A failure is not complete when the code is patched. It is complete when the behavior is protected by one of:

- a unit test,
- a deterministic evaluator case,
- a manual smoke step,
- or an explicit accepted limitation in an ADR.
