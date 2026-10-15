import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const project=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const validator=fs.readFileSync(path.join(project,'scripts','validate-release.mjs'),'utf8');
assert.ok(validator.includes("function\\s+phase1HealthTick"));
assert.ok(validator.includes("controlPlaneExecutionAuthorized_()"));
assert.ok(validator.includes("phase1HealthTick safety contract missing"));
assert.ok(validator.includes("phase1HealthTick contract missing"));
console.log(JSON.stringify({status:'PASS',contract:'RELEASE-VALIDATOR-HOOK-001',checks:3,evidence_boundary:'source-level validator regression; live deployment remains separate'}));
