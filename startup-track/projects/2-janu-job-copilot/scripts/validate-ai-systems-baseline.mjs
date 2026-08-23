import fs from 'node:fs';
import path from 'node:path';

const projectDir = process.argv[2] || path.resolve('startup-track/projects/2-janu-job-copilot');

const required = {
  'PRODUCT.md': ['## Primary user outcome', '## Success dimensions', '## Sources of truth', '## Current priority'],
  'OUTCOME_MODEL.md': ['## 1. Whole product job to be done', '## 2. North-star outcome', '## 3. Outcome ladder', '## 6. Product loops'],
  'PRODUCT_CAPABILITY_MAP.md': ['## Capability map', '## Critical path interpretation', '## Capability-promotion rule'],
  'EXECUTION_ROADMAP.md': ['## Priority architecture', '## P0 — Prove one clean traceable source-to-submission journey', '## P1 — Close the employer-outcome and communication loop', '## P2 — Make Job Copilot outcome-learning, not merely outcome-recording', '## Next executable work package'],
  'CURRENT_STATE.md': ['## Public/private evidence boundary', '## 1. Current executable/control-plane state', '## 5. Current known gaps', '## 7. Current priority'],
  'SYSTEM_MAP.md': ['## 1. System classification', '## 3. Harness/control plane', '## 6. Durable state', '## 12. Product outcome loops'],
  'AUTONOMY_CONTRACT.md': ['## AI/system may autonomously', '## Explicit approval currently required', '## Stop conditions', '## External communication boundary'],
  'BUILD_NOTES.md': ['## 2026-08-23 — Add the AI Systems Lab operating baseline'],
  'RELEASE_NOTES.md': ['## Unreleased — AI Systems Lab operating baseline', '## Release-note decision template'],
  'TRACE_SCHEMA.md': ['## Required trace fields', '## Required span fields', '## Trace vs Audit vs Failure Learning'],
  'TELEMETRY_PRIVACY.md': ['## Never record in generic traces/logs', '## Prefer'],
  'EVAL_PLAN.md': ['## Public/private eval boundary', '## 2. Core capability evals', '## 4. Product outcome evals', '## 10. Promotion gate'],
  'BASELINE_SCORECARD.md': ['## Public/private scorecard rule', '## 1. Current live conclusion', '## 2. Baseline by outcome layer', '## 6. Comparison rule'],
  'FAILURE_TAXONOMY.md': ['## Classes', '## Severity', '## Learning conversion rule'],
  'ITERATION_EVIDENCE_GATE.md': ['## Required closeout decisions', '## Material-change closeout template'],
  'MEMORY_POLICY.md': ['## What is not memory', '## Memory types', '## Outcome-learning candidates', '## Retrieval evaluation'],
  'LAB_IMPROVEMENT_LEDGER.md': ['## Entry template', '## JC-LAB-001', '## JC-LAB-002'],
  'TOOLS_AND_ENVIRONMENTS.md': ['## Environments', '## Tool / control-surface map', '## Exact current capability gap'],
  'SECURITY_THREAT_MODEL.md': ['## Protected assets', '## Primary threats and controls'],
  'RUNBOOK.md': ['## 2. Runtime incident', '## 4. Release procedure', '## 9. Closeout'],
  'ROLLBACK_POLICY.md': ['## 1. Code / deployment rollback', '## 8. Never'],
  'MONITORING_ALERTS.md': ['## 2. Outcome/invariant monitors', '## 4. Notification policy', '## 5. Product-outcome monitoring vs analytics']
};

const failures = [];
for (const [file, tokens] of Object.entries(required)) {
  const p = path.join(projectDir, file);
  if (!fs.existsSync(p)) {
    failures.push(`${file}: missing`);
    continue;
  }
  const text = fs.readFileSync(p, 'utf8');
  if (text.trim().length < 80) failures.push(`${file}: unexpectedly empty`);
  for (const token of tokens) if (!text.includes(token)) failures.push(`${file}: missing required section ${JSON.stringify(token)}`);
}

if (failures.length) {
  console.error(JSON.stringify({status: 'FAIL', projectDir, failures}, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'PASS',
  contract: 'AI-SYSTEMS-LAB-PRODUCT-BASELINE-0.5',
  projectDir,
  requiredFiles: Object.keys(required).length
}, null, 2));