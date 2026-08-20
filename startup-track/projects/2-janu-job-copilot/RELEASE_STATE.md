# Janu Job Copilot — Release State

Last updated: 2026-08-20

## Frozen production baseline

- Production release: `1.3.8`
- Regression suite: `p0-regression-v19`
- P0 closure: `COMPLETE`
- Live preflight: `PASS`
- Production worker: `enabled`
- Master spec: `0.19.0`
- Deployment branch: `janu-job-copilot/apps-script-ci`

## P1-A gate

Status: `CONTROLLED DEPLOYMENT IN PROGRESS`

P1-A is additive over the frozen P0 source. The deployment path now pulls production first, requires exact live `1.3.8 / p0-regression-v19`, adds the P1-A contracts, runs JavaScript syntax validation and the complete existing P0 release validator, then pushes only on PASS.

P1-A contracts currently included:

- retrieval routing: cache -> direct official -> Tavily -> SerpAPI -> unavailable
- retrieval provenance: provider, URL, retrieval timestamp, content hash, confidence
- deterministic JobPosting JSON-LD extraction and ATS host classification
- vacancy revalidation after 72h before tailoring and 24h before submission
- fail-closed OPEN/CLOSED/UNKNOWN vacancy state
- stable source-promotion key and duplicate/closed-vacancy rejection
- deterministic P1-A self-test

The previously prepared `1.3.9 / p0-regression-v20` patch is not part of this P1-A deployment. Its prior CI attempt failed release validation before `clasp push`; production remained on the verified v19 baseline.

## Evidence progression

`PATCHED -> TRIGGERED -> VALIDATED -> DEPLOYED -> LIVE -> TESTED -> P1-A CLOSED`

Do not mark P1-A closed until the workflow push succeeds, the production source exposes the P1-A contracts, P0 regression/preflight remain green, and limited live intake/vacancy acceptance is proven.

## Automation boundary

ChatGPT owns repository changes, deployment inspection, tracker verification, regression/preflight inspection, defect triage and iterative repair. Human intervention is reserved for genuine OAuth/security or authenticated external-action boundaries.
