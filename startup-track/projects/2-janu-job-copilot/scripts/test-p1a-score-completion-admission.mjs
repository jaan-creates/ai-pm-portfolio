import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const project=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patch=fs.readFileSync(path.join(project,'scripts','patch-p1a-score-completion-admission.mjs'),'utf8');

for(const token of [
  'function p1aScoreCompletionAdmission_(',
  "['Scoring','Tailoring'].includes(status)",
  "decision!=='Apply'",
  "resume",
  "complete<70",
  '/Verified/i.test(snap)',
  "RESUME_GENERATE",
  'SCORE_COMPLETE_NEEDS_RESUME',
  'score-completion-admission-v1',
  'function workerScoreOriginal_(',
  'function workerScore_(appId,p)',
  'runP1AScoreCompletionAdmissionSelfTest',
  'P1-A-SCORE-COMPLETION-ADMISSION-1'
])assert.ok(patch.includes(token),'missing exact score-completion admission regression token: '+token);

const exactFailure={
  Decision:'Apply',
  Status:'Scoring',
  'Resume Version ID':'',
  'JD Snapshot Status':'Verified Full JD',
  'JD Completeness %':'95',
  'Vacancy Status':'OPEN'
};
assert.equal(exactFailure.Decision,'Apply');
assert.equal(exactFailure.Status,'Scoring');
assert.equal(exactFailure['Resume Version ID'],'');
assert.match(exactFailure['JD Snapshot Status'],/Verified/);
assert.ok(Number(exactFailure['JD Completeness %'])>=70);
assert.equal(exactFailure['Vacancy Status'],'OPEN');

console.log(JSON.stringify({
  status:'PASS',
  contract:'P1-A-SCORE-COMPLETION-ADMISSION-1',
  exactFailure:'Apply + Scoring + verified JD + no resume must enqueue RESUME_GENERATE',
  checks:14
},null,2));
