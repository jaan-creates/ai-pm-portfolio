import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const project=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patch=fs.readFileSync(path.join(project,'scripts','patch-owned-apply-admission.mjs'),'utf8');
assert.match(patch,/owned-apply-edit/);
assert.match(patch,/OWNED-APPLY-STATE-MATRIX-001/);
assert.match(patch,/recoverySafe:true/);
assert.match(patch,/queueMutationAllowed_\(options\)!==true/);
assert.match(patch,/input,\{recoverySafe:true\}\)/);
assert.match(patch,/function ownedEnsureQueueAdmission_\(id,worker,payload,input,opts\)/);
assert.match(patch,/enqueue_\(id,worker,payload,input,opts\)/);
assert.match(patch,/mapReady/);
assert.match(patch,/!mapReady/);
assert.match(patch,/has_\(JC\.S\.MAP,id\)/);
assert.match(patch,/\['New','Scoring'\]\.includes\(status\)/);
console.log(JSON.stringify({status:'PASS',contract:'P1-A-OWNED-APPLY-ADMISSION-1',checks:11,evidence_boundary:'source-level regression; live queue readback remains required'}));
