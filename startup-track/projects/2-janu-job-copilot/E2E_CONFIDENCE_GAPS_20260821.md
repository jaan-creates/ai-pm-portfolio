# Janu Job Copilot — End-to-End Confidence Gap Register

Date: 2026-08-21
Master spec: 0.23.0 / CS-20260821-029

## Live checkpoint
E2E-1 is accepted on Metaforms (`2026-08-04-002`): official Ashby retrieval produced a 95% complete Verified Full JD, vacancy evidence is OPEN with ASHBY_PUBLIC_API provenance, the false JD-PDF blocker was cleared from Applications and My Actions, and `JD_PARSE_SCORE_MAP` was queued. The scoring job is currently running under the existing bounded worker.

## Gaps added before end-to-end confidence can be declared
1. A clean golden path must begin from a fresh `Sources Inbox` URL, not from an already-created Application row.
2. URL-first source intake must retrieve/canonicalize/dedupe/promote when public official evidence exists; PDF is fallback, not default.
3. Source promotion must not hard-code `Decision=Apply` before fit/decision policy is evaluated.
4. Verified `Vacancy Status=CLOSED` must immediately stop the application lifecycle and obsolete queued downstream work. FL-042 was opened after live HackerRank evidence showed CLOSED while the application still remained in Tailoring.
5. Ready-to-Submit must require vacancy OPEN with <=24h freshness, not merely a canonical URL.
6. Submitted writeback must occur only after explicit real-submission confirmation and must freeze exactly the resume version actually used.
7. `Revision Needed` must invoke a real Google Doc comment-driven revision worker that creates V2/V3; helper contracts alone are insufficient.
8. Gmail outcome classification/matching must run as an actual monitor, with ambiguous matches fail-closed.
9. Outreach/follow-up and Interview Rooms must be live-exercised after a real submission.
10. Idempotency must be demonstrated by rerunning the fresh source journey without duplicate Application, JD, resume, action, or queue artifacts.

## Execution order
- Finish Metaforms current-release continuation: score/evidence map -> enrichment -> resume -> QA -> Resume Review.
- In parallel, fix FL-042 vacancy lifecycle propagation before allowing expensive work to continue on a verified-closed vacancy.
- Add URL-first `Sources Inbox` intake and then insert one actually relevant fresh role as the clean-room golden fixture.
- Drive that fresh fixture through the same downstream path to Ready to Submit.
- Use the real human submission boundary only when the application is genuinely ready; then verify Submitted/Applied Date/exact immutable Resume Version ID.
- Exercise post-submission email/outreach/interview flows and negative/idempotency cases.

## User-boundary rule
No user action is requested for system-owned defects, retrieval, scoring, enrichment, tailoring, QA, queue repair, or tracker reconciliation. User action is expected only for genuine judgment/review and authenticated external submission boundaries.
