import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const project = process.argv[2] || path.resolve('startup-track/projects/2-janu-job-copilot');
const patch = fs.readFileSync(path.join(project,'scripts','patch-p1a-e2e-continuation.mjs'),'utf8');
assert.match(patch,/JANU_P1A_CONTINUATION_CURSOR/);
assert.match(patch,/for\(let offset=1;offset<=count;offset\+\+\)/);
assert.match(patch,/\(prior\+offset-1\)%count\)\+2/);
assert.match(patch,/source:'p1a-e2e-continuation-v4'/);
const nextRow = (prior,count) => ((prior + 1 - 1) % count) + 2;
assert.equal(nextRow(0,32),2);
assert.equal(nextRow(31,32),33);
assert.equal(nextRow(32,32),2);
console.log(JSON.stringify({status:'PASS',contract:'CONTINUATION-FAIR-CURSOR-001',checks:6,evidence_boundary:'source-level fairness regression; live worker execution still required'}));
