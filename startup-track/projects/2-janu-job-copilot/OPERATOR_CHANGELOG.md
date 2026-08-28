# Janu Job Copilot — Operator Changelog

**Purpose:** privacy-safe, turn-level record of material builder/operator work. Exact private application details remain in the Live Tracker; this file records IDs, controls, commits and verification state so Git history can be followed without leaking candidate data.

## 2026-08-24 — Resume approval path + predictive learning retrieval + release-note source-of-truth correction

**Findings:** current learning architecture captured failures and executable prevention well, but retrieval of prior learning before a new change was not mandatory. This allowed learned local fixes to miss adjacent enforcement/publisher risks. During the review, a duplicate user-release-note surface was briefly created despite an existing canonical `RELEASE_NOTES.md`; the duplicate was removed immediately and the canonical file updated.

**Changes authored on `janu-job-copilot/apps-script-ci`:**

- `PRECHANGE_RISK_GATE.md`
  - requires relevant prior Failure Learning / executable memory retrieval before material runtime changes,
  - requires exact escaped fixture retrieval,
  - requires sibling-risk prediction across scheduler/queue/publisher/release/artifact/trace/human-action boundaries,
  - requires executable enforcement point + rollout containment + unlock/rollback criteria.
- `ITERATION_EVIDENCE_GATE.md`
  - now makes pre-change risk retrieval a formal gate,
  - requires predicted sibling risks in closeout evidence,
  - points user-facing change decisions to canonical `RELEASE_NOTES.md`.
- `RELEASE_NOTES.md`
  - remains the single canonical user-facing release-note surface,
  - separates proven, limited, pending-proof and blocked behavior,
  - documents Resume Review `Approved` semantics and current pending renderer/TRACE/continuation controls.
- `USER_RELEASE_NOTES.md`
  - briefly created during the review, then deleted after source-of-truth reconciliation discovered the existing canonical release-note file.
- Live `My Actions`
  - wording updated so zero-comment / all-comments-resolved review has an explicit `Approved` path without editing the generated artifact.
- Controlled deployment trigger `5e784aafb29cb1e25e640fc831d14c15841724b6`
  - uses the new pre-change risk gate and keeps renderer backlog quarantined until exact deployment/readback + one Metaforms canary pass.

**Verification state:** documentation/governance changes are committed. Runtime renderer/TRACE/continuation controls still require target-environment deployment/readback and canary evidence; live runtime remained TRACE V0-1 / continuation v2 at the immediate post-trigger readback.

## 2026-08-24 — Renderer recurrence containment + observability closure

**Finding IDs:** FL-057 through FL-069, with primary prevention family FL-060 / FL-063 / FL-064–069 and TRACE durability FL-059.

**Changes authored on `janu-job-copilot/apps-script-ci`:**

- `scripts/patch-renderer-careerbreak.mjs`
  - structural Career Break rendering (`RENDER-CAREERBREAK-V2`),
  - exact escaped-fixture self-test (`RENDER-CAREERBREAK-001`),
  - same-policy deterministic replay prevention (`PREVENTION-RECURRENCE-001`),
  - enqueue/claim quarantine (`RENDER-QUARANTINE-001`),
  - release-blocker health precedence (`REGRESSION-HEALTH-CYCLE-LOCK-001`).
- `scripts/test-renderer-careerbreak.mjs`
  - production-shaped Career Break regression,
  - transformed-artifact syntax verification,
  - quarantine and health-publisher assertions.
- `scripts/patch-trace-durability.mjs`
  - append → readback → retire publication rather than destructive clear-first refresh,
  - stale golden-fixture Application-ID lock reset when canonical URL does not match the requested fixture.
- `scripts/patch-trace-golden-v0-runtime.mjs`
  - production transform now chains continuation v3, renderer recurrence controls and trace durability before final exact-artifact syntax validation.
- `OBSERVABILITY_INDEX.md`
  - one map from Git contracts/tests to private production evidence surfaces.

**Key commits:**

- `1e1447dd6c860de65c0da3eee812a5683789f91b` — executable renderer quarantine + health precedence.
- `312e53b2faf80effb32bd295ccfb62cc828410ff` — strengthened renderer recurrence regression.
- `f4b32a0bad917e17856ef17668a621e12ae5ab2f` — TRACE durability + stale lock repair.
- `8540947c2406eedb8a26c12f101d6db255a398b1` — chain TRACE durability into controlled production transform.
- `52715376df5370488ee2020ee206a8ed514972ac` — observability index.

**Verification state at authoring:** source controls are committed; target-environment deployment provenance, renderer canary and consecutive health-cycle proof remain required before the recurrence family can close. Source-level completion must not be reported as production PASS.

## 2026-08-28 — FL-082 canary execution / Worker Runtime circuit-state divergence

**Finding ID:** FL-082 (`WORKER-CIRCUIT-CONSISTENCY-001`, `CANARY-EXACTJOB-001`, `CANARY-SEMANTIC-RESULT-001`).

**Production evidence:**

- Exact deployment readback remained PASS for deployed commit `fc29e6cb9d5000d86c17ec0fbd476a98227e6e03` and source hash `70440eb60cfaea86c38fe2222cd3d2602d4588698dc6a880f9ae5f01ddb6ca67`.
- TRACE golden evidence remained `TRACE-GOLDEN-V0-2` with `ATOMIC_APPEND_VERIFY_RETIRE`; the stale Easyship fixture lock had already converged to the unique Tekion application identity.
- Renderer production self-test remained PASS under the superseding `RENDER-CAREERBREAK-V3` contract, and renderer recurrence/replay gates remained fail-closed pending the single Metaforms canary.
- Controlled trigger commit `41820ade9fd79406f6471b674758cf8707142765` invoked only the already-existing Metaforms canary queue item; no second queue job/version was created.
- GitHub Actions run `33143515615` completed at the transport/workflow layer, but production `phase1OneJobTick` returned `CIRCUIT_OPEN` in 34 ms with `jobsProcessed=0`.
- The authorized canary queue row remained `queued`, `attempts=0`; therefore no renderer artifact was produced and no artifact-fidelity PASS is claimed.
- Live `__System Health` still published Worker Runtime as `HEALTHY/CLOSED`, creating a mismatch with the enforcing worker circuit consulted by `phase1OneJobTick`.

**Containment / evidence updates:**

- Recorded FL-082 in live `__Failure Learning` as an Open / Release Blocker.
- Added FAIL evidence to `__Verification Ledger`, `__Regression Results`, and `Audit Log`.
- Kept `renderer_recurrence_gate=SELF_TEST_PASS_CANARY_PENDING` and `renderer_replay_gate` blocked; normal `RESUME_GENERATE`, renderer backlog fan-out, and continuation recovery were not authorized.
- No `My Actions` row was created because the failure is system-owned and requires no human authority.
- The canary must not be retriggered until the enforcing Worker Runtime circuit is cleared through a controlled recovery and read back from the same enforcement primitive. A green GitHub workflow with zero intended jobs is not canary success.

**Release-note decision:** no canonical user-facing release-note change was made because no user-visible renderer capability was released or proven in this turn.

## Logging rule going forward

For every material execution turn:

1. private Live Tracker receives exact Audit / Failure Learning / Verification / Trace evidence where applicable;
2. Git receives executable prevention/tests and a privacy-safe changelog entry for material engineering changes;
3. the changelog references stable defect/test/change IDs and commits, not private candidate/application content;
4. a change remains open until target-environment readback satisfies `ITERATION_EVIDENCE_GATE.md`;
5. every material production change retrieves relevant prior learning and predicts sibling risks through `PRECHANGE_RISK_GATE.md` before promotion;
6. meaningful user-visible changes are recorded in canonical `RELEASE_NOTES.md` with an honest proof status.
