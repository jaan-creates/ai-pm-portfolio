import fs from 'node:fs';
import path from 'node:path';

const projectDir = process.argv[2] || path.resolve('startup-track/projects/2-janu-job-copilot');

const required = {
  'PRODUCT.md': ['## Primary user outcome', '## Success dimensions', '## Sources of truth'],
  'CURRENT_STATE.md': ['## 1. Current executable/control-plane state', '## 5. Current known gaps'],
  'SYSTEM_MAP.md': ['## 1. System classification', '## 3. Harness/control plane', '## 6. Durable state'],
  'AUTONOMY_CONTRACT.md': ['## AI/system may autonomously', '## Explicit approval currently required', '## Stop conditions'],
  'BUILD_NOTES.md': ['## 2026-08-23 — Add the AI Systems Lab operating baseline'],
  'TRACE_SCHEMA.md': ['## Required trace fields', '## Required span fields', '## Trace vs Audit vs Failure Learning'],
  'TELEMETRY_PRIVACY.md': ['## Never record in generic traces/logs', '## Prefer'],
  'EVAL_PLAN.md': ['## 2. Core capability evals', '## 9. Promotion gate'],
  'BASELINE_SCORECARD.md': ['## 1. Current live snapshot', '## 2. Baseline by dimension', '## 5. Comparison rule'],
  'FAILURE_TAXONOMY.md': ['## Classes', '## Severity', '## Learning conversion rule'],
  'ITERATION_EVIDENCE_GATE.md': ['## Required closeout decisions', '## Material-change closeout template'],
  'MEMORY_POLICY.md': ['## What is not memory', '## Memory types', '## Retrieval evaluation'],
  'LAB_IMPROVEMENT_LEDGER.md': ['## Entry template', '## JC-LAB-001']
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