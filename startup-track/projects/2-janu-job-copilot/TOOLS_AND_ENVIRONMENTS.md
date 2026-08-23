# Janu Job Copilot — Tools & Environments

**Status:** Current control-surface map  
**Last verified:** 2026-08-23

## Data-boundary rule

The code/portfolio repository is public. The live tracker, candidate evidence, generated application artifacts and detailed runtime evidence are private product surfaces. Do not copy private product evidence into the public repo when an opaque ID, hash, schema or privacy-safe summary is enough.

## Environments

### Public source / governance
- GitHub repository containing Job Copilot patch machinery, CI workflows and sanitized product documentation.
- Suitable for code, schemas, non-sensitive tests, release/build narratives and privacy-safe evidence references.
- Not suitable for private tracker rows, full candidate evidence, full generated resumes, private email content or secrets.

### Private production state
- Google Sheets Live Tracker and its hidden operational sheets.
- Canonical for application lifecycle, queue/workers, health, costs, regression/failure-learning and related product state where the schema says so.

### Private product artifacts
- Google Drive / Docs for canonical candidate evidence, JD captures/artifacts, resumes and application packs.

### Production runtime
- Google Apps Script project bound to the Job Copilot workflow.
- Current final production source is created by pulling live source, applying repository patch scripts and pushing via `clasp`.

### External read environments
- public ATS/job pages and supported retrieval/search providers,
- public web search for bounded company/contact research.

### External privileged environment
- authenticated job-application/account surfaces. Final submission remains a human authority boundary unless a separately authorized safe submission tool is created.

## Tool / control-surface map

| Tool/interface | Target | Read | Write | Verification | Current note |
|---|---|---:|---:|---|---|
| GitHub connector | public product repo | Yes | Yes | commit/branch/PR read-back | verified on exact repo |
| Google Drive/Sheets connector | private tracker/artifacts | Yes | Yes | range/file read-back | verified on exact tracker/files used in Lab inspection |
| GitHub Actions + `clasp` | production Apps Script | Yes via CI pull | Yes via gated CI push | release validation + post-push hash target | no direct ChatGPT Apps Script source connector |
| Apps Script Spreadsheet/Drive/Docs APIs | private Google product state | Yes | Yes | explicit read-back required for material writes | runtime tool surface |
| OpenAI Responses API | model inference | request/response | external call only | schema/verifier/runtime checks | key stored outside source |
| OpenAI/web search tool | public web | Yes | No target mutation | source/result evidence | bounded enrichment use |
| direct HTTP/provider adapters | public ATS/search providers | Yes | provider-dependent | status/provenance/hash | budget/fallback policy applies |
| Gmail connector/runtime capability | mailbox/outcome workflow | potentially | controlled writeback | fail-closed match required | product runtime wiring remains partial/planned |

## Permission tiers

- **Tier R:** read-only evidence/retrieval.
- **Tier W:** reversible product-state write.
- **Tier P:** privileged/production mutation.
- **Tier I:** irreversible/external-user action.

The harness should explicitly know which tier a tool invocation belongs to. Tier P/I actions need stronger release/approval/verification controls than ordinary reads.

## Exact current capability gap

The current ChatGPT/GitHub control path can modify the repository, but it cannot directly fetch the exact current Apps Script runtime source from Google without the existing CI/`clasp` credentials. Therefore the CI workflow remains part of the production source-of-truth control path.

A future move to a private canonical runtime-source repository or secure versioned source backup will require a secure cross-repository/storage credential or installation scope. Until then, deployment hashing and in-run backup/rollback reduce but do not completely remove this limitation.

## Tool-result rule

Prefer structured results that expose actual state/value/hash/status rather than `done`. For important writes, perform immediate target read-back where feasible.

## Review trigger

Update this file when a new provider/tool is added, write permission expands, a connector authorization changes, a new environment becomes canonical, or the production source/deployment architecture changes.