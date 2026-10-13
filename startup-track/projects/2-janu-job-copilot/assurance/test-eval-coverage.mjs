import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir=new URL('.',import.meta.url);
const registry=JSON.parse(fs.readFileSync(new URL('eval-coverage.v1.json',dir),'utf8'));
const workflow=fs.readFileSync(new URL('../../../../.github/workflows/janu-job-copilot-governance.yml',dir),'utf8');
function verify(r,w){
 const ids=new Set();
 for(const item of r.cases){
  assert(item.id&&!ids.has(item.id),'Duplicate evaluation case');
  ids.add(item.id);
  assert(item.requirement&&item.evidence_boundary,'Missing requirement evidence');
  assert(item.workflow_step&&item.test_type !== 'RUNTIME','Every mapped case must name a CI step and remain source-level');
  assert(/synthetic|fixture|source|schema|contract/i.test(item.evidence_boundary),'Evidence boundary must be explicit');
  assert(w.includes('- name: '+item.workflow_step),'Required CI check missing: '+item.id);
  assert(!item.test.includes('..')&&!item.test.startsWith('/'),'Unsafe test path');
  assert(fs.existsSync(new URL('../'+item.test,dir)),'Test source missing: '+item.id);
 }
 assert(r.approval_status==='DRAFT','Unapproved case registry promoted');
 assert(r.pending_runtime.length>0,'Runtime gaps silently removed');
 return ids.size;
}
const mapped=verify(registry,workflow);
let negatives=0;
const reject=(r,w)=>{assert.throws(()=>verify(r,w));negatives++;};
const duplicate=structuredClone(registry);duplicate.cases[1].id=duplicate.cases[0].id;reject(duplicate,workflow);
const emptyBoundary=structuredClone(registry);emptyBoundary.cases[0].evidence_boundary='';reject(emptyBoundary,workflow);
const missingStep=structuredClone(registry);missingStep.cases[0].workflow_step='Nonexistent step';reject(missingStep,workflow);
const missingFile=structuredClone(registry);missingFile.cases[0].test='scripts/not-present.mjs';reject(missingFile,workflow);
const absentRuntime=structuredClone(registry);absentRuntime.pending_runtime=[];reject(absentRuntime,workflow);
const premature=structuredClone(registry);premature.approval_status='PASS';reject(premature,workflow);
console.log(JSON.stringify({status:'PASS',contract:'JANU-EVAL-COVERAGE-1',mapped,negative_controls_detected:negatives,unverified_runtime:registry.pending_runtime.length}));

const runtimeMislabel=structuredClone(registry);runtimeMislabel.cases[0].evidence_boundary='runtime verified';reject(runtimeMislabel,workflow);
