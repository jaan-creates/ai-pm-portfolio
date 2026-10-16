# Offline Evaluation Gate — initial implementation

Status: **partial implementation / no production acceptance**. As of 2026-10-12, the initial synthetic suite passed locally (11/11) and detected two deliberate mutations. The repository CI workflow has **not** yet been independently verified as passing at the time this note was authored.

## Actual architecture and risk map

Source/control: public Git repository patchers and GitHub Actions. Runtime: private live Apps Script pulled and patched with clasp. State: private Google Sheets tracker; artifacts: private Google Drive/Docs; source retrieval and model calls are external. The final deployed source is not fully checked into Git, so offline checks alone cannot prove runtime behavior.

| Capability | Trigger → dependency → outcome | Hard invariant / risk | Evidence status |
| --- | --- | --- | --- |
| Job sourcing | Schedule → source adapters → canonical tracker write | Missed run != zero results; no success on failed write | Synthetic only; production NOT VERIFIED |
| Intake promotion | User URL → gates/JD/dedupe → one linked application | No duplicated application, no false successful promotion | Synthetic only; production NOT VERIFIED |
| Qualification | JD → eligibility + evidence scoring → decision | Hard disqualification independent of fit; compensation excluded from fit | Documented in master spec; NOT VERIFIED here |
| Resume preparation | Apply → JD/evidence → Docs/PDF/QA → review | No unsupported facts or silent overwrite | Existing patches/tests; E2E NOT VERIFIED |
| Submission | Human confirmation → immutable resume version + submitted date | Never auto-claim submission | Synthetic only; production NOT VERIFIED |
| Outcome monitoring | Gmail → application matching → outcome event | Ambiguous messages fail closed; no unintended message sends | NOT VERIFIED |
| Deployment | Github Actions → live source pull/patch → clasp push/readback | Validated hash and rollback | Static release gate check; live NOT VERIFIED |
| Telemetry | Sourcing/worker states → System Health | Actual business outcomes matter more than worker return | NOT VERIFIED |

Dependency chain: sourced URL → canonicalization/vacancy → eligibility → dedupe → application/JD persistence → scoring/evidence mapping → artifact rendering/QA → human approval → verified submission → outcome event. A failure at an upstream stage must stop downstream success reporting.

## Runner and case registry

Run at repository root:

```bash
node startup-track/projects/2-janu-job-copilot/evals/run.mjs
```

Cases live in `evals/cases.json`. The runner emits `evals/report.json`, machine-readable evidence, and exits nonzero if an expected check fails. The explicit negative mutation checks ensure two broken behaviors would be detected. This is **not yet a versioned production baseline comparator**; the small comparator exercise tests previously PASS → FAIL transitions only. Do not approve new baselines automatically.

GitHub workflow `.github/workflows/janu-job-copilot-evals.yml` runs three existing source patch tests and the offline suite on pull requests, without clasp credentials or production writes. The existing production workflow and master instructions are unchanged.

## Review checkpoints and gaps

- PR: run offline checks and source patch tests; failures block that check, but repository branch protection is NOT VERIFIED.
- Pre-deploy: the existing clasp workflow checks transformed-source syntax, identity and hash. End-to-end behavioral verification remains NOT VERIFIED.
- Post-deploy: some smoke calls in the existing workflow use `continue-on-error: true` and must not be mistaken for hard gates.
- Scheduled/live: verify last attempted run, last successful run, source coverage, actual durable writes, worker failures, and stale tracker records using authorized **private** telemetry. No new live polling or alerts were installed.
- AI: build versioned synthetic/approved private cases for fit, factual resume claims, tool choice and prompt injection; calibrate human rubrics. None were executed here.
- High-risk missing checks: real user-intake promotion, idempotency under concurrency, partial-write recovery, authorization, immutable resume provenance, submission state, mailbox matching and current-release full golden path.

## How to extend safely

Add a synthetic case with stable ID, severity, expected value and scope in `cases.json`; add executable assertion in `run.mjs`; test the passing and deliberately failing variants; use actual project functions under an isolated mock when possible. Keep private tracker/email/resume data out of public fixtures. After a confirmed defect, preserve a reproduction and an explicit reviewed baseline update. Only call an integration production-ready after independently verified authoritative state readback.

## Permanent instruction recommendation (do not silently apply)

Add to engineering release governance: **Run impact-appropriate deterministic/AI/workflow regression checks before a material change; preserve approved baselines and regression cases for defects; report failing, skipped and blocked checks with evidence; never claim business completion without downstream authoritative verification.** Existing master specification already requires tests, so this is a concise evidence-and-gate strengthening rather than a replacement.

## Known limitations

This implementation adds a safe CI harness and a small synthetic rule contract, not executable isolation of the actual current live Apps Script. A complete production-grade evaluation system requires access to the transformed production source in a non-production test environment and suitable test telemetry, plus separately authorized monitoring. No live records or external messages were changed.
