# Janu Job Copilot — Autonomy Contract

**Status:** Active policy proposal for the next iteration  
**Last verified:** 2026-08-23

## Principle

Grant the system enough authority to finish system-owned work without avoidable user relay, while keeping irreversible/high-impact actions, permission expansion and genuine personal judgment behind explicit boundaries.

## AI/system may autonomously

Within existing authorized resources and budget limits, the runtime/builder may:
- read product code, tracker state, approved evidence and public job/company sources,
- retrieve/canonicalize public vacancy and JD evidence,
- classify, score and map requirements to approved evidence,
- create/update system-owned tracker state,
- enqueue, retry, recover, deduplicate and reconcile jobs,
- generate evidence-grounded candidate artifacts,
- perform deterministic/model-assisted QA,
- correct system-owned stale state or obsolete queued work,
- run tests/evals/regressions,
- inspect health/logs/deployment evidence,
- create branches, commits and draft PRs,
- update product-local current-state/build/eval/learning documentation when evidence supports it,
- record failures and candidate prevention controls,
- stop work that violates vacancy, budget, safety, state-consistency or release gates.

## Explicit approval currently required

Until production release controls demonstrate sufficient reliability, require explicit human approval for:
- merging a PR that changes production Apps Script/runtime behavior and thereby enables a production deployment,
- expanding GitHub/Google/OpenAI/Gmail or other permissions,
- changing secrets/credentials or account ownership,
- destructive/irreversible production mutations without a tested recovery path,
- submitting an external job application as the user,
- bypassing CAPTCHA/OTP or impersonating user authentication,
- final resume approval when the product contract reserves that judgment for the user,
- material strategy/scope changes without a validated product decision.

This approval policy may be loosened later only after evals/incident history justify it.

## AI/system must never

- fabricate candidate evidence, achievements, metrics, employer facts or private contact information,
- weaken/remove an evaluator, regression or guardrail merely to make a change pass,
- treat a helper/self-test as proof of end-to-end success,
- mutate protected evidence used to evaluate the same candidate improvement,
- silently broaden permissions or data collection,
- expose API keys, secrets, private candidate content or sensitive telemetry outside its allowed surface,
- continue expensive downstream work after a verified terminal/closed vacancy state,
- mark Submitted without explicit real-submission confirmation,
- overwrite immutable submitted-resume provenance,
- claim a deployment succeeded without workflow/environment evidence.

## Stop conditions

A worker/run must stop or fail closed when any relevant condition holds:
- required canonical evidence is unavailable and no authorized retrieval path remains,
- vacancy is verified CLOSED,
- budget/cost ceiling is reached,
- runtime/release/regression circuit is open,
- required precondition or persisted artifact read-back fails,
- state is inconsistent or ambiguous enough that continuing could corrupt truth,
- retry limit is exhausted,
- tool/provider returns a deterministic non-retryable failure,
- human authority is required by this contract.

## Retry and recovery rule

Retry only failures classified as transient and only within bounded attempts/backoff. Deterministic failures should become terminal evidence and route to repair/learning rather than repeated blind retries. A recovered run must preserve the earlier failure evidence rather than erase it.

## Human-escalation test

Before creating `My Actions` or asking the user to intervene, answer:
1. Is the requested action genuine judgment or privileged external authority?
2. Is required information impossible to obtain using currently authorized system tools?
3. Has the system exhausted safe automatic recovery?
4. Is the exact user input/action described minimally and unambiguously?

If the answer to 1 and 2 is no, the blocker is presumptively system-owned and should become failure/learning evidence.

## Builder/deployment boundary

The builder may autonomously prepare and validate changes on a branch. Production-changing merge/deploy remains approval-gated for now because Job Copilot has recent live release-control failures (including deployment identity, patching, bootstrap and runtime-continuation classes). This is a temporary risk control, not a permanent preference for manual relay.

## Review trigger

Revisit this contract after:
- three consecutive material production releases with complete release/trace evidence and no avoidable user deployment relay,
- a meaningful permission/tool expansion,
- a new external submission capability,
- a high-severity incident,
- introduction of a genuinely agentic or multi-agent execution loop.