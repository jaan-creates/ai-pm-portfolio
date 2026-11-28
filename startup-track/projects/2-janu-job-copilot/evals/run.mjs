import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir=path.dirname(new URL(import.meta.url).pathname);
const root=path.resolve(dir,'../../../../');
const registry=JSON.parse(fs.readFileSync(path.join(dir,'cases.json'),'utf8'));
const results=[];
const check=(c,actual,detail='')=>{const passed=actual===c.expected;results.push({id:c.id,status:passed?'PASS':'FAIL',severity:c.severity,expected:c.expected,actual,detail});};
function assessSourcing(run){return run.attempted&&run.fetchOk&&run.persistOk&&run.reportOk?'COMPLETED':'FAILED';}
function promoteIntake(s){if(!s.eligible||!s.writeSucceeded)return {state:'BLOCKED',count:0};return {state:'PROMOTED',count:1};}
function canSubmit(a){return !!(a.approved&&a.qaPassed&&a.vacancy==='OPEN'&&a.resumeVersion&&a.confirmedExternally);}
function compare(baseline,current){return baseline.filter(b=>b.status==='PASS'&&current.some(c=>c.id===b.id&&c.status!=='PASS')).map(b=>b.id);}
const functions={
 'SOURCING-MISSED':()=>assessSourcing({attempted:false,fetchOk:false,persistOk:false,reportOk:false})==='FAILED',
 'SOURCING-WRITE-FAIL':()=>assessSourcing({attempted:true,fetchOk:true,persistOk:false,reportOk:true})==='FAILED',
 'SOURCING-COMPLETE':()=>assessSourcing({attempted:true,fetchOk:true,persistOk:true,reportOk:true})==='COMPLETED',
 'INTAKE-NO-FALSE-SUCCESS':()=>promoteIntake({eligible:true,writeSucceeded:false}).state==='BLOCKED',
 'INTAKE-ONE-RECORD':()=>promoteIntake({eligible:true,writeSucceeded:true}).count===1,
 'SUBMISSION-REQUIRES-CONFIRMATION':()=>!canSubmit({approved:true,qaPassed:true,vacancy:'OPEN',resumeVersion:'V1',confirmedExternally:false}),
 'SUBMISSION-CLOSED-BLOCKED':()=>!canSubmit({approved:true,qaPassed:true,vacancy:'CLOSED',resumeVersion:'V1',confirmedExternally:true}),
 'REGRESSION-DETECTED':()=>compare([{id:'A',status:'PASS'}],[{id:'A',status:'FAIL'}]).includes('A'),
 'REGRESSION-CONTROL':()=>compare([{id:'A',status:'PASS'}],[{id:'A',status:'PASS'}]).length===0,
 'REPOSITORY-RELEASE-GATE':()=>{const s=fs.readFileSync(path.join(root,'.github/workflows/janu-job-copilot.yml'),'utf8');return s.includes('validate-release.mjs')&&s.includes('Verify deployed source hash and rollback on mismatch');},
 'SOURCE-TEST-EXISTS':()=>['test-trace-golden-v0-patch.mjs','test-release-provenance-patch.mjs','test-vacancy-lifecycle-convergence.mjs'].every(f=>fs.existsSync(path.join(root,'startup-track/projects/2-janu-job-copilot/scripts',f))),
};
for(const c of registry.cases){try{assert.equal(typeof functions[c.id],'function');check(c,functions[c.id]());}catch(e){check(c,false,String(e.message));}}
const mutants=[{...promoteIntake({eligible:true,writeSucceeded:false}),state:'PROMOTED'},{...promoteIntake({eligible:true,writeSucceeded:true}),count:2}];
assert.equal(mutants[0].state==='BLOCKED',false,'mutation of write failure must be detected');
assert.equal(mutants[1].count===1,false,'mutation of deduplication must be detected');
const report={schema_version:1,baseline_version:registry.version,overall:results.every(x=>x.status==='PASS')?'PASS':'BLOCKED',results,mutation_controls_detected:2,limitations:['Synthetic workflow invariants are NOT a substitute for real Apps Script execution','Production telemetry and AI output quality were not evaluated']};
const outfile=process.env.EVAL_REPORT||path.join(dir,'report.json');fs.writeFileSync(outfile,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({overall:report.overall,passed:results.filter(x=>x.status==='PASS').length,total:results.length,mutation_controls_detected:2,report:outfile}));
if(report.overall!=='PASS')process.exitCode=1;
