# P1-A Controlled Release

Target baseline: live `1.3.8 / p0-regression-v19`.

This release adds retrieval/intake contracts only. It must preserve the full P0 release validator and must not run the unverified v20 migration patch.

Evidence gate: CI validation -> clasp push -> live P1-A self-test -> P0 non-regression -> limited intake/vacancy acceptance.

Deployment trigger checkpoint: `2026-08-20T11:31+05:30` — main workflow configured for the controlled P1-A release.
