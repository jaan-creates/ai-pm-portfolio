# ADR 0001: Mobile web and durable capture foundation

- Status: Accepted
- Date: 2026-09-01
- Jira: SH-1

## Context

The owner needs near-zero-friction iPhone capture, durable personal ownership, fuzzy retrieval, and very low maintenance. Instagram frequently denies unauthenticated content access.

## Decision

Use a Next.js PWA and iPhone Shortcuts over a Supabase core. Store each capture before asynchronous extraction. Use user-provided screenshots or recordings when Instagram public metadata is insufficient. Never use Instagram credentials, cookies, or unofficial private APIs.

## Consequences

Capture remains reliable when AI and source providers fail. Restricted Instagram items sometimes remain link-only until evidence is attached. A native Share Extension is deferred until Shortcut telemetry demonstrates a need.

## Revisit when

The first 50 real saves show repeated Shortcut failure, unacceptable upload friction, or strong demand for native notifications.
