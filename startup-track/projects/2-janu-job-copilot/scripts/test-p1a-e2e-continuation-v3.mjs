import fs from 'node:fs';
import path from 'node:path';

const projectDir=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patch=fs.readFileSync(path.join(projectDir,'scripts','patch-p1a-e2e-continuation.mjs'),'utf8');
const shim=fs.readFileSync(path.join(projectDir,'scripts','patch-e2e-downstream-continuation.mjs'),'utf8');

const must=[
  "P1-A-E2E-CONTINUATION-3",
  "for(let r=q.getLastRow();r>=2;r--)",
  "closedCount++;continue",
  "STALE_VERIFYING_JD_TO_TAILORING",
  "QA_REPAIR_RESUME_ENQUEUED",
  "QA_ENQUEUED",
  "RESUME_ENQUEUED",
  "latest terminal state wins"
];
for(const token of must)if(!patch.includes(token))throw new Error('missing '+token);
if(patch.includes("return{status:'CLOSED_PROPAGATED'"))throw new Error('closed vacancy must not starve later rows');
for(const token of ["P1-E-SHIM-3","P1-A-E2E-CONTINUATION-3","acceptsV3:true","downgrade:false"])if(!shim.includes(token))throw new Error('continuation compatibility regression missing '+token);
if(shim.includes("for(const token of ['function p1aQueueWorkerState_(','function p1aTailoringNeedsResume_(','P1-A-E2E-CONTINUATION-2']"))throw new Error('shim still hard-requires obsolete continuation v2');
console.log(JSON.stringify({status:'PASS',contract:'P1-A-E2E-CONTINUATION-3',starvationGuard:true,latestQueueState:true,qaRepair:true,staleStateRepair:true,compatibilityShim:'P1-E-SHIM-3',noVersionDowngrade:true},null,2));
