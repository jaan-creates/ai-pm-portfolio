import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';const project=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');const patch=fs.readFileSync(path.join(project,'scripts','patch-p1a-score-completion-admission.mjs'),'utf8');for(const token of [  'function p1aScoreCompletionAdmission_(',  "['Scoring','Tailoring'].includes(status)",  "decision!=='Apply'",  "resume",  "complete<70",  '/Verified/i.test(snap)',  "RESUME_GENERATE",  'SCORE_COMPLETE_NEEDS_RESUME',  'score-completion-admission-v1',  'function workerScoreOriginal_(',  'function workerScore_(appId,p)',  'runP1AScoreCompletionAdmissionSelfTest',  'P1-A-SCORE-COMPLETION-ADMISSION-1',  'recoverySafe:true',  'ownedAdmission:true'])assert.ok(patch.includes(token),'missing exact score-completion admission regression token: '+token);const exactFailure={  Decision:'Apply',  Status:'Scoring',  'Resume Version ID':'',  'JD Snapshot Status':'Verified Full JD',  'JD Completeness %':'50',  'Vacancy Status':'OPEN'};assert.equal(exactFailure.Decision,'Apply');assert.equal(exactFailure.Status,'Scoring');assert.equal(exactFailure['Resume Version ID'],'');assert.match(exactFailure['JD Snapshot Status'],/Verified/);assert.ok(Number(exactFailure['JD Completeness %'])<70);
const exactRecoveryEnqueue="input,{recoverySafe:true,ownedAdmission:true}";
assert.ok(patch.includes(exactRecoveryEnqueue),'score-completion RESUME_GENERATE must forward recoverySafe and ownedAdmission');
assert.match(patch,/source:'score-completion-admission-v1'.*reason:'SCORE_COMPLETE_NEEDS_RESUME'.*contract:'P1-A-SCORE-COMPLETION-ADMISSION-1'/,'score-completion recovery contract must remain bound to the owned admission');
// The health self-test must run only when the health tick is invoked. A file-scope
// call silently writes Worker State during every Apps Script execution.
const {mkdtempSync,rmSync,writeFileSync,readFileSync}=fs;
const {tmpdir}=await import('node:os');
const {execFileSync}=await import('node:child_process');
const dir=mkdtempSync(path.join(tmpdir(),'janu-score-health-'));
try{
  const fixture=[
    'const P12={};',
    'function find_(){} function obj_(){} function set_(){} function enqueue_(){} function hash_(){}',
    'function workerScore_(appId,p){return {};}',
    'function phase1HealthTick(){return true;}',
    'function verifyReleaseIdentity(){}'
  ].join('\n');
  const file=path.join(dir,'TrackerWorkflow.js');writeFileSync(file,fixture);
  const script=path.join(project,'scripts','patch-p1a-score-completion-admission.mjs');
  execFileSync(process.execPath,[script,dir]);
  const once=readFileSync(file,'utf8');
  assert.match(once,/function phase1HealthTick\(\)\{try\{runP1AScoreCompletionAdmissionSelfTest\(\);\}/);
  assert.doesNotMatch(once,/\ntry\{runP1AScoreCompletionAdmissionSelfTest\(\);\}/);
  execFileSync(process.execPath,[script,dir]);
  assert.equal(readFileSync(file,'utf8'),once,'patch must be idempotent');
}finally{rmSync(dir,{recursive:true,force:true});}
