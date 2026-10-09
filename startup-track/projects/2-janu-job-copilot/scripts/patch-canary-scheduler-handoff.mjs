import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='CANARY-SCHEDULER-HANDOFF-001';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function rendererQuarantineBlocks_(')&&t.includes('function rendererCanaryArtifactProof_(')&&t.includes('function phase1HealthTick(')&&t.includes('const P12');});
if(!target)throw new Error('Scheduler handoff source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');

function rangeOf(name){
  const sig='function '+name+'(';const start=s.indexOf(sig);if(start<0)return null;
  const open=s.indexOf('{',start);if(open<0)throw new Error('Malformed '+name);
  let d=0,q=null,e=false,line=false,block=false;
  for(let i=open;i<s.length;i++){const c=s[i],n=s[i+1]||'';
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='"'||c==="'"||c===String.fromCharCode(96)){q=c;continue;}
    if(c==='{')d++;else if(c==='}'&&--d===0)return{start,end:i+1,open};
  }throw new Error('Unterminated '+name);
}
function putFn(name,code,anchor){
  const r=rangeOf(name);if(r){s=s.slice(0,r.start)+code+s.slice(r.end);return;}
  const i=s.indexOf(anchor);if(i<0)throw new Error('Missing anchor '+anchor);s=s.slice(0,i)+code+'\n'+s.slice(i);
}

const leaseFn="function armRendererCanaryExecutionLease(qid){const id=String(qid||''),expected=rendererWorkerStateValue_('renderer_canary_application_id');if(!id||!expected)throw new Error('DETERMINISTIC:CANARY_LEASE_INPUT_MISSING');const rb=rendererCanaryQueueReadback_(id);if(!rb.found||rb.applicationId!==expected||rb.workerType!=='RESUME_GENERATE'||rb.status!=='queued'||rb.attempts!==0||rb.errorCode||!rb.canary||String(rb.rendererPolicy||'')!=='RENDER-CAREERBREAK-V3')throw new Error('DETERMINISTIC:CANARY_LEASE_QUEUE_MISMATCH:'+JSON.stringify(rb));const until=Date.now()+600000;upsertWorkerState_('renderer_canary_execution_lease','ACTIVE','CANARY-SCHEDULER-HANDOFF-001');upsertWorkerState_('renderer_canary_execution_lease_until',String(until),'CANARY-SCHEDULER-HANDOFF-001: expires after 10 minutes');upsertWorkerState_('renderer_canary_execution_lease_qid',id,'CANARY-SCHEDULER-HANDOFF-001');return{pass:true,contract:'CANARY-SCHEDULER-HANDOFF-001',queueJobId:id,lease:'ACTIVE',leaseUntil:until};}";
putFn('armRendererCanaryExecutionLease',leaseFn,'function verifyReleaseIdentity()');

const quarantineFn="function rendererQuarantineBlocks_(appId,type,payload){if(String(type)!=='RESUME_GENERATE')return false;payload=payload||{};const rec=rendererWorkerStateValue_('renderer_recurrence_gate'),rep=rendererWorkerStateValue_('renderer_replay_gate');if(rec==='CANARY_PASS'&&rep==='CANARY_PASS')return false;const configured=String(rendererWorkerStateValue_('renderer_canary_application_id')||''),self=String(rendererWorkerStateValue_('renderer_careerbreak_self_test')||''),lease=String(rendererWorkerStateValue_('renderer_canary_execution_lease')||''),until=Number(rendererWorkerStateValue_('renderer_canary_execution_lease_until')||0),leaseQid=String(rendererWorkerStateValue_('renderer_canary_execution_lease_qid')||''),leaseActive=lease==='ACTIVE'&&leaseQid!==''&&(!until||Date.now()<until);return !(String(appId)===configured&&configured!==''&&self==='PASS'&&leaseActive&&payload.canary===true&&String(payload.rendererPolicy||'')==='RENDER-CAREERBREAK-V3');}";
putFn('rendererQuarantineBlocks_',quarantineFn,'function rendererCanaryArtifactProof_(');

const controlFn="function rendererCanaryControlPlaneTick(){const renderQid=String(rendererWorkerStateValue_('renderer_canary_pending_queue_id')||''),expected=String(rendererWorkerStateValue_('renderer_canary_application_id')||'');if(!renderQid||!expected)return{status:'NO_PENDING',contract:'CANARY-SCHEDULER-HANDOFF-001'};const rb=rendererCanaryQueueReadback_(renderQid);if(!rb.found||rb.applicationId!==expected||rb.workerType!=='RESUME_GENERATE')return{status:'RENDER_QUEUE_MISMATCH',contract:'CANARY-SCHEDULER-HANDOFF-001'};if(rb.status!=='succeeded')return{status:'RENDER_NOT_TERMINAL',contract:'CANARY-SCHEDULER-HANDOFF-001',render:rb.status};if(rb.attempts!==1||rb.errorCode||!rb.resumeVersionId||!rb.tailoredResumeLink){upsertWorkerState_('renderer_canary_artifact_proof','FAIL','CANARY-SCHEDULER-HANDOFF-001: render terminal proof invalid');return{status:'RENDER_PROOF_FAIL',contract:'CANARY-SCHEDULER-HANDOFF-001'};}let proofState=String(rendererWorkerStateValue_('renderer_canary_artifact_proof')||'');if(proofState!=='PASS'){try{const proof=rendererCanaryArtifactProof_(rb.tailoredResumeLink);upsertWorkerState_('renderer_canary_artifact_proof','PASS',JSON.stringify(proof));proofState='PASS';}catch(e){upsertWorkerState_('renderer_canary_artifact_proof','FAIL',String((e&&e.stack)||e).slice(0,1500));upsertWorkerState_('renderer_recurrence_gate','BLOCKED_ARTIFACT_PROOF_FAIL','CANARY-SCHEDULER-HANDOFF-001');return{status:'ARTIFACT_PROOF_FAIL',contract:'CANARY-SCHEDULER-HANDOFF-001'};}}let qaid=String(rendererWorkerStateValue_('renderer_canary_qa_queue_id')||'');if(!qaid){const input=hash_([expected,rb.resumeVersionId,String(rendererWorkerStateValue_('deployment_source_sha256')||''),renderQid,'CANARY-QA-FINALIZE-001'].join('|')),payload={canary:true,canaryQa:true,renderQueueJobId:renderQid,contract:'CANARY-QA-FINALIZE-001',source:'CANARY-SCHEDULER-HANDOFF-001',rendererPolicy:'RENDER-CAREERBREAK-V3'};qaid=enqueue_(expected,'QA_FINALIZE',payload,input,{recoverySafe:true});if(!qaid)throw new Error('DETERMINISTIC:CANARY_QA_ENQUEUE_FAILED');upsertWorkerState_('renderer_canary_qa_queue_id',qaid,'CANARY-SCHEDULER-HANDOFF-001');}const qa=rendererCanaryQueueReadback_(qaid);if(!qa.found||qa.applicationId!==expected||qa.workerType!=='QA_FINALIZE')return{status:'QA_QUEUE_MISMATCH',contract:'CANARY-SCHEDULER-HANDOFF-001',qaQueueJobId:qaid,artifactProof:proofState};if(qa.status!=='succeeded')return{status:'QA_NOT_TERMINAL',contract:'CANARY-SCHEDULER-HANDOFF-001',qaQueueJobId:qaid,artifactProof:proofState,qa:qa.status};if(qa.attempts!==1||qa.errorCode||String(qa.atsQaStatus||'')!=='Passed'){upsertWorkerState_('renderer_replay_gate','BLOCKED_QA_PROOF_FAIL','CANARY-SCHEDULER-HANDOFF-001');return{status:'QA_PROOF_FAIL',contract:'CANARY-SCHEDULER-HANDOFF-001',qaQueueJobId:qaid,artifactProof:proofState,atsQaStatus:qa.atsQaStatus};}upsertWorkerState_('renderer_recurrence_gate','CANARY_PASS','CANARY-SCHEDULER-HANDOFF-001: scheduler artifact and QA proof passed');upsertWorkerState_('renderer_replay_gate','CANARY_PASS','CANARY-SCHEDULER-HANDOFF-001: scheduler artifact and QA proof passed');upsertWorkerState_('renderer_canary_last_success',renderQid,JSON.stringify({contract:'CANARY-SCHEDULER-HANDOFF-001',qaQueueJobId:qaid,artifactProof:proofState}).slice(0,1500));try{if(typeof enforceReleaseBlockerHealth_==='function')enforceReleaseBlockerHealth_();}catch(e){}return{status:'PASS',contract:'CANARY-SCHEDULER-HANDOFF-001',renderQueueJobId:renderQid,qaQueueJobId:qaid,artifactProof:proofState,atsQaStatus:qa.atsQaStatus,recurrence:'CANARY_PASS',replay:'CANARY_PASS'};}";
putFn('rendererCanaryControlPlaneTick',controlFn,'function phase1HealthTick(');

const statusFn="function runRendererCanaryControlStatus(){const renderQid=String(rendererWorkerStateValue_('renderer_canary_pending_queue_id')||''),qaid=String(rendererWorkerStateValue_('renderer_canary_qa_queue_id')||''),render=renderQid?rendererCanaryQueueReadback_(renderQid):{found:false},qa=qaid?rendererCanaryQueueReadback_(qaid):{found:false};return{contract:'CANARY-SCHEDULER-HANDOFF-001',renderQueueJobId:renderQid,qaQueueJobId:qaid,render:render.status||'',qa:qa.status||'',atsQaStatus:qa.atsQaStatus||'',artifactProofStatus:String(rendererWorkerStateValue_('renderer_canary_artifact_proof')||''),recurrence:String(rendererWorkerStateValue_('renderer_recurrence_gate')||''),replay:String(rendererWorkerStateValue_('renderer_replay_gate')||'')};}";
putFn('runRendererCanaryControlStatus',statusFn,'function verifyReleaseIdentity()');

const phase=rangeOf('phase1HealthTick');if(!phase)throw new Error('phase1HealthTick missing');
const phaseBody=s.slice(phase.start,phase.end);
if(!phaseBody.includes('rendererCanaryControlPlaneTick'))s=s.slice(0,phase.open+1)+"try{rendererCanaryControlPlaneTick();}catch(e){upsertWorkerState_('renderer_canary_control_plane','FAIL',String((e&&e.stack)||e).slice(0,1500));}"+s.slice(phase.open+1);

for(const token of ['CANARY-SCHEDULER-HANDOFF-001','function armRendererCanaryExecutionLease(','function rendererCanaryControlPlaneTick(','function runRendererCanaryControlStatus(','renderer_canary_execution_lease_until','renderer_canary_qa_queue_id','CANARY_PASS'])if(!s.includes(token))throw new Error('Scheduler handoff contract missing '+token);
fs.writeFileSync(file,s);
const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr||'syntax failure');
console.log(JSON.stringify({status:'PASS',file:target,contract:'CANARY-SCHEDULER-HANDOFF-001',leaseMinutes:10,canonicalSchedulerControl:true,ciDocsAccessRequired:false,failClosed:true},null,2));
