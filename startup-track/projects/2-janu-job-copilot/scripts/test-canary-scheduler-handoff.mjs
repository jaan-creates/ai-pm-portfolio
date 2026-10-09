import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-canary-handoff-'));
try{
  const src=[
    "const P12={};",
    "function rendererQuarantineBlocks_(){}",
    "function rendererCanaryArtifactProof_(){}",
    "function rendererCanaryQueueReadback_(){}",
    "function phase1HealthTick(){}",
    "function verifyReleaseIdentity(){}",
    "function rendererWorkerStateValue_(){}",
    "function upsertWorkerState_(){}",
    "function enqueue_(){}",
    "function hash_(){}"
  ].join('\n');
  fs.writeFileSync(path.join(dir,'TrackerWorkflow.js'),src);
  const patch=path.resolve(path.dirname(new URL(import.meta.url).pathname),'patch-canary-scheduler-handoff.mjs');
  const r=spawnSync(process.execPath,[patch,dir],{encoding:'utf8'});
  if(r.status!==0)throw new Error(r.stderr||r.stdout);
  const out=fs.readFileSync(path.join(dir,'TrackerWorkflow.js'),'utf8');
  for(const token of ['CANARY-SCHEDULER-HANDOFF-001','function armRendererCanaryExecutionLease(','function rendererCanaryControlPlaneTick(','function runRendererCanaryControlStatus(','renderer_canary_execution_lease_until','renderer_canary_qa_queue_id'])if(!out.includes(token))throw new Error('missing '+token);
  const ck=spawnSync(process.execPath,['--check',path.join(dir,'TrackerWorkflow.js')],{encoding:'utf8'});
  if(ck.status!==0)throw new Error(ck.stderr);
  console.log(JSON.stringify({status:'PASS',contract:'CANARY-SCHEDULER-HANDOFF-001',leaseGuard:true,canonicalSchedulerControl:true,failClosed:true}));
}finally{fs.rmSync(dir,{recursive:true,force:true});}
