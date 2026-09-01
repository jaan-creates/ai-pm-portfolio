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
for(const token of ['SOURCING-HEALTH-BLOCKER-PRECEDENCE-001','SOURCING-RECOVERY-NOT-LIVENESS-001','SOURCING-DATE-GAP-001','SOURCING_SCHEDULER_STALE',"String(trigger||'').trim()==='Daily PM Sourcing Worker'",'sourcing_scheduler_recent_gaps'])if(!once.includes(token))throw new Error('Missing '+token);
if(!once.includes('latestScheduled')||!once.includes('latestAnySuccess'))throw new Error('Scheduled-vs-recovery evidence missing');
if(!once.includes('recovery/manual success does not prove scheduler liveness'))throw new Error('Recovery masking prevention missing');
function extract(name){const start=once.indexOf('function '+name+'(');if(start<0)throw new Error(name+' missing');const open=once.indexOf('{',start);let d=0,q=null,e=false;for(let i=open;i<once.length;i++){const c=once[i];if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0)return once.slice(start,i+1);}throw new Error('unterminated '+name)}
const scheduled=(0,eval)('('+extract('sourcingScheduledSuccess_')+')');if(!scheduled('SUCCEEDED','Daily PM Sourcing Worker'))throw new Error('Scheduled success rejected');if(scheduled('SUCCEEDED','Daily PM Sourcing Worker / scheduler recovery'))throw new Error('Recovery falsely counted as scheduled liveness');if(scheduled('FAILED','Daily PM Sourcing Worker'))throw new Error('Failed scheduled run counted as success');
const gaps=(0,eval)('('+extract('sourcingExpectedGapDates_')+')');
const missing=gaps('2026-08-31',['2026-08-31','2026-08-25'],5);for(const d of ['2026-08-28','2026-08-27','2026-08-26'])if(!missing.includes(d))throw new Error('Expected repeated sourcing gap not detected '+d+' in '+JSON.stringify(missing));if(missing.includes('2026-08-31'))throw new Error('Successful scheduled date falsely marked missing');
const clean=gaps('2026-08-31',['2026-08-31','2026-08-28','2026-08-27','2026-08-26','2026-08-25'],5);if(clean.length)throw new Error('Clean five-weekday fixture reported gaps '+JSON.stringify(clean));
const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr);console.log(JSON.stringify({status:'PASS',contract:'SOURCING-DATE-GAP-001',scheduledSuccess:true,recoveryDoesNotClear:true,repeatedGapsDetected:missing,idempotent:true}));