import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const project=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const base=path.join(project,'scripts','patch-owned-edit-intake-admission.mjs');
const patch=path.join(project,'scripts','patch-owned-apply-state-matrix.mjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'owned-apply-matrix-'));
const f=path.join(dir,'TrackerWorkflow.js');
fs.writeFileSync(f,`const P12={VERSION:'1.3.8'};const JC={S:{Q:'__Processing Queue'}};function enqueue_(){return'Q-1'}function hash_(){return'h'}function upsertWorkerState_(){}function p1aQueueWorkerState_(){return{state:'NONE'}}function SH_(){return{getLastRow(){return 2},getLastColumn(){return 1},getRange(){return{getDisplayValues(){return[['x']]},getDisplayValue(){return''},setValue(){return this}}}}}function hm_(){return{'Queue Job ID':1,'Application ID':2,'Worker Type':3,'Status':4}}function phase1OnEdit(e){return e;}function verifyReleaseIdentity(){}`);
for(const p of [base,patch]){const r=spawnSync(process.execPath,[p,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);}
const s=fs.readFileSync(f,'utf8');
for(const t of ["status:'Verifying JD',worker:'JD_RETRIEVE'","status:'Scoring',worker:'JD_PARSE_SCORE_MAP'","status:'Tailoring',worker:'RESUME_GENERATE'","status:'QA',worker:'QA_FINALIZE'","status:'Resume Review',worker:''","OWNED-APPLY-QUEUE-PROOF-001","DETERMINISTIC:OWNED_APPLY_QUEUE_ADMISSION_EMPTY","DETERMINISTIC:OWNED_APPLY_QUEUE_READBACK_FAILED"])if(!s.includes(t))throw new Error('Missing matrix proof '+t);
if(!s.includes("const plan=ownedApplyStatePlan_(state)"))throw new Error('Apply admission does not use state matrix');
if(!s.includes("if(plan.worker)"))throw new Error('Apply worker admission not explicit');
const writeAt=s.indexOf("const writes={'Status':plan.status");const admitAt=s.indexOf('ownedEnsureQueueAdmission_(id,plan.worker');if(admitAt<0||writeAt<0||admitAt>writeAt)throw new Error('Visible state is written before queue admission proof');
const ck=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr);
console.log(JSON.stringify({status:'PASS',contract:'OWNED-APPLY-STATE-MATRIX-001',cases:6,jdRetrieve:true,jdScore:true,resumeGenerate:true,qaFinalize:true,resumeReview:true,queueBeforeVisibleState:true}));
