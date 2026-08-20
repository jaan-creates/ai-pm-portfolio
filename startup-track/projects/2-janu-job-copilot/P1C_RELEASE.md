# Janu Job Copilot — P1-C Release Evidence

Status: DEPLOYED — LIVE TELEMETRY PENDING

Deployment run: 32349306464
Commit deployed: 54b63a97c20e3497e9b97b8ac825fe4cc8911d93
Production baseline preserved: 1.3.8 / p0-regression-v19

## CI evidence
- P1-A additive patch: PASS
- P1-B additive patch: PASS
- P1-C additive patch: PASS
- JavaScript syntax validation: PASS
- Full P0 release validator: PASS
- P1-A contract validation: PASS
- P1-B contract validation: PASS
- P1-C contract validation: PASS
- Apps Script push: PASS / script already up to date

## P1-C contracts deployed
- Submitted resume versions remain immutable.
- Unresolved comments create the next version (for example V2 -> V3) rather than overwrite the current version.
- Gmail outcomes are classified into application acknowledgment, recruiter reply, assessment, interview/scheduling, rejection, offer/comp, job alert, or unrelated.
- Application matching is deterministic and ambiguous matches fail closed.
- Contact discovery prefers cached/public official sources, then retrieval providers; private/paid-only and low-confidence candidates are rejected.

## Live acceptance gate
Wait for the scheduled phase1HealthTick to produce:
- p1c_self_test = PASS
- p1c_contract_version = P1-C-1

P1 is not declared closed until P1-C live telemetry is PASS and the P0 health/preflight/queue gates remain green.
