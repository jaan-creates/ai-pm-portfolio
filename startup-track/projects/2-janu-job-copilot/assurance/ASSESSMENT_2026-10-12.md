# Architect Assessment — 2026-10-12 — Evidence Cutoff: 2026-10-12 IST

**Overall:** INCOMPLETE — product not certified. **PR #55:** draft/open/unmerged. **Branch:** `janu-job-copilot/assurance-recovery-20261012`, based on `205ce111667510d80020b1108372e1d218648f4f`. Exact current Apps Script source not independently pulled; no runtime workers triggered by this assessment.

## The ten audit findings, actions and proof gaps

| Scope | Action or measured finding | Evidence / outcome | Remaining proof |
|---|---|---|---|
| 1. Authority/governance | Re-read master spec v0.26.0, repository policies, parent Lab instructions; staged source register and clarified missing skill reference | Master Docs revision available; Git blob/commit per branch change | Reconcile decision-log deltas and production release identity |
| 2. PR #55 regression failure | Existing TRACE test fixture omitted actual lifecycle dependency; branch now composes real vacancy lifecycle patch | Historical failing CI run 38221284384 / governance 38221284252, both missing `p1aPropagateClosedVacancy_` | **CI PASS** run 38287883539; six actual generated runtime helper checks + patch-composition idempotence. No production E2E proof |
| 3. Golden evidence chain | Tracker had linked Application, 18 queue jobs, Resume Registry, review and audit; trace view had 26 entries missing all parent-span IDs | Read-only bounded private Sheets readback | Real source/mutation, full correlated trace and external submission still unverified |
| 4. State dashboard integrity | Before: Dashboard B17 `COUNTIF(...,"?*")` counted 51 OK + 6 Not Started as 57 errors. After: B17 `COUNTIF("?*")-COUNTIF("OK")-COUNTIF("Not Started")` | **Live formula readback: 0 provisional exceptions**, separate B19 **6 Not Started**; C17 link preserved | Define authoritative invariant taxonomy; dashboard not a full business validation |
| 5. Sourcing health | Multiple October missed scheduled runs even when recovery succeeded; Daily Sourcing reported BLOCKED/OPEN | Private `__Sourcing Runs` and `__System Health` | Apps Script trigger inventory, schedule owner and durable independent outcome |
| 6. Metric validity | Staged 10 versioned metric definitions with numerator, denominator, exclusions, source, cohort/missing-data policy and nullable baseline | `metrics.v1.json` source artifact | Approval, normalized cohort measurements, empirical targets |
| 7. Assistant process | Staged source/capability register, negative-control execution contract and mandatory governance CI step | Git SHA of modified branch and CI workflow | CI PASS 38287883539; regression-to-incident learning and measurable reduction in user relay still pending |
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

1. CI PASS achieved: run 38287883539, 21 evidence-contract checks and six generated-runtime helper assertions; continue with an isolated full-worker fault scenario before production acceptance.
2. Obtain read-only clasp source hash + deployed identity using newly staged workflow after reviewed activation; no production workflow invocation as an audit shortcut.
3. Recover sourcing schedule independently, prove business outcomes and absence of avoidable relays.
4. Instrument real worker event propagation only after private/schema compatibility and isolated E2E tests.
5. Close one valid golden path with independent tracker, artifact, audit and trace readback. Record reliable baseline and controlled improvement outcome.

## Verified later-on-October-12 execution and recurring review

- Governance workflow run `38287883539`: **SUCCESS** at tested commit `b3037cc4f2bceaefbf024b8ec5d3c04f3f28a11f`. Real TRACE patch composition and idempotence passed; six generated runtime helpers executed in Node VM; continuation v2/v3 shim negative controls passed; `JANU-ASSURANCE-1` executed 21 assertions including negative controls. **Does not prove production behavior.**
- Matching Apps Script CD workflow run `38287883533`: `deploy-production` **SKIPPED**; no Apps Script deployment.
- Diagnosed two additional patching defects: v2-only compatibility shim rejected authoritative v3, and E2E continuation function replacement introduced extra bytes on repeated application. Both repaired and covered in isolated CI. Production applicability pending protected release review.
- Created read-only automated weekly architect assessment and daily conditional critical-health watch. **No scheduled run has yet been observed**, so delivery reliability is NOT VERIFIED.
- Recovery source remains draft. Branch protection admin endpoint returned 403; repo ruleset listing was empty, neither sufficient to certify main protection.

## Private failure-learning and product/Lab accountability (read back)

- `FL-139`: dashboard metric counted OK states as errors; dashboard correction was independently read back. The **state-invariant evaluator remains pending**.
- `FL-140`: v2-only E2E compatibility shim rejected v3; source patch and version-negative regression verified by CI, production deployment not performed.
- `FL-141`: E2E function replacement had byte drift on repeated patch; test now passes after actual code fix; production deployment not performed.
- `JC-LAB-003`: linked intervention with before/after source-level evidence, observation window of three material changes and 30 days; decision **Insufficient Evidence — Source Improvements Verified; Runtime/Outcome Pending**.

The four private records were each independently read back in the Live Tracker after the write. The weekly read-only architect assessment and daily critical conditional watch have been created, but **their future execution and alert accuracy have not yet been verified**.

Document-only CI after initial implementation also passed (run `38288019701`); corresponding Apps Script CD job `38288019686` was skipped. No production runtime promotion occurred.
