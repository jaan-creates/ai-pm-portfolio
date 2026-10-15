import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{
  const t=fs.readFileSync(path.join(root,f),'utf8');
  return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');
});
if(!target) throw new Error('TrackerWorkflow source not found');

const file=path.join(root,target);
let s=fs.readFileSync(file,'utf8');
const before=s;
const anchor='function verifyReleaseIdentity()';
const oldCall=/ownedEnsureQueueAdmission_\(\s*id\s*,\s*plan\.worker\s*,\s*\{\s*source:\s*['"]owned-apply-edit['"]\s*,\s*reason:\s*plan\.reason\s*,\s*contract:\s*['"]OWNED-APPLY-STATE-MATRIX-001['"]\s*\}\s*,\s*input\s*\)/;
const replacement="ownedEnsureQueueAdmission_(id,plan.worker,{source:'owned-apply-edit',reason:plan.reason,contract:'OWNED-APPLY-STATE-MATRIX-001',recoverySafe:true},input)";
if(!oldCall.test(s)) throw new Error('Owned Apply admission call not found; refusing an unsafe broad replacement');
s=s.replace(oldCall,replacement);

function insertBeforeAnchor_(code){
  const i=s.indexOf(anchor);
  if(i<0) throw new Error('release identity anchor missing');
  s=s.slice(0,i)+code+'\n'+s.slice(i);
}
if(!s.includes('function p1aOwnedApplyAdmissionSelfTest_(')){
  insertBeforeAnchor_(`function p1aOwnedApplyAdmissionSelfTest_(){const probe={source:'owned-apply-edit',reason:'probe',contract:'OWNED-APPLY-STATE-MATRIX-001',recoverySafe:true};if(typeof queueMutationAllowed_!=='function'||queueMutationAllowed_(probe)!==true)throw new Error('P1-A owned Apply admission safety contract failed');return{pass:true,contract:'P1-A-OWNED-APPLY-ADMISSION-1',recoverySafe:true};}
function runP1AOwnedApplyAdmissionSelfTest(){const x=p1aOwnedApplyAdmissionSelfTest_();upsertWorkerState_('p1a_owned_apply_admission_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));return x;}`);
}
if(!s.includes("ownedEnsureQueueAdmission_(id,plan.worker,{source:'owned-apply-edit',reason:plan.reason,contract:'OWNED-APPLY-STATE-MATRIX-001',recoverySafe:true},input)")) throw new Error('Owned Apply admission safety marker missing after patch');
if(!s.includes('function runP1AOwnedApplyAdmissionSelfTest(')) throw new Error('Owned Apply admission regression self-test missing');
if(s!==before) fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:'P1-A-OWNED-APPLY-ADMISSION-1',recoverySafe:true},null,2));
