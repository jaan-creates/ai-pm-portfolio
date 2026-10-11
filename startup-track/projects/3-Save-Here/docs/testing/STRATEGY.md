# Save Here test and evaluation strategy

This project uses three layers of confidence. The first two run automatically on every pull request; the third is a short real-device check for changes that affect capture or mobile behavior.

## 1. Fast automated checks

Run from the repository root:

```text
pnpm check
pnpm eval:recall
```

`pnpm check` protects public-repository safety, lint, types, unit tests, and the production build. `pnpm eval:recall` runs a deterministic offline recall evaluation against `fixtures/recall`. It never calls Supabase, OpenAI, Instagram, X, or a paid provider.

The recall gate is intentionally simple at this stage: every query names the item it should find and an acceptable maximum rank. A failed query is a product regression, not merely a test failure. Add a fixture when a real miss is discovered, then improve the search implementation until the baseline passes again.

For machine-readable output:

```text
pnpm eval:recall -- --json
```

## 2. Regression corpus

`fixtures/recall/items.json` is a small, anonymised library. It must represent the memories a person will actually use: object, purpose, source, visual idea, creator, and approximate time. `queries.json` pairs each memory with a natural-language recall query.

When adding a case:

1. Add one synthetic item with no private URL, email, token, or personal media.
2. Add at least one query that does not repeat the title exactly.
3. Set `acceptable_rank` to 5 unless the scenario specifically tests another surface.
4. Record the memory axes (`topic`, `intent`, `source`, `visual`, `time`, or `creator`).
5. Run the evaluator and `pnpm check` before opening a pull request.

The corpus is a living product contract. A change that improves one query but breaks another must be treated as a regression unless the expected behavior is deliberately changed and documented.

## 3. Manual iPhone smoke test

Run this after any change to the Shortcut, auth, capture endpoint, card layout, or mobile CSS:

1. Open a harmless public web page on the iPhone.
2. Share it to **Save Here** and leave the optional context blank.
3. Share a second page and enter `test context — verify recall` in the optional context prompt.
4. Open `https://save-here.vercel.app`, sign in, and confirm only the owner’s items appear.
5. Confirm the new card appears without a manual refresh, has a useful title/preview when available, and retains the context separately from extracted metadata.
6. Tap the card body and confirm it opens the original source. Use the lifecycle action only when intentionally marking the item done/reference.
7. Search using a loose phrase rather than the exact title.
8. Sign out, sign back in, and confirm the library is still private and intact.

Record the date, device/browser, source type, result, and one screenshot only when a failure needs explanation. Do not put private links, screenshots, or auth emails in Git.

## Release gates

- Capture changes: no silent loss in 10 consecutive Shortcut shares; API response remains fast even when enrichment is unavailable.
- Recall changes: offline corpus is 100% passing, or an intentional baseline change is documented in an ADR.
- Enrichment changes: every generated title/tag/description has visible provenance and a safe fallback.
- Auth/RLS changes: unauthenticated access is denied, a second user cannot read the owner’s items, and sign-out removes access.
- UI changes: the three most recent cards are recognisable on a phone without reading raw URLs or internal status labels.

## Failure triage

Classify each failure before fixing it:

- **Capture:** the item never arrived or was duplicated.
- **Understanding:** the item arrived but metadata/preview/tags are wrong or missing.
- **Recall:** the item exists but a natural query ranks it too low.
- **Trust/privacy:** the wrong account can see it, provenance is missing, or a secret/private fixture escaped.
- **Experience:** the result is technically correct but hard to recognise or act on.

Every resolved failure should become either a regression fixture, a unit test, a manual smoke step, or a Jira issue with a clear owner and acceptance criteria.
