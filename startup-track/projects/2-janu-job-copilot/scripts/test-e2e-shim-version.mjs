import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const project=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const script=path.join(project,'scripts','patch-e2e-downstream-continuation.mjs');
function run(version){
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'janu-e2e-shim-'));
  try{
    const marker=version?`// P1-A-E2E-CONTINUATION-${version}\n`:'';
    const source=`const P12=Object.freeze({VERSION:'1.3.8'});\nfunction verifyReleaseIdentity(){}\nfunction p1aQueueWorkerState_(){}\nfunction p1aTailoringNeedsResume_(){}\n${marker}`;
    const file=path.join(tmp,'TrackerWorkflow.js');
    fs.writeFileSync(file,source);
    const result=spawnSync(process.execPath,[script,tmp],{encoding:'utf8'});
    assert.equal(fs.readFileSync(file,'utf8'),source,'compatibility shim must not mutate source');
    return result;
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
for(const v of [2,3]){
  const r=run(v);
  assert.equal(r.status,0,`recognized v${v} must pass: ${r.stderr}`);
  const o=JSON.parse(r.stdout);
  assert.equal(o.authoritativeContract,`P1-A-E2E-CONTINUATION-${v}`);
}
const invalid=run(null);
assert.notEqual(invalid.status,0,'unrecognized continuation must fail closed');
assert.match(invalid.stderr,/Recognized authoritative E2E continuation contract/);
console.log(JSON.stringify({status:'PASS',contract:'P1-E-SHIM-3',approvedVersions:[2,3],missingContractRejected:true,nonMutating:true}));
