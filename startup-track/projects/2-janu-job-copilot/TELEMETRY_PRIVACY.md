# Janu Job Copilot — Telemetry Privacy

**Status:** Required policy before expanded tracing  
**Last verified:** 2026-08-23

## Principle

Collect the minimum evidence needed to diagnose, evaluate and improve Job Copilot. Observability is not permission to duplicate sensitive product content into generic logs.

## Never record in generic traces/logs

- API keys, OAuth tokens, credentials or session cookies,
- CAPTCHA/OTP values,
- full private email bodies unless a narrowly scoped secured evidence store explicitly requires them,
- full candidate evidence registry or resume text,
- full JD text when a canonical artifact/reference already exists,
- full model prompts/outputs by default,
- private contact details not already approved for the product purpose,
- secrets from Script Properties or CI.

## Prefer

- stable IDs,
- hashes/content fingerprints,
- document/file/application references,
- schema/prompt version identifiers,
- operation names,
- model/provider name,
- status/error class,
- latency,
- token/cost counts,
- boolean verifier results,
- bounded redacted diagnostic snippets only when necessary.

## Storage separation

- Product/candidate truth remains in the authorized tracker/Drive/product stores.
- Generic telemetry should contain references/hashes sufficient for diagnosis.
- Sensitive incident evidence, if required, remains product-local with restricted access and retention.
- The parent AI Systems Lab repository must receive only generalized, non-sensitive lessons—not raw candidate/customer traces.

## Retention

Keep detailed trace data only as long as useful for active diagnosis/evals unless there is a proven long-term learning need. Aggregate metrics and promoted failure/decision records may outlive raw traces when privacy-safe.

## Model/tool tracing

For model/tool spans, default to metadata-only capture. If temporary content capture is enabled for debugging, document:
- why it is needed,
- scope and duration,
- access boundary,
- deletion/retention plan,
- whether the content contains personal/sensitive data.

## Verification

Telemetry privacy itself must be tested. At minimum add checks that generic trace/audit exports do not contain known secret patterns, candidate phone/email text, full resume/JD bodies or internal credentials.