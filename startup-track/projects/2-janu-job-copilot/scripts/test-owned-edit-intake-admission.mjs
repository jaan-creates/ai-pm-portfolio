import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const project=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patch=path.join(project,'scripts','patch-owned-edit-intake-admission.mjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'owned-edit-'));
const f=path.join(dir,'TrackerWorkflow.js');
fs.writeFileSync(f,`const P12={VERSION:'1.3.8'};function enqueue_(){}function hash_(){}function upsertWorkerState_(){}function p1aQueueWorkerState_(){return{state:'NONE'}}function phase1OnEdit(e){return e;}function verifyReleaseIdentity(){}`);
function run(){const r=spawnSync(process.execPath,[patch,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);return r.stdout;}
run();const once=fs.readFileSync(f,'utf8');run();const twice=fs.readFileSync(f,'utf8');if(once!==twice)throw new Error('Patch not idempotent');
for(const t of ['OWNED-EDIT-INTAKE-001','OWNED-EDIT-APPLY-001','OWNED-EDIT-WAKEUP-001','function ownedSourceIntakeBootstrap_(','function ownedApplyAdmission_(','if(ownedImmediateEditContract_(e))return'])if(!once.includes(t))throw new Error('Missing '+t);
if(!once.includes("'Processing Status':'Queued for verification'"))throw new Error('Sources Inbox does not initialize processing status');
if(!once.includes("'Captured By':'Janu'")||!once.includes("'Candidate Intent':'Apply'"))throw new Error('Sources Inbox bootstrap fields incomplete');
if(!once.includes("enqueue_(id,'JD_RETRIEVE'")||!once.includes("enqueue_(id,'RESUME_GENERATE'"))throw new Error('Apply admission does not schedule system work');
if(!once.includes("'yyyy-MM-dd HH:mm'")||!once.includes("+' IST'"))throw new Error('Operator timestamp format not canonicalized');
const ck=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr);
console.log(JSON.stringify({status:'PASS',contract:'OWNED-EDIT-WAKEUP-001',intakeBootstrap:true,applyAdmission:true,timestampFormat:'yyyy-MM-dd HH:mm IST',idempotent:true}));