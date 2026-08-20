# Janu Job Copilot — Live Tracker End-to-End Acceptance

Status: active execution plan
Master spec: 0.21.0 / CS-20260820-028

## Immediate product priority
The current live Google Sheet tracker is the primary acceptance environment. The product is not ready to shift execution focus to a portal until the live tracker can automate and prove the main job-search journey from source capture through submission and post-submission tracking.

Portal work remains a downstream migration concern. It must inherit behavior proven here rather than define behavior first.

## Golden path to prove in production
1. Source captured in `Sources Inbox`.
2. Source canonicalized/resolved.
3. Duplicate/idempotency decision made.
4. Source promoted to `Applications` exactly once.
5. Vacancy/JD retrieved from strongest available evidence source.
6. Deterministic ATS/JobPosting parse runs before LLM fallback where sufficient.
7. Canonical JD snapshot/evidence artifact persists with provenance/hash.
8. JD fit scoring + evidence map completes.
9. Decision resolves to Apply / Hold / Skip using allowed state transitions.
10. Company enrichment completes or is explicitly non-blocking.
11. Contact enrichment runs only where useful and uses public evidence.
12. Tailored resume is generated from canonical evidence.
13. Resume sanitization/rendering completes.
14. Deterministic + model QA complete under current policy.
15. `Resume Review` exposes the exact immutable version.
16. User selects Approved / Revision Needed / Withdraw.
17. Revision Needed creates V2/V3; it never overwrites the prior version.
18. Approved + QA pass + current vacancy evidence moves the application to Ready to Submit.
19. Vacancy is revalidated if older than the submission freshness policy.
20. Authenticated external application is completed by the user where automation cannot legally/technically submit.
21. Tracker records `Submitted`, `Applied Date`, exact immutable `Resume Version ID`, canonical apply URL and relevant audit evidence only after real submission.
22. Outreach/follow-up timers and contact actions operate.
23. Gmail outcome monitor classifies and matches acknowledgment, recruiter reply, assessment, interview/scheduling, rejection, offer/comp or unrelated mail.
24. Interview/outcome state updates remain deterministic/fail-closed when matching is ambiguous.

## Acceptance contract for every stage
A stage is PASS only when all applicable checks are true:
- allowed state transition only;
- expected tracker cells/artifacts persisted and read back;
- no write to unrelated state fields;
- rerun is idempotent and does not duplicate jobs/artifacts/actions;
- queue job and worker-attempt telemetry are consistent;
- paid operations are budget-gated and cost-attributed;
- failure produces the correct retry/dead-letter/user-blocker behavior;
- no stale system-owned blocker remains in `My Actions`;
- Audit/Failure Learning captures new systemic defects;
- existing P0 regression/preflight remains green.

## Live fixture strategy
### Golden-path fixture
Use one real application that can travel through as much of the journey as possible. Current first fixture: `2026-08-04-002` Metaforms because the official Ashby page is already retrievable and currently exposes a false JD-PDF user blocker. After automatic JD recovery is proven, continue the same record through scoring, enrichment, tailoring, QA and review rather than stopping at a local worker test.

### Secondary official ATS fixture
`2026-08-06-003` Hinge Health validates the same recovery path against another Ashby page and an application that already has prior resume/pack artifacts.

### Existing downstream fixture
`2026-08-06-002` Motive is currently at `Resume Review` with QA passed and a specific resume version. Use it to prove approval/revision -> Ready to Submit -> pre-submit vacancy freshness -> actual human submission boundary -> immutable Submitted writeback.

### Negative-path fixtures
Maintain bounded fixtures for:
- duplicate source -> no duplicate application;
- closed vacancy -> stop expensive downstream work;
- unavailable/insufficient JD -> smallest genuine user blocker only after automated retrieval options are exhausted;
- provider error/quota failure -> classified retry/fail-closed behavior;
- resume revision -> new immutable version;
- ambiguous Gmail outcome -> no silent application update;
- stale queue lease / obsolete replay -> safe GC/DLQ behavior.

## Current observed live state
As of 2026-08-20:
- P1-A/P1-B/P1-C helper/runtime self-tests are live PASS.
- Bounded vacancy worker is live PASS (`P1-A-VACANCY-1`).
- Metaforms `2026-08-04-002` has a real `DIRECT_OFFICIAL` vacancy retrieval hash/source writeback but still carries `full_jd_unavailable` and a stale user instruction to upload a PDF. This is the first false blocker to remove through real worker integration.
- Historical queue evidence proves the system has separately executed JD retrieval, JD parse/score, company enrichment, contact enrichment, resume generation and QA, but these have not yet been re-proven as one clean current-release golden path.
- No current application in the visible live set is yet an accepted end-to-end `Submitted` golden-path fixture. Do not fabricate submission state.

## Execution order
### E2E-1 — JD recovery and blocker removal
Wire RetrievalProvider into actual `workerJD_` / intake handling. On Metaforms, automatically recover sufficient JD evidence, persist canonical snapshot/provenance, clear the false `full_jd_unavailable` blocker only after artifact readback, enqueue the next legitimate stage, and verify no manual PDF is needed.

### E2E-2 — Downstream automatic continuation
Drive the same fixture through parse/score/evidence map, Apply decision handling, enrichment, resume generation, QA and Resume Review. Fix defects encountered in the journey rather than skipping ahead to isolated self-tests.

### E2E-3 — Review/revision/approval state machine
Use Motive plus a revision-needed test to prove immutable V2/V3 behavior, approval state, My Actions hygiene and Ready-to-Submit transition.

### E2E-4 — Submission boundary
Revalidate vacancy, expose the exact final artifact, require the human only for the external authenticated submission action, then record Submitted/Applied Date/exact Resume Version ID after real confirmation/evidence.

### E2E-5 — Post-submission automation
Verify outreach, follow-up, Gmail outcome classification/matching, interview-room creation/updates and final outcome states.

### E2E-6 — Failure and idempotency suite
Repeat duplicate, closed, stale, provider-error, ambiguous-email and replay/GC cases. Convert every new systemic failure into `__Failure Learning` plus a regression guard.

## Release gate
P1 release candidate may be declared only after:
- one live source-to-Ready-to-Submit golden path is clean;
- one real submission has exact immutable artifact writeback;
- post-submission monitor path is exercised;
- key negative/idempotency paths pass;
- P0 remains green;
- Failure Learning and Master Spec are synchronized.

Only then should the live product become the semantic parity baseline for the future portal.
