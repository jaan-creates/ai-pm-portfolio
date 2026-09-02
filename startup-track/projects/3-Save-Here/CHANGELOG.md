# Changelog

All notable user-visible changes are recorded here.

## [Unreleased]

### Added

- Mobile-first Save & Recall library shell.
- Versioned URL/text capture contract.
- Durable Supabase data model with RLS and idempotent capture.
- Project governance, decision records, Jira backlog, and CI foundation.

### Changed

- Capture-token provider outages now return a retryable `503` response while invalid, expired, revoked, or wrong-device credentials remain `401`.
