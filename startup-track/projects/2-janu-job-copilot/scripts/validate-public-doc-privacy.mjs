import fs from 'node:fs';
import path from 'node:path';

const projectDir = process.argv[2] || path.resolve('startup-track/projects/2-janu-job-copilot');

const governedDocs = [
  'PRODUCT.md',
  'OUTCOME_MODEL.md',
  'PRODUCT_CAPABILITY_MAP.md',
  'EXECUTION_ROADMAP.md',
  'CURRENT_STATE.md',
  'SYSTEM_MAP.md',
  'AUTONOMY_CONTRACT.md',
  'BUILD_NOTES.md',
  'RELEASE_NOTES.md',
  'TRACE_SCHEMA.md',
  'TELEMETRY_PRIVACY.md',
  'EVAL_PLAN.md',
  'BASELINE_SCORECARD.md',
  'FAILURE_TAXONOMY.md',
  'ITERATION_EVIDENCE_GATE.md',
  'MEMORY_POLICY.md',
  'LAB_IMPROVEMENT_LEDGER.md',
  'TOOLS_AND_ENVIRONMENTS.md',
  'SECURITY_THREAT_MODEL.md',
  'RUNBOOK.md',
  'ROLLBACK_POLICY.md',
  'MONITORING_ALERTS.md'
];

function looksLikeStructuredProjectId(text, match) {
  const start = match.index ?? 0;
  const value = match[0];
  const prefix = text.slice(Math.max(0, start - 24), start);
  const suffix = text.slice(start + value.length, start + value.length + 16);
  // Canonical governance/change IDs contain a YYYYMMDD sequence plus a short
  // ordinal, e.g. CS-20260824-033. The phone regex sees only the numeric tail.
  // Treat those as identifiers only when the surrounding source has an explicit
  // project-ID prefix. Raw 10+ digit strings still fail closed as phone-like.
  const idPrefix = /(?:^|[^A-Z0-9])(?:CS|FL|REG|REL|TRACE|DEPLOY|OP|Q|INT|E2E|PDF|MYACTION|SUBMIT|RENDER|QUEUE|HEALTH|IDENTITY)-$/i;
  if (idPrefix.test(prefix) && /^20\d{6}-\d{2,6}(?:\b|[-_])/i.test(value + suffix)) return true;
  return false;
}

const checks = [
  {
    name: 'email-address',
    re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    allow: () => false
  },
  {
    // Require at least ten digits while allowing common separators. This avoids
    // flagging ordinary ISO dates such as 2026-08-23. Context is inspected so
    // canonical project/change identifiers do not become false phone positives.
    name: 'phone-like-number',
    re: /\+?\d(?:[\s().-]*\d){9,}/g,
    allow: (text, match) => looksLikeStructuredProjectId(text, match)
  },
  {
    name: 'private-application-id',
    re: /\b20\d{2}-\d{2}-\d{2}-\d{3}\b/g,
    allow: () => false
  }
];

const failures = [];
for (const file of governedDocs) {
  const p = path.join(projectDir, file);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, 'utf8');
  for (const check of checks) {
    for (const match of text.matchAll(check.re)) {
      if (!check.allow(text, match)) {
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