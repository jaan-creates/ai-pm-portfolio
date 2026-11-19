import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('Source directory required');
const files = fs.readdirSync(root).filter(name => /\.(js|gs)$/.test(name))
  .map(name => path.join(root, name))
  .filter(file => fs.readFileSync(file, 'utf8').includes('function verifyReleaseIdentity()'));
if (files.length !== 1) throw new Error('Expected one product runtime');
const file = files[0];
const original = fs.readFileSync(file, 'utf8');
const marker = 'P04-HOLD-ADMISSION-001';
let source = original;
if (!source.includes(marker)) {
  if (!source.includes('P04-WORKER-OUTCOME-UNKNOWN-001')) throw new Error('Recovery hold must be installed first');
  const replacements = [
    ["if(['queued','running','retry_wait','retry','pending'].includes(st))return Object.assign({state:'ACTIVE'},out)", "if(['queued','running','recovery_hold','retry_wait','retry','pending'].includes(st))return Object.assign({state:'ACTIVE'},out)"],
    ["&&['queued','running','succeeded'].includes(st))return", "&&['queued','running','recovery_hold','succeeded'].includes(st))return"],
    ["q.includes(\"['queued','running','succeeded'].includes(st)\")", "q.includes(\"['queued','running','recovery_hold','succeeded'].includes(st)\")"],
    ["reuses:['queued','running','succeeded']", "reuses:['queued','running','recovery_hold','succeeded']"],
    ["String(qs.queueJobId||qs.qid||'')", "String(qs.queueJobId||qs.jobId||qs.qid||'')"],
    ["['queued','running'].includes(String(latest.status||''))", "['queued','running','recovery_hold'].includes(String(latest.status||''))"],
  ];
  for (const [before, after] of replacements) {
    if (source.split(before).length - 1 !== 1) throw new Error('Hold admission anchor not unique: ' + before);
    source = source.replace(before, after);
  }
  source += `\n/* ${marker}: held outcomes remain active in every continuation and owned-admission path. */\n`;
}
if (source !== original) fs.writeFileSync(file, source);
console.log(JSON.stringify({changed: source !== original, contract: marker}));
