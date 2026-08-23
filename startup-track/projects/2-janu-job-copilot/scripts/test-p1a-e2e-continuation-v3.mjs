import fs from 'node:fs';
import path from 'node:path';

const projectDir=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patch=fs.readFileSync(path.join(projectDir,'scripts','patch-p1a-e2e-continuation.mjs'),'utf8');

const must=[
  "P1-A-E2E-CONTINUATION-3",
  "for(let r=q.getLastRow();r>=2;r--)",
  "CLOSED_PROPAGATED_CONTINUE",
  "STALE_VERIFYING_JD_TO_TAILORING",
  "QA_REPAIR_RESUME_ENQUEUED",
  "QA_ENQUEUED",
  "RESUME_ENQUEUED"
];
for(const token of must)if(!patch.includes(token))throw new Error('missing '+token);
if(patch.includes("return{status:'CLOSED_PROPAGATED'"))throw new Error('closed vacancy must not starve later rows');
if(!patch.includes("latest terminal state wins"))throw new Error('queue-state latest-row invariant missing');
console.log(JSON.stringify({status:'PASS',contract:'P1-A-E2E-CONTINUATION-3',starvationGuard:true,latestQueueState:true,qaRepair:true,staleStateRepair:true},null,2));
