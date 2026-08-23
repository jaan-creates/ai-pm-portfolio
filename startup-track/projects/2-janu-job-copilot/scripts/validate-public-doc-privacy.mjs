import fs from 'node:fs';
import path from 'node:path';

const projectDir = process.argv[2] || path.resolve('startup-track/projects/2-janu-job-copilot');

const governedDocs = [
  'PRODUCT.md',
  'CURRENT_STATE.md',
  'SYSTEM_MAP.md',
  'AUTONOMY_CONTRACT.md',
  'BUILD_NOTES.md',
  'TRACE_SCHEMA.md',
  'TELEMETRY_PRIVACY.md',
  'EVAL_PLAN.md',
  'BASELINE_SCORECARD.md',
  'FAILURE_TAXONOMY.md',
  'ITERATION_EVIDENCE_GATE.md',
  'MEMORY_POLICY.md',
  'LAB_IMPROVEMENT_LEDGER.md'
];

const checks = [
  {
    name: 'email-address',
    re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    allow: new Set([])
  },
  {
    name: 'phone-like-number',
    re: /(?:\+?\d[\d\s().-]{8,}\d)/g,
    allow: new Set([])
  },
  {
    name: 'private-application-id',
    re: /\b20\d{2}-\d{2}-\d{2}-\d{3}\b/g,
    allow: new Set([])
  }
];

const failures = [];
for (const file of governedDocs) {
  const p = path.join(projectDir, file);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, 'utf8');
  for (const check of checks) {
    for (const match of text.matchAll(check.re)) {
      if (!check.allow.has(match[0])) {
        failures.push({file, type: check.name, value: match[0]});
      }
    }
  }
}

if (failures.length) {
  console.error(JSON.stringify({
    status: 'FAIL',
    contract: 'PUBLIC-DOC-PRIVACY-1',
    message: 'Potential private tracker/user data found in public governance docs. Replace with an opaque reference or privacy-safe aggregate.',
    failures
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({status: 'PASS', contract: 'PUBLIC-DOC-PRIVACY-1', checkedFiles: governedDocs.length}, null, 2));