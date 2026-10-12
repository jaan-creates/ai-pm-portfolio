# Janu Engineering Operating-System Recovery — 2026-10-13

**Decision:** HOLD / INCOMPLETE for production certification. This is a privacy-safe read-only reconciliation plus isolated source corrections, not a claim that the live product is fixed.

**Authority/evidence cutoff:** Master Product & Engineering Specification **v0.26.0** (Google Docs revision captured in the audit), GitHub main `205ce111667510d80020b1108372e1d218648f4f`, draft PRs #55/#56/#57, and private tracker state inspected on 2026-10-13 IST. Sensitive application content and live trace payloads remain private.

## Ten-point planned → implemented → executed → verified → next proof

| Audit dimension | Actually implemented/observed | Execution and independent proof | Open acceptance gate |
|---|---|---|---|
| 1. Source authority | Master contract, repo hierarchy and source register reconciled at named versions; RUNBOOK fallback corrected on PR #56 | Git source + Docs read | Latest decision-log changes versus deployed behavior, ownership conflicts and skill path still need closure |
| 2. PR #55 regression | Missing TRACE fixture dependency, v2/v3 shim and patch idempotence repaired in isolated PR #56 | Governance CI passed in GitHub; PR #55 remains open, draft and unmerged | Exact affected production patch and canary evidence before release |
| 3. Golden evidence chain | Matching Application, queue, resume registry/review and audit references inspected; historical trace view has incomplete parent/timestamps | Independent private tracker read-only reconciliation | Current-release full correlated execution → durable state → independent readback → reviewed artifact; no external submission without approval |
| 4. Dashboard state integrity | Dashboard formerly counted nonempty `OK` as error; corrected to provisional exceptions with separate `Not Started` | Bounded Google Sheets formula/readback and private FL-139 | Executable approved state-invariant evaluator; 0 provisional exceptions is NOT 0 certified state defects |
| 5. Sourcing scheduler | Repeated scheduled misses recorded; recovery runs distinct; primary ChatGPT sourcing automation observed disabled | Private `__Sourcing Runs`, `__System Health`, automation configuration reads | Trigger inventory, ownership, expected calendar, protected restart decision, and independently verified consecutive scheduled business cycles; do not clear circuit on recovery |
| 6. Metric integrity | Ten draft definitions and metric-schema validator with negative tests staged | GitHub CI verifies uniqueness, required fields, null unapproved baselines and assurance enums | Policy approval, real cohort numerator/denominator, evidence versions, minimum sample and outcome attribution |
| 7. Engineering self-audit | Prior false test claim recorded; corrected source test/run evidence and negative controls; private FL-139/140/141, JC-LAB-003 verified in prior audit | Independent CI logs, private learning readback | Measure process compliance on subsequent material changes and verify intervention effect |
| 8. Release safety | PR #56 source changes separate from PR #57 runtime inspection; neither merged | CI and PR state read; PR #56 production deploy skipped | Formal approval, protected release topology/rollback/branch enforcement proof |
| 9. Tool/runtime access | GitHub/Drive/tracker/known-run logs readable; PR #57 manual-only, stronger no-write guard and synthetic hash test | PR #57 CI PASS; credentialed source pull skipped | Read-only Apps Script HEAD capture, installed execution identity/hash comparison, trigger inventory, credential permission review and actual capture readback |
| 10. Evidence Gate & improvement | Source-side tests, dated assessment, false-success distinctions and private learning records | PR #56 governance CI PASS; no Apps Script deployment | Target-environment E2E, business metrics, repeat-observation improvement/recurrence and final independent promotion decision |

## New isolated regression proof from this recovery turn

- PR #56 commit `20663d671d6d50aee7e039373400eb03135e7078`: rejects disconnected cyclic span-parent graphs and impossible UTC calendar dates. GitHub Actions governance run **38293133158** passed **30** assurance assertions; deployment job **38293133204** skipped.
- PR #56 commit `c5a88d188b0e6fd4bd7310f7cf0c18f3a26db7a8`: fail-closed metric-dictionary validator and five additional negative/positive cases. Governance run **38293457999** passed **35/35** assertions including the metric dictionary checks; associated deployment run **38293457990** was skipped.
- PR #57 commit `580ef6e7e4bba7fedae8c7138dc1fd16f5889320`: removed automatic inspector schedule until authorized manual first capture and tightened forbidden write-command guard. GitHub Actions run **38293302664** passed static/synthetic tests; actual credentialed `clasp pull` job was **SKIPPED**.
- These controls validate only their scoped assertions. Neither PR has been deployed and no real workflow outcome is certified by them.

## Cross-source discrepancies and risks

1. The approved master spec requires approval-first content locking and render-after-approval for the official submission PDF (CS-20260824-033). Historical trace/worker implementation and tests do **not** establish complete conformance to this rule.
2. As of the 2026-10-13 tracker read, Daily Sourcing reports `BLOCKED / SOURCING_SCHEDULER_STALE`; successful recovery runs do not prove primary scheduler liveness. The disabled ChatGPT primary sourcing automation is an observable configuration gap but not sufficient by itself to explain all historical misses.
3. The private dashboard provisional state-exception calculation excludes `OK` and `Not Started`, but is not an independent invariant validator.
4. The new trace validator returns `STRUCTURALLY_COMPLETE` with `business_outcome_verified:false`, intentionally **not** a runtime business PASS. Production propagation and claim-level AI evaluation remain unverified.
5. Daily and weekly read-only audit task prompts are configured. No first task execution or notification delivery has been verified; task notification settings may prevent visible alerts.
6. Exact deployed Apps Script code, trigger topology, last successful production regression evidence and GitHub branch protection are not independently certified. A `clasp pull` snapshot identifies project HEAD; distinguish this from pinned versioned deployments where applicable.

## Next foundational execution gates, in strict dependency order

**A — Authority/ownership:** Reconcile newest master Decision Log with code, tracker and `TRACE_SCHEMA.md`; resolve expected-schedule owner and render lifecycle. Record decision IDs and contradictions without auto-changing approved policy. **Acceptance:** no unowned critical invariant and no unreviewed authority conflict.

**B — Secure runtime access:** Review PR #57 credential scope, output privacy and manual-run ownership; after explicit approval activate only the read-only source capture, compare observed source hash/version with private release evidence and inspect triggers via separately authorized read-only Apps Script interface. **Acceptance:** one timestamped, independently reproducible source/trigger snapshot; never treat project HEAD as a versioned deployment without proof.

**C — Measurement/instrumentation:** Approve numerator, denominator, inclusion, exclusion, window, missing-data and data lineage for the ten metrics. Implement and test correlation identifier propagation and immutable source-event provenance on isolated real worker code, not merely the source-only validator. **Acceptance:** privacy-safe recorded events survive queue/tool/worker/persistence boundaries and one entire graph reconciles to independent readback.

**D — Business recovery/target E2E:** Diagnose primary sourcing schedule and its disabled task/control-plane topology; honor open circuits and release approval. Verify one bounded same-fixture end-to-end path under approval-before-official-PDF, including dedupe, failure recovery, factual resume QA, exact immutable assets, approval boundaries and no false success. **Acceptance:** target-environment tests, confirmed durable downstream readback, no unauthorised external submission and non-regression against approved baseline.

**E — Recurrence and measurable improvement:** Observe and verify actual daily/weekly audit executions and delivery, monitor defect family recurrence, and compare source/operational metrics against approved prechange cohorts. **Acceptance:** evidence-backed Keep/Revise/Reject decision, observed effectiveness, and closed Iteration Evidence Gate with explicit residual risks.

**Human/protected decisions outstanding:** approval for first credentialed PR #57 runtime inspection, production-affecting PR #56 merge/release, sourcing scheduler re-enable/trigger remediation, baseline approval, and any external submission. **Do not infer any approval from this source document.**

**Safety/rollback:** PRs #55/#56/#57 remain draft and unmerged. No production Apps Script push, worker invocation, external send or new private tracker mutation was performed in this recovery turn. Branch commits are reversible, public artifacts exclude private application content, and release state remains unchanged.

**End state:** source-level safeguards improved and checked; full ten-point product recovery and five foundational gates are **INCOMPLETE** until target-runtime and business outcomes are independently verified.


## Gate A authority and Gate B access review — follow-up

This is a fresh read-only reconciliation from the explicitly approved recovery plan, NOT an assertion of product acceptance. Source IDs: Google Drive Master Product & Engineering Specification v0.26.0 (read at the current revision), GitHub `main` `205ce1116675`, `CURRENT_STATE.md`, `PRODUCT_CAPABILITY_MAP.md`, `TRACE_SCHEMA.md`, `MONITORING_ALERTS.md`, `EVAL_PLAN.md`, and the October 13 private tracker observations.

| Authority and expected invariant | Implementation/execution observation | Acceptance status / next proof |
|---|---|---|
| Master source order: approved candidate factual evidence > latest Master Spec > append-only Decision Log > live tracker > chat | Re-read current Master Spec 0.1; source register staged on this draft PR | **VERIFIED for hierarchy**, not for runtime implementation |
| CS-20260824-031: artifact-driven continuation, latest-attempt semantics, genuine My Actions boundary, no user relay for machine work | Public continuation patch and helper tests exist; current live workflow behavior not independently executed for specified fixtures | **PARTIALLY OBSERVABLE**; read back actual queued transitions and My Actions for targeted fixtures |
| CS-20260824-032: known renderer defect family quarantined until exact Career Break regression, release provenance and bounded live canary pass | Historical source/CI and private Failure Learning exist; a reported HEALTHY component does not satisfy exact canary acceptance | **BLOCKED** pending release-controlled runtime canary and immutable artifact readback |
| CS-20260824-033: approved content/hash before official PDF render, post-render QA, exact PDF version/hashes, no preapproval asset | Current public patch/test source does not establish `approved_content_hash` or the full approved lifecycle; full deployed code cannot currently be read | **NOT VERIFIED**; prevent older `Resume Review`-only trace acceptance from certifying this newer contract |
| FL-098: one owner-authorized five-minute `phase1OneJobTick` trigger, exact owner/cadence | Tracker component status exists, but direct trigger inventory remains unavailable through current connection | **BLOCKED**; authorized read-only trigger topology and owner evidence required |
| M-01: every expected sourcing slot has truthful durable completion; recovery != scheduled success | Daily Sourcing remains BLOCKED/OPEN with repeated missed scheduled slots; ChatGPT primary sourcing automation is disabled while bounded recovery watcher is enabled | **VERIFIED operational fault**, scheduler owner/topology still unverified; do not lift circuit on recovery evidence |
| TRACE_SCHEMA: event, span, trace and release identifiers retain consistent cross-boundary meaning | Source-only validator has schema and 35 negative/positive checks; existing displayed Trace Explorer evidence was incomplete | **PARTIALLY OBSERVABLE**; approve trace/span/event projection map and prove actual worker-to-persistence propagation |
| Iteration Evidence Gate: implementation, real tests, target-environment execution, independent readback and improvement proof | Draft source-level CI passes and deployment skipped | **INCOMPLETE** until target-environment downstream evidence |
| Daily/weekly assurance delivery | Task definitions are enabled, with no observed first execution and notifications off in the task configuration | **NOT VERIFIED**; do not certify alert delivery from prompt presence |

### Least-privilege read-only capture decision

The initial PR #57 design reused the write-capable production CD identity `JANU_CLASPRC_JSON`, even though it called only `clasp pull`. **Command-level read-only is not equivalent to credential-level least privilege**. Corrective isolated commit `13ed3b5722eca9c3434bc210afd667cc3681d2b1` requires `JANU_INSPECT_CLASPRC_JSON` and auditor identity, and rejects reference to the production CD secret. It preserves *manual-only* activation. GitHub Actions read-only static guard **38295666910 PASS**; actual credentialed `inspect-runtime` **SKIPPED**.

**Stop conditions:** Do not merge/activate PR #57 until dedicated auditor credential availability, OAuth/project access scope, private output retention/visibility, GitHub Actions permissions and fallback cleanup are reviewed. Do not infer that the new secret exists. An eventual `clasp pull` captures Apps Script editable project HEAD, which alone does not prove a separately versioned deployment is running. Trigger owner/cadence requires its own read-only verifier.

### No-change boundaries

No master specification, approved candidate record, production worker, Apps Script trigger, release, application or submitted artifact was changed by this review. PR #55 and the recovery PRs remain draft. A source-only PASS cannot close product-level Gate A–E. The first blocked external dependency is an authorized, verified dedicated read-only Apps Script capture identity and permissible activation path.
