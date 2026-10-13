import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir=new URL('.',import.meta.url);
const registry=JSON.parse(fs.readFileSync(new URL('eval-coverage.v1.json',dir),'utf8'));
const workflow=fs.readFileSync(new URL('../../../../.github/workflows/janu-job-copilot-governance.yml',dir),'utf8');
const ids=new Set();
for(const item of registry.cases){
 assert(item.id&&!ids.has(item.id),'Duplicate evaluation case');
 ids.add(item.id);
 assert(item.requirement&&item.evidence_boundary,'Missing requirement evidence');
 assert(workflow.includes('- name: '+item.workflow_step),'Required CI check missing: '+item.id);
 const path=new URL('../'+item.test,dir);
 assert(fs.existsSync(path),'Test source missing: '+item.id);
}
assert(registry.approval_status==='DRAFT');
assert(registry.pending_runtime.length>0);
console.log(JSON.stringify({status:'PASS',contract:'JANU-EVAL-COVERAGE-1',mapped:ids.size,unverified_runtime:registry.pending_runtime.length}));
