# P1-B Controlled Release

P1-A live acceptance observed: `p1a_self_test=PASS`, contract `P1-A-1`, with the P0 regression gate, live preflight baseline, system health and production worker remaining healthy.

P1-B adds fail-closed cost/cache/queue lifecycle contracts:

- monthly and per-application hard-cap decisions;
- optional paid work stops before mandatory work;
- versioned output-cache keys using content/evidence/prompt/schema/policy identity;
- Company Cache TTL freshness checks;
- dead-letter vs replay vs terminal-failure decisions using semantic freshness and retryability;
- stale running-lease recovery and obsolete/cancelled queue GC decisions;
- durable `p1b_self_test` / `p1b_contract_version` health telemetry.

Release gate: pull live `1.3.8 / p0-regression-v19` -> reapply idempotent P1-A -> apply P1-B -> syntax check -> full frozen P0 validator -> P1-A/P1-B contract checks -> clasp push -> scheduled-health live telemetry. P1-B is not accepted until `p1b_self_test=PASS` appears live and P0/system health remain green.
