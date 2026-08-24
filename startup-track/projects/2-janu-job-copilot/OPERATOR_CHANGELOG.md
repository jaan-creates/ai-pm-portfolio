# Janu Job Copilot — Operator Changelog

**Purpose:** privacy-safe, turn-level record of material builder/operator work. Exact private application details remain in the Live Tracker; this file records IDs, controls, commits and verification state so Git history can be followed without leaking candidate data.

## 2026-08-24 — Resume approval path + predictive learning retrieval + user release notes

**Findings:** current learning architecture captured failures and executable prevention well, but retrieval of prior learning before a new change was not mandatory. This allowed learned local fixes to miss adjacent enforcement/publisher risks. User-facing release notes also had no durable canonical file.

**Changes authored on `janu-job-copilot/apps-script-ci`:**

- `PRECHANGE_RISK_GATE.md`
  - requires relevant prior Failure Learning / executable memory retrieval before material runtime changes,
  - requires exact escaped fixture retrieval,
  - requires sibling-risk prediction across scheduler/queue/publisher/release/artifact/trace/human-action boundaries,
  - requires executable enforcement point + rollout containment + unlock/rollback criteria.
- `ITERATION_EVIDENCE_GATE.md`
  - now makes pre-change risk retrieval a formal gate,
  - requires predicted sibling risks in closeout evidence,
  - points user-facing change decisions to `USER_RELEASE_NOTES.md`.
- `USER_RELEASE_NOTES.md`
  - canonical user-facing release-note surface,
  - separates proven, limited, pending-proof and blocked behavior,
  - documents Resume Review `Approved` semantics and current pending renderer/TRACE/continuation controls.
- Live `My Actions`
  - wording updated so zero-comment / all-comments-resolved review has an explicit `Approved` path without editing the generated artifact.

**Verification state:** documentation/governance changes are committed. Runtime renderer/TRACE/continuation controls still require target-environment deployment/readback and canary evidence; live runtime remained TRACE V0-1 / continuation v2 at the latest readback.

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

## Logging rule going forward

For every material execution turn:

1. private Live Tracker receives exact Audit / Failure Learning / Verification / Trace evidence where applicable;
2. Git receives executable prevention/tests and a privacy-safe changelog entry for material engineering changes;
3. the changelog references stable defect/test/change IDs and commits, not private candidate/application content;
4. a change remains open until target-environment readback satisfies `ITERATION_EVIDENCE_GATE.md`;
5. every material production change retrieves relevant prior learning and predicts sibling risks through `PRECHANGE_RISK_GATE.md` before promotion;
6. meaningful user-visible changes are recorded in `USER_RELEASE_NOTES.md` with an honest proof status.
