# Architect Assessment — 2026-10-12 — Evidence Cutoff: 2026-10-12 IST

**Overall:** INCOMPLETE — product not certified. **PR #55:** draft/open/unmerged. **Branch:** `janu-job-copilot/assurance-recovery-20261012`, based on `205ce111667510d80020b1108372e1d218648f4f`. Exact current Apps Script source not independently pulled; no runtime workers triggered by this assessment.

## The ten audit findings, actions and proof gaps

| Scope | Action or measured finding | Evidence / outcome | Remaining proof |
|---|---|---|---|
| 1. Authority/governance | Re-read master spec v0.26.0, repository policies, parent Lab instructions; staged source register and clarified missing skill reference | Master Docs revision available; Git blob/commit per branch change | Reconcile decision-log deltas and production release identity |
| 2. PR #55 regression failure | Existing TRACE test fixture omitted actual lifecycle dependency; branch now composes real vacancy lifecycle patch | Historical failing CI run 38221284384 / governance 38221284252, both missing `p1aPropagateClosedVacancy_` | **NEW CI PASS REQUIRED**; no assumption of fix until actual run |
| 3. Golden evidence chain | Tracker had linked Application, 18 queue jobs, Resume Registry, review and audit; trace view had 26 entries missing all parent-span IDs | Read-only bounded private Sheets readback | Real source/mutation, full correlated trace and external submission still unverified |
| 4. State dashboard integrity | Before: Dashboard B17 `COUNTIF(...,"?*")` counted 51 OK + 6 Not Started as 57 errors. After: B17 `COUNTIF("?*")-COUNTIF("OK")-COUNTIF("Not Started")` | **Live formula readback: 0 provisional exceptions**, separate B19 **6 Not Started**; C17 link preserved | Define authoritative invariant taxonomy; dashboard not a full business validation |
| 5. Sourcing health | Multiple October missed scheduled runs even when recovery succeeded; Daily Sourcing reported BLOCKED/OPEN | Private `__Sourcing Runs` and `__System Health` | Apps Script trigger inventory, schedule owner and durable independent outcome |
| 6. Metric validity | Staged 10 versioned metric definitions with numerator, denominator, exclusions, source, cohort/missing-data policy and nullable baseline | `metrics.v1.json` source artifact | Approval, normalized cohort measurements, empirical targets |
| 7. Assistant process | Staged source/capability register, negative-control execution contract and mandatory governance CI step | Git SHA of modified branch and CI workflow | Actual passing CI, regression-to-incident learning, measurable reduction in user relay |
| 8. Priority/risk handling | Kept production deploy out of scope, staged safe read-only runtime manifest pull workflow | `.github/workflows/janu-job-copilot-runtime-assurance.yml` | Reviewed merge required to activate; not run |
| 9. Permission/readiness | GitHub repo + private Sheets reads verified; branch writes tested, production Apps Script source pull requires CI identity | `source-register.v1.json` and access logs | Actual private runtime capture and branch-protection check still blocked |
| 10. Closeout | Material code staged on isolated branch, runtime changes not merged; assessment preserved | This artifact and branch commits | Full Iteration Evidence Gate not satisfied, final HOLD |

## Explicit readback defect and correction

Original Dashboard B17: `=COUNTIF(Applications!AO2:AO,"?*")` showed 57.
An initial attempted replacement with `COUNTIFS` unexpectedly displayed 963 (blank/formula-cell semantics). **That observed incorrect result was rejected before closeout.**
Final production dashboard formulas as read back:
- B17: `=COUNTIF(Applications!AO2:AO,"?*")-COUNTIF(Applications!AO2:AO,"OK")-COUNTIF(Applications!AO2:AO,"Not Started")` → 0.
- B19: `=COUNTIF(Applications!AO2:AO,"Not Started")` → 6.
- Labels explicitly call the exception count **provisional**, not a certified error count.

Rollback source for B17 is the original `=COUNTIF(Applications!AO2:AO,"?*")`, but reinstating the misleading label/metric is not recommended. The new dashboard logic counts unrecognized nonblank text and is not a substitute for an independently validated state-invariant check.

## Evidence Gate

- **Environment**: tracker formula successfully read back; exact Apps Script remains inaccessible directly.
- **Trace**: historical partial trace; no complete current release reconstruction.
- **Audit**: production dashboard formula changed by authorized reversible Sheets batchUpdate; public record only includes sanitized counts and formulas.
- **Eval/regression**: negative control suite staged; no result claimed until Github Actions observed.
- **Metrics**: definitions proposed, baseline unknown; no numerical improvement claim.
- **Failure learning**: source findings documented here; private failure-learning record not yet written because live defect taxonomy and approval need reconciliation.
- **Release provenance**: no Apps Script release performed; Git commits branch-only.
- **User release note**: Dashboard label/number corrected, not a new product workflow.
- **Docs**: source register and assurance README updated; this report is privacy-safe.
- **Security/autonomy**: no credentials exposed, outbound messages, job submissions, or production worker calls.
- **Rollback**: Git branch remains unmerged; Sheets formula reversible (above).
- **Final decision**: **HOLD** for runtime release. Keep PR #55 unmerged. Further verification required.

## Next valid measurable intervention

1. Achieve actual GitHub Actions PASS for the corrected TRACE fixture and assurance contract; detect a deliberately broken real worker/patch scenario.
2. Obtain read-only clasp source hash + deployed identity using newly staged workflow after reviewed activation; no production workflow invocation as an audit shortcut.
3. Recover sourcing schedule independently, prove business outcomes and absence of avoidable relays.
4. Instrument real worker event propagation only after private/schema compatibility and isolated E2E tests.
5. Close one valid golden path with independent tracker, artifact, audit and trace readback. Record reliable baseline and controlled improvement outcome.
