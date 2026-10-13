import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const project=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const validator=fs.readFileSync(path.join(project,'scripts','validate-release.mjs'),'utf8');
assert.match(validator,/phase1HealthTick\\\\\\\\s\+phase1HealthTick|phase1HealthTick\\\\s\+/);
assert.match(validator,/processOperatorCommand_/);
assert.match(validator,/phase1HealthTick contract missing/);
console.log(JSON.stringify({status:'PASS',contract:'RELEASE-VALIDATOR-HOOK-001',checks:3,evidence_boundary:'source-level validator regression; live deployment remains separate'}));
