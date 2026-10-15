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

const planSignature=/function ownedApplyStatePlan_\(a\)\{const vacancy=String\(a\.vacancy\|\|' '\)\.toUpperCase\(\),snap=String\(a\.snap\|\|''\),complete=Number\(a\.complete\|\|0\),fit=Number\(a\.fit\|\|0\),resume=/;
const planSignatureFallback=/function ownedApplyStatePlan_\(a\)\{const vacancy=String\(a\.vacancy\|\|''\)\.toUpperCase\(\),snap=String\(a\.snap\|\|''\),complete=Number\(a\.complete\|\|0\),fit=Number\(a\.fit\|\|0\),resume=/;
const planReplacement="function ownedApplyStatePlan_(a){const vacancy=String(a.vacancy||'').toUpperCase(),snap=String(a.snap||''),complete=Number(a.complete||0),fit=Number(a.fit||0),jdReady=!!a.jdReady,mapReady=!!a.mapReady,resume=";
if(!s.includes("jdReady=!!a.jdReady")){
  const planWithMap=/function ownedApplyStatePlan_\(a\)\{const vacancy=String\(a\.vacancy\|\|''\)\.toUpperCase\(\),snap=String\(a\.snap\|\|''\),complete=Number\(a\.complete\|\|0\),fit=Number\(a\.fit\|\|0\),mapReady=!!a\.mapReady,resume=/;
  if(!planWithMap.test(s)) throw new Error('Owned Apply state planner not found; refusing an unsafe broad replacement');
  s=s.replace(planWithMap,planReplacement);
}
const jdGate="if(!/Verified Full JD/i.test(snap)||complete<70||!jdReady)return{status:'Verifying JD',worker:'JD_RETRIEVE',reason:'APPLY_NEEDS_JD'};";
if(!s.includes(jdGate)){
  const oldJdGate="if(!/Verified Full JD/i.test(snap)||complete<70)return{status:'Verifying JD',worker:'JD_RETRIEVE',reason:'APPLY_NEEDS_JD'};";
  if(!s.includes(oldJdGate)) throw new Error('Owned Apply JD gate not found; refusing an unsafe broad replacement');
  s=s.replace(oldJdGate,jdGate);
}
const mapGate="if(!(fit>0)||!mapReady)return{status:'Scoring',worker:'JD_PARSE_SCORE_MAP',reason:'APPLY_NEEDS_SCORE_MAP'};";
if(!s.includes(mapGate)){
  if(!s.includes(fitGate)) throw new Error('Owned Apply score gate not found; refusing an unsafe broad replacement');
  s=s.replace(fitGate,mapGate);
}
const scoreAdmissionOld="return ['New','Apply'].includes(decision)&&status==='Scoring'&&c>=70&&/Full JD|Partial JD/.test(js);";
const scoreAdmissionNew="return ['New','Apply'].includes(decision)&&['New','Scoring'].includes(status)&&c>=70&&/Full JD|Partial JD/.test(js);";
if(!s.includes(scoreAdmissionNew)){
  if(!s.includes(scoreAdmissionOld)) throw new Error('Owned Apply scoring admission gate not found; refusing an unsafe broad replacement');
  s=s.replace(scoreAdmissionOld,scoreAdmissionNew);
}
const stateWithoutMap="atsQaStatus:get('ATS QA Status')};";
const stateWithoutJd="atsQaStatus:get('ATS QA Status'),mapReady:!!has_(JC.S.MAP,id)};";
const stateWithMap="atsQaStatus:get('ATS QA Status'),jdReady:!!has_(JC.S.JD,id),mapReady:!!has_(JC.S.MAP,id)};";
if(!s.includes(stateWithMap)){
  if(s.includes(stateWithoutJd)) s=s.replace(stateWithoutJd,stateWithMap);
  else if(s.includes(stateWithoutMap)) s=s.replace(stateWithoutMap,stateWithMap);
  else throw new Error('Owned Apply admission state object not found; refusing an unsafe broad replacement');
}

function insertBeforeAnchor_(code){
  const i=s.indexOf(anchor);
  if(i<0) throw new Error('release identity anchor missing');
  s=s.slice(0,i)+code+'\n'+s.slice(i);
}
if(!s.includes('function p1aOwnedApplyAdmissionSelfTest_(')){
  insertBeforeAnchor_(`function p1aOwnedApplyAdmissionSelfTest_(){const probe={source:'owned-apply-edit',reason:'probe',contract:'OWNED-APPLY-STATE-MATRIX-001'};const options={recoverySafe:true};if(typeof queueMutationAllowed_!=='function'||queueMutationAllowed_(options)!==true)throw new Error('P1-A owned Apply admission safety contract failed');if(typeof ownedEnsureQueueAdmission_!=='function'||!String(ownedEnsureQueueAdmission_).includes('enqueue_(id,worker,payload,input,opts)'))throw new Error('P1-A owned Apply helper forwarding contract failed');if(typeof ownedApplyStatePlan_!=='function'||!String(ownedApplyStatePlan_).includes('!mapReady'))throw new Error('P1-A owned Apply map prerequisite contract failed');if(typeof workNeededFromState_!=='function'||!String(workNeededFromState_).includes("['New','Scoring'].includes(status)"))throw new Error('P1-A owned Apply scoring admission contract failed');return{pass:true,contract:'P1-A-OWNED-APPLY-ADMISSION-1',recoverySafe:true,optionsArgument:'fifth',helperForwardsOptions:true,mapPrerequisite:true};}
function runP1AOwnedApplyAdmissionSelfTest(){const x=p1aOwnedApplyAdmissionSelfTest_();upsertWorkerState_('p1a_owned_apply_admission_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));return x;}`);
}
const admissionPlannerFallback="const rawPlan=ownedApplyStatePlan_(state);const plan=rawPlan.worker==='RESUME_GENERATE'&&!state.mapReady?{status:'Scoring',worker:'JD_PARSE_SCORE_MAP',reason:'APPLY_NEEDS_SCORE_MAP'}:rawPlan;";
if(!s.includes(admissionPlannerFallback)){
  const admissionPlannerOld="const plan=ownedApplyStatePlan_(state);let admission={reused:false,queueJobId:'',state:'NONE'};";
  if(!s.includes(admissionPlannerOld)) throw new Error('Owned Apply admission planner boundary not found; refusing an unsafe broad replacement');
  s=s.replace(admissionPlannerOld,admissionPlannerFallback+"let admission={reused:false,queueJobId:'',state:'NONE'};");
}
if(!s.includes(replacement)) throw new Error('Owned Apply fifth-argument caller marker missing after patch');
if(!s.includes(helperReplacement)) throw new Error('Owned Apply helper options signature missing after patch');
if(!s.includes(helperCallReplacement)) throw new Error('Owned Apply helper options forwarding missing after patch');
if(!s.includes(mapGate)) throw new Error('Owned Apply map prerequisite gate missing after patch');
if(!s.includes(scoreAdmissionNew)) throw new Error('Owned Apply scoring admission gate missing after patch');
if(!s.includes(stateWithMap)) throw new Error('Owned Apply JD/map readiness input missing after patch');
if(!s.includes('function runP1AOwnedApplyAdmissionSelfTest(')) throw new Error('Owned Apply admission regression self-test missing');
if(s!==before) fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:'P1-A-OWNED-APPLY-ADMISSION-1',recoverySafe:true,optionsArgument:'fifth',helperForwardsOptions:true,mapPrerequisite:true,scoreAdmissionFromNew:true},null,2));
