import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-health-owner-starvation-'));
try{
  const src=[
    "let reconciled=0,locked=0,completed=0;",
    "function fl101OwnerValidationTick_(){return {handled:true,status:'FAILED',request:'OLD'};}",
    "function reconcileWorkerRuntimeCircuitAfterHealth_(){reconciled++;}",
    "function healthFinalReleaseLock_(){locked++;}",
    "function healthRuntimeCheckpoint_(stage){if(stage==='COMPLETE')completed++;}",
    "function phase1HealthTick(){const __healthStartedAt=Date.now();const own=fl101OwnerValidationTick_();if(own&&own.handled)return own;try{return {status:'HEALTH_CONTINUED'};}finally{try{reconcileWorkerRuntimeCircuitAfterHealth_(__healthStartedAt);healthFinalReleaseLock_();}finally{healthRuntimeCheckpoint_('COMPLETE',__healthStartedAt,'COMPLETE');}}}"
  ].join('\n');
  fs.writeFileSync(path.join(dir,'TrackerWorkflow.js'),src);
  const patch=path.resolve(path.dirname(new URL(import.meta.url).pathname),'patch-health-owner-validation-starvation.mjs');
  const r=spawnSync(process.execPath,[patch,dir],{encoding:'utf8'});
  if(r.status!==0)throw new Error(r.stderr||r.stdout);
  const out=fs.readFileSync(path.join(dir,'TrackerWorkflow.js'),'utf8');
  const ctx={};vm.createContext(ctx);
  vm.runInContext(out+";this.result=phase1HealthTick();this.state={reconciled,locked,completed};",ctx);
  if(ctx.result.status!=='HEALTH_CONTINUED')throw new Error('stale FAILED request still starved health');
  if(ctx.state.reconciled!==1||ctx.state.locked!==1||ctx.state.completed!==1)throw new Error('health finalization did not execute '+JSON.stringify(ctx.state));
  if(!out.includes('HEALTH-OWNER-VALIDATION-STARVATION-001'))throw new Error('contract marker missing');
  console.log(JSON.stringify({status:'PASS',contract:'HEALTH-OWNER-VALIDATION-STARVATION-001',state:ctx.state}));
}finally{fs.rmSync(dir,{recursive:true,force:true});}
