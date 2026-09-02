# Save & Recall

A mobile-first personal system for saving content from anywhere and finding it later by approximate memory or intent. The source is published in the owner's portfolio repository; saved content, credentials, and production data remain private.

## Current milestone

The repository implements the Iteration 0 foundation and the first durable-capture vertical slice:

- Next.js mobile-first PWA shell.
- Shared validated domain types.
- Supabase schema, RLS policies, capture-token model, and idempotent capture function.
- Versioned `POST /v1/captures` endpoint for URL and text capture.
- Synthetic English-first recall fixtures.
- CI, tests, architectural decisions, Jira import backlog, and weekly status templates.

AI enrichment, Instagram extraction, file uploads, and paid providers remain disabled until durable capture passes its gate.

## Prerequisites

- Node.js 24.
- pnpm 11.19.0.
- Docker Desktop for local Supabase.
- A free Supabase project or the Supabase CLI for local development.

## Setup

1. Copy `.env.example` to `apps/web/.env.local` and fill only the Supabase values plus a locally generated `CAPTURE_TOKEN_PEPPER`.
2. Install dependencies with `pnpm install --frozen-lockfile`.
3. Start local Supabase with `pnpm dlx supabase start`.
4. Apply migrations with `pnpm dlx supabase db reset`.
5. Create one owner in Supabase Auth and generate a capture token using the SQL recipe in `docs/operations.md`.
6. Start the app with `pnpm dev`.

No Instagram password, cookie, browser session, or private API belongs in configuration.

## Quality checks

```bash
pnpm check
```

The full approved product and architecture baseline is in [BUILD_PLAN.md](BUILD_PLAN.md).
