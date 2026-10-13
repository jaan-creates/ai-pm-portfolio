import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const project=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const shim=fs.readFileSync(path.join(project,'scripts','patch-e2e-downstream-continuation.mjs'),'utf8');
assert.match(shim,/P1-A-E2E-CONTINUATION-2/);
assert.match(shim,/P1-A-E2E-CONTINUATION-3/);
assert.match(shim,/P1-A-E2E-CONTINUATION-4/);
assert.match(shim,/supportedContracts/);
console.log(JSON.stringify({status:'PASS',contract:'P1-E-SHIM-COMPATIBILITY-001',checks:4,evidence_boundary:'source-level compatibility regression; deployment proof remains separate'}));
