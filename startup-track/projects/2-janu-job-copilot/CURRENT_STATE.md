# Janu Job Copilot — Current State

**Status:** Verified snapshot; update when material runtime truth changes  
**Last verified:** 2026-08-24 00:35 IST  
**Evidence window:** repository `main`, private live tracker, live System Health/Failure Learning/Verification Ledger, Master Product & Engineering Specification 0.24.0

## Public/private evidence boundary

This repository is public. This file therefore records only privacy-safe product architecture/capability conclusions. Exact private application rows, candidate/mailbox content, detailed traces and user-specific operating data stay in authorized private product surfaces.

## 1. Current executable/control-plane state

- Product repository: `jaan-creates/ai-pm-portfolio`.
- Product path: `startup-track/projects/2-janu-job-copilot/`.
- Production deployment workflow: `.github/workflows/janu-job-copilot.yml`.
- Embedded runtime identity remains `1.3.8 / p0-regression-v19` before additive patching.
- Production is still built by pulling the current Apps Script source into an ephemeral workspace, applying repository patchers, validating the transformed source, then pushing it with `clasp`.
- Privacy-safe deployment source hashing and connected release-provenance writeback have been implemented and proved for a controlled production release. However release verification is still **partial** because the workflow must also fail on semantic CLI/execution errors, not only process exit status; see `FL-049`.
- A private canonical full-source/version store remains unresolved. `DEPLOY-SOURCE-01` tracks moving toward a reproducible complete runtime artifact before patch-chain complexity grows much further.

### Source/live drift

Repository `main` currently contains newer TRACE-GOLDEN-01 V0-2 and continuation-v3 repair source than the connected live Worker State has proved. Live state still reports continuation contract V2 and the golden trace remains blocked. Therefore **source PASS is not production truth** until deployment identity and environment behavior are read back.

## 2. Live system-health conclusion

At the latest private read, Worker Runtime is **DEGRADED** while sourcing, OpenAI, Drive/Docs, regression-gate and budget components report healthy. The degradation is caused by a deterministic resume-render integrity failure that recurred after earlier prevention work (`FL-045`).

This is an important distinction: component/self-test health does not prove that the user journey is healthy. Journey liveness, recurrence and invariant violations must be monitored separately.

## 3. TRACE-GOLDEN-01 status

TRACE-GOLDEN-01 has moved beyond preparation into a **live pilot, not yet accepted**.

What exists:
- a visible private `Trace Explorer`,
- private `__Golden Trace` and `__Verification Ledger` evidence surfaces,
- a locked same-fixture fresh-source request,
- release-bound trace metadata and preserved human note/eval columns,
- source repairs for canonical URL dedupe, Application-ID collision checks, transformed-artifact verification and version-aware trace upgrades.

What is not yet proven:
- one fresh fixture reaching Resume Review,
- live V0-2 identity/dedupe repair,
- live continuation-v3 fairness/latest-event repair,
- idempotent end-to-end rerun,
- complete runtime trace-context propagation through queue -> worker -> model/tool -> persistence/verifier.

### Trace accuracy caveat

The current Trace Explorer is mainly a **human-readable reconstruction/projection** from existing Applications, Processing Queue and Cost Ledger state. That is useful observability, but it is not yet a full causal distributed trace. Runtime operations still need a stable trace/group identity propagated through asynchronous enqueue/worker/model/tool/persistence boundaries, with real parent/child or causal links.

## 4. Demonstrated capabilities

Verified examples still include:
- durable queued workers with retry/error evidence,
- scheduled sourcing and sourcing telemetry,
- official vacancy/JD retrieval and provenance for supported sources,
- persisted JD snapshots/completeness gates,
- evidence-grounded requirement mapping/scoring,
- company/contact enrichment paths,
- resume/application-pack generation attempts,
- deterministic and model-assisted QA controls,
- human Resume Review boundary,
- cost/audit/health/failure-learning telemetry,
- privacy-safe release hashing and at least one connected release-provenance readback,
- a human-readable trace reconstruction surface.

These are component capabilities, not proof of a healthy full journey.

## 5. Current known gaps

### High-priority defects and prevention status

Private Failure Learning / Verification Ledger currently show these material open items:

- `FL-045` — deterministic renderer bullet loss **recurred live**; previous prevention is ineffective and must be reopened/fixed before broad resume replay.
- `FL-049` — CLI/process success was once mistaken for semantic release-write success; automatic semantic-output plus durable-readback gating remains incomplete.
- `FL-050` — the user-action projection can drift from canonical human-boundary state; executable exactly-one/zero reconciliation tests remain pending.
- `FL-051` — golden-path dedupe/identity produced a false duplicate and exposed an internal Application-ID collision; source repair exists, live proof remains pending.
- `FL-052` — a verifier inspected a stale pre-repair artifact; source prevention now verifies the exact transformed artifact, but production promotion evidence is still required.
- `FL-053` — patch idempotency failed across version/partial-install states; version-aware convergence source repair exists, live proof remains pending.
- `FL-055` — an early terminal row could starve later actionable applications in a recurring continuation scan; v3 source repair exists, live runtime still reports v2.
- `FL-056` — historical queue success could mask a newer failure; latest-meaningful-event semantics are specified in v3 but not yet proven live.

The product must distinguish prevention lifecycle states such as **proposed -> source verified -> deployed -> environment verified -> monitoring -> effective / ineffective**. A recurrence automatically demotes/reopens a prevention claim.

### Current product-state gaps

- The private tracker contains legitimate non-terminal applications with system-owned work that is currently stalled or failed; user intervention is not the right repair for these cases.
- The tracker currently contains an internal Application-ID uniqueness violation in historical/current state. Canonical business identity and internal row/object identity need explicit, concurrency-safe rules before the golden fixture can rely on Application ID as its sole grouping key.
- The human-action surface currently contains a genuine Resume Review action, but the projection invariant still needs executable reconciliation coverage.
- One complete current-release fresh source -> Resume Review -> Ready -> real submission -> employer outcome journey has not yet been accepted.

### Architecture/deployment gap

The pull-live -> apply-many-patches -> push model is now producing measurable complexity: version convergence, partial installs, source/live drift and transformed-artifact verification defects. This is becoming a builder/deployment bottleneck. `DEPLOY-SOURCE-01` tracks a bounded move toward a private canonical full runtime source/reproducible release artifact; this is not a portal rewrite.

## 6. Do not infer as current truth

Do not infer that:
- source or CI PASS means the change is deployed,
- a process exit code proves the intended external side effect,
- a verifier is valid unless it checked the exact artifact being promoted,
- a self-test proves production-shaped behavior,
- an old success in an append-only queue is the current worker state,
- a visible Trace Explorer means trace context is propagated causally through runtime,
- a logged failure means the prevention is effective,
- a healthy component means the journey is live,
- a display `Status` is sufficient evidence when artifacts/queue state disagree,
- a Markdown governance rule is enforced merely because it is documented,
- Ready to Submit means actually submitted,
- portal/agent/memory complexity is justified before the present value loop is stable.

## 7. Current priority

Do **not** broaden P1 feature work yet. Stabilize the P0/TRACE path in this order:

1. deploy and independently verify one source revision containing TRACE V0-2 + continuation v3;
2. repair/migrate the internal Application-ID collision and validate cross-sheet references;
3. fix the recurrent renderer loss and prove the prevention on held-out + live evidence;
4. prove continuation fairness/latest-event semantics and recover eligible stalled work without user relay;
5. propagate native trace context through queue/worker/model/tool/persistence while retaining Trace Explorer as the human-readable view;
6. make My Actions reconciliation executable;
7. resume the locked fresh fixture and require Intake -> JD -> Score/Decision -> Tailor -> QA -> Resume Review plus idempotent rerun;
8. then continue P0 through immutable revision, Ready-to-Submit and real submission provenance;
9. only after that, complete the P1 employer-outcome/Gmail/outreach/interview loop.

## 8. Required state-maintenance rule

Update this file after a material release, architecture change, capability promotion/demotion, prevention recurrence, changed autonomy boundary, or when environment evidence contradicts this snapshot. Product docs should distinguish **source state, deployed state, environment-verified state and prevention effectiveness** rather than collapsing them into one status.