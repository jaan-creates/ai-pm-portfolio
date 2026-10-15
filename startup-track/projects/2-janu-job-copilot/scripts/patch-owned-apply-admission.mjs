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
const replacement="ownedEnsureQueueAdmission_(id,plan.worker,{source:'owned-apply-edit',reason:plan.reason,contract:'OWNED-APPLY-STATE-MATRIX-001'},input,{recoverySafe:true})";
const oldCall=/ownedEnsureQueueAdmission_\(\s*id\s*,\s*plan\.worker\s*,\s*\{\s*source:\s*['"]owned-apply-edit['"]\s*,\s*reason:\s*plan\.reason\s*,\s*contract:\s*['"]OWNED-APPLY-STATE-MATRIX-001['"]\s*(?:,\s*recoverySafe\s*:\s*true\s*)?\}\s*,\s*input\s*(?:,\s*\{\s*recoverySafe\s*:\s*true\s*\})?\s*\)/;
if(!s.includes(replacement)){
  if(!oldCall.test(s)) throw new Error('Owned Apply admission call not found; refusing an unsafe broad replacement');
  s=s.replace(oldCall,replacement);
}

const helperSignature=/function ownedEnsureQueueAdmission_\(id,worker,payload,input\)/;
const helperCall=/const qid=enqueue_\(id,worker,payload,input\)\|\|'';/;
const helperReplacement="function ownedEnsureQueueAdmission_(id,worker,payload,input,opts)";
const helperCallReplacement="const qid=enqueue_(id,worker,payload,input,opts)||'';";
if(!s.includes(helperReplacement)){
  if(!helperSignature.test(s)||!helperCall.test(s)) throw new Error('Owned Apply queue helper boundary not found; refusing an unsafe broad replacement');
  s=s.replace(helperSignature,helperReplacement).replace(helperCall,helperCallReplacement);
}

function insertBeforeAnchor_(code){
  const i=s.indexOf(anchor);
  if(i<0) throw new Error('release identity anchor missing');
  s=s.slice(0,i)+code+'\n'+s.slice(i);
}
if(!s.includes('function p1aOwnedApplyAdmissionSelfTest_(')){
  insertBeforeAnchor_(`function p1aOwnedApplyAdmissionSelfTest_(){const probe={source:'owned-apply-edit',reason:'probe',contract:'OWNED-APPLY-STATE-MATRIX-001'};const options={recoverySafe:true};if(typeof queueMutationAllowed_!=='function'||queueMutationAllowed_(options)!==true)throw new Error('P1-A owned Apply admission safety contract failed');if(typeof ownedEnsureQueueAdmission_!=='function'||!String(ownedEnsureQueueAdmission_).includes('enqueue_(id,worker,payload,input,opts)'))throw new Error('P1-A owned Apply helper forwarding contract failed');return{pass:true,contract:'P1-A-OWNED-APPLY-ADMISSION-1',recoverySafe:true,optionsArgument:'fifth',helperForwardsOptions:true};}
function runP1AOwnedApplyAdmissionSelfTest(){const x=p1aOwnedApplyAdmissionSelfTest_();upsertWorkerState_('p1a_owned_apply_admission_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));return x;}`);
}
if(!s.includes(replacement)) throw new Error('Owned Apply fifth-argument caller marker missing after patch');
if(!s.includes(helperReplacement)) throw new Error('Owned Apply helper options signature missing after patch');
if(!s.includes(helperCallReplacement)) throw new Error('Owned Apply helper options forwarding missing after patch');
if(!s.includes('function runP1AOwnedApplyAdmissionSelfTest(')) throw new Error('Owned Apply admission regression self-test missing');
if(s!==before) fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:'P1-A-OWNED-APPLY-ADMISSION-1',recoverySafe:true,optionsArgument:'fifth',helperForwardsOptions:true},null,2));
