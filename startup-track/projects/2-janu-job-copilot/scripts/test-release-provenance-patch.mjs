import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const projectDir = process.argv[2] || path.resolve('startup-track/projects/2-janu-job-copilot');
const patcher = path.join(projectDir, 'scripts', 'patch-release-provenance.mjs');
if (!fs.existsSync(patcher)) throw new Error('patch-release-provenance.mjs missing');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'janu-rel-prov-'));
const target = path.join(tmp, 'TrackerWorkflow.js');
fs.writeFileSync(target, `
const P12 = Object.freeze({VERSION:'1.3.8',SUITE:'p0-regression-v19'});
function iso_(){return '2026-08-23T00:00:00Z';}
function upsertWorkerState_(key,value,notes){return {key,value,notes};}
function verifyReleaseIdentity(){return true;}
`);

function runPatch(){
  const r = spawnSync(process.execPath, [patcher, tmp], {encoding:'utf8'});
  if (r.status !== 0) throw new Error(`patch failed: ${r.stderr || r.stdout}`);
  return r.stdout;
}

runPatch();
const once = fs.readFileSync(target, 'utf8');
for (const token of [
  'function releaseProvenanceValidate_(',
  'function releaseProvenanceContractSelfTest_(',
  'function recordDeploymentProvenance(',
  'function runReleaseProvenanceContractSelfTest(',
  "'deployment_git_commit'",
  "'deployment_source_sha256'",
  "'REL-PROV-1'"
]) {
  if (!once.includes(token)) throw new Error(`missing token after patch: ${token}`);
}

runPatch();
const twice = fs.readFileSync(target, 'utf8');
if (once !== twice) throw new Error('patch is not idempotent');

const syntax = spawnSync(process.execPath, ['--check', target], {encoding:'utf8'});
if (syntax.status !== 0) throw new Error(`patched source syntax invalid: ${syntax.stderr || syntax.stdout}`);

const occurrences = (twice.match(/function recordDeploymentProvenance\(/g) || []).length;
if (occurrences !== 1) throw new Error(`expected one provenance function, found ${occurrences}`);

if (/API_KEY|SECRET|PRIVATE_KEY|candidate|resume/i.test(JSON.stringify({contract:'REL-PROV-1', keys:['deployment_git_commit','deployment_source_sha256']}))) {
  throw new Error('test metadata unexpectedly contains sensitive-content marker');
}

console.log(JSON.stringify({
  status:'PASS',
  contract:'REL-PROV-PATCH-1',
  idempotent:true,
  syntax:true,
  occurrences
}, null, 2));
