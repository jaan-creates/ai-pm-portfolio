# Janu Job Copilot — Security & Privacy Threat Model

**Status:** Baseline threat model  
**Last verified:** 2026-08-23

## Protected assets

- API/connector credentials and session/auth material,
- private live tracker/application state,
- candidate evidence and generated resumes/application packs,
- private mailbox/outcome data,
- production Apps Script source/configuration,
- regression/eval evidence used to judge changes,
- external-account submission authority.

## Trust boundaries

1. **Public GitHub repo ↔ private product state**
2. **Untrusted job/web content ↔ model/harness instructions**
3. **Model output ↔ deterministic state/tool writes**
4. **Builder/CI ↔ production Apps Script**
5. **System automation ↔ human authenticated submission**
6. **Product-specific private evidence ↔ parent AI Systems Lab**

## Primary threats and controls

### T-01 — Private data copied into public repository
**Risk:** live application identities/status, candidate content, email/phone, traces or private artifacts become public.

**Controls:**
- public/private boundary in product docs,
- metadata/hash/reference-first telemetry,
- governance CI privacy linter for governed public docs,
- private tracker/Drive remains source for exact evidence,
- parent Lab receives only generalized non-sensitive learning.

### T-02 — Secret leakage
**Risk:** OpenAI/provider/Google/GitHub credentials enter source, traces or generated output.

**Controls:** Script Properties / GitHub Actions secrets; never log secret values; generic telemetry excludes credentials; CI/source review should treat secret-like strings as a failure.

### T-03 — Prompt injection / hostile source content
**Risk:** a job page, web result or document attempts to redirect model behavior or privileged actions.

**Controls:** treat retrieved text as untrusted data; system instructions explicitly constrain task; model output does not directly grant permissions; deterministic harness owns state transitions/tool permissions; external content cannot change release/security rules.

### T-04 — Fabricated/unsupported candidate or employer claims
**Risk:** resume/application material becomes misleading.

**Controls:** canonical evidence registry, strict evidence-ID mapping/validation, conservative gap classification, artifact QA, human final review.

### T-05 — Over-broad tool authority
**Risk:** model/automation writes or submits beyond intended scope.

**Controls:** `AUTONOMY_CONTRACT.md`, least privilege, explicit tool tiers, human submission boundary, budget/stop conditions, branch/draft PR before production changes.

### T-06 — Corrupted product truth from partial/incorrect writes
**Risk:** Sheets/Docs say work succeeded when target state is incomplete.

**Controls:** strict schema contracts, idempotency, target read-back, state-consistency checks, durable queue, terminal error evidence, rollback/recovery policy.

### T-07 — Evaluation tampering / self-rubber-stamping
**Risk:** improver weakens tests/evidence to make its change pass.

**Controls:** protected regressions/evidence, independent environment verification, targeted + broader regression gates, change records state evaluator changes explicitly.

### T-08 — Release provenance ambiguity
**Risk:** production behavior cannot be tied to exact source/version.

**Controls:** release identity, Git commit, regression suite, transformed-source SHA-256 manifest, post-push hash verification; longer-term private canonical runtime-source/version store remains desirable.

### T-09 — Telemetry overcollection
**Risk:** observability duplicates sensitive content and increases exposure.

**Controls:** `TELEMETRY_PRIVACY.md`, hashes/references by default, content capture opt-in/scoped, private storage, retention limits, privacy tests.

### T-10 — External-account impersonation/irreversible action
**Risk:** automated application submission without valid user authority/verification.

**Controls:** authenticated submission remains human-owned; never bypass OTP/CAPTCHA; exact resume-version provenance frozen only after confirmed real submission.

## High-impact change rule

Permission expansion, external submission automation, private-mail automation, new secret stores, multi-tenant use or public exposure of previously private evidence requires threat-model review before promotion.

## Incident rule

For security/privacy incidents: contain first, preserve minimum required evidence, rotate/revoke credentials if relevant, verify environment truth, record failure/prevention, add a regression/linter where mechanically testable, and review blast radius/retention.