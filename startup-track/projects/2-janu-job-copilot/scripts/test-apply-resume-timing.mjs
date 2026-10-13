import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const project = process.argv[2] || path.resolve('startup-track/projects/2-janu-job-copilot');
const patch = fs.readFileSync(path.join(project,'scripts','patch-p1a-e2e-continuation.mjs'),'utf8');

assert.match(patch,/function p1aJdCompletenessPercent_\(a\)/);
assert.match(patch,/raw>0&&raw<=1\?raw\*100:raw/);
assert.match(patch,/p1aJdCompletenessPercent_\(a\)>=70/);
assert.match(patch,/Resume Ready At/);
assert.match(patch,/Resume Turnaround Minutes/);
assert.match(patch,/p1aApplyToReadyMinutes_/);
assert.match(patch,/'JD Completeness %':0\.5/);

const ratio = (raw) => raw > 0 && raw <= 1 ? raw * 100 : raw;
const elapsed = (start,end) => Math.round((Date.parse(end)-Date.parse(start))/60000);
assert.equal(ratio(0.5),50);
assert.equal(ratio(85),85);
assert.equal(elapsed('2026-10-13T07:00:00Z','2026-10-13T07:45:00Z'),45);
assert.equal(elapsed('2026-10-13T07:00:00Z','2026-10-13T06:45:00Z'),-15);

console.log(JSON.stringify({
  status:'PASS',
  contract:'APPLY-RESUME-TIMING-001',
  checks:11,
  evidence_boundary:'source-level regression; live queue and artifact readback still required'
}));
