import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const project=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patch=path.join(project,'scripts','patch-sourcing-scheduler-health.mjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sourcing-health-'));
const file=path.join(dir,'TrackerWorkflow.js');
fs.writeFileSync(file,`const P12={SHEETS:{SOURCING:'__Sourcing Runs'}};function ensureP12Sheets_(){}function SH_(){}function hm_(){}function parseDateish_(){}function now_(){}function healthSet_(){}function closeCircuit_(){}function openCircuit_(){}function upsertWorkerState_(){}function sourceFreshnessHealth_(){return true;}`);
function run(){const r=spawnSync(process.execPath,[patch,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);}
run();const once=fs.readFileSync(file,'utf8');run();const twice=fs.readFileSync(file,'utf8');if(once!==twice)throw new Error('Patch not idempotent');
for(const token of ['SOURCING-HEALTH-BLOCKER-PRECEDENCE-001','SOURCING-RECOVERY-NOT-LIVENESS-001','SOURCING_SCHEDULER_STALE',"String(trigger||'').trim()==='Daily PM Sourcing Worker'"])if(!once.includes(token))throw new Error('Missing '+token);
if(!once.includes("latestScheduled")||!once.includes("latestAnySuccess"))throw new Error('Scheduled-vs-recovery evidence missing');
if(!once.includes("recovery/manual success does not prove scheduler liveness"))throw new Error('Recovery masking prevention missing');
const helper=/function sourcingScheduledSuccess_\(status,trigger\)\{([^}]*)\}/.exec(once);if(!helper)throw new Error('Helper missing');
const f=new Function('status','trigger',helper[1]);if(!f('SUCCEEDED','Daily PM Sourcing Worker'))throw new Error('Scheduled success rejected');if(f('SUCCEEDED','Daily PM Sourcing Worker / scheduler recovery'))throw new Error('Recovery falsely counted as scheduled liveness');if(f('FAILED','Daily PM Sourcing Worker'))throw new Error('Failed scheduled run counted as success');
const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr);console.log(JSON.stringify({status:'PASS',contract:'SOURCING-RECOVERY-NOT-LIVENESS-001',scheduledSuccess:true,recoveryDoesNotClear:true,idempotent:true}));