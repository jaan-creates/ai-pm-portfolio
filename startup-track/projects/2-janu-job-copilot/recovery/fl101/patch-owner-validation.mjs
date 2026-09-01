import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{
  const t=fs.readFileSync(path.join(root,f),'utf8');
  return t.includes('function phase1HealthTick(')&&t.includes('function rendererFreshCanaryEnqueue_(')&&t.includes('function runPhase1_2RegressionSuite(')&&t.includes('RENDER-CAREERBREAK-EXACT3-001');
});
if(!target) throw new Error('FL-101 owner-validation target missing');
const file=path.join(root,target);
let s=fs.readFileSync(file,'utf8'), before=s;

function rangeOf(name){
  const start=s.indexOf('function '+name+'('); if(start<0)return null;
  const open=s.indexOf('{',start); let d=0,q=null,e=false,line=false,block=false;
  for(let i=open;i<s.length;i++){
    const c=s[i],n=s[i+1]||'';
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}
    if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='"'||c==="'"||c==='`'){q=c;continue;}
    if(c==='{')d++; else if(c==='}'&&--d===0)return {start,end:i+1};
  }
  throw new Error('Unterminated '+name);
}
function replaceFn(name,code){const r=rangeOf(name);if(!r)throw new Error('Missing '+name);s=s.slice(0,r.start)+code+s.slice(r.end);}
function insertBefore(anchor,token,code){if(s.includes(token))return;const i=s.indexOf(anchor);if(i<0)throw new Error('Missing anchor '+anchor);s=s.slice(0,i)+code+'\n'+s.slice(i);}

insertBefore('function phase1HealthTick(','function fl101OwnerValidationTick_(',`function fl101OwnerValidationTick_(){
  const req=String(rendererWorkerStateValue_('fl101_owner_validation_request')||'').trim();
  if(!req)return{handled:false,status:'IDLE'};
  const active=String(rendererWorkerStateValue_('fl101_owner_validation_active_request')||''),status=String(rendererWorkerStateValue_('fl101_owner_validation_status')||''),startedRaw=String(rendererWorkerStateValue_('fl101_owner_validation_started_at')||''),retry=Number(rendererWorkerStateValue_('fl101_owner_validation_retry_count')||0);
  if(active===req&&['ENQUEUED','FAILED','FAILED_STALE'].includes(status))return{handled:true,status:status,request:req};
  if(active===req&&status==='RUNNING'){
    const age=Date.now()-Date.parse(startedRaw||0);
    if(Number.isFinite(age)&&age<10*60*1000)return{handled:true,status:'RUNNING',request:req};
    if(retry>=1){upsertWorkerState_('fl101_owner_validation_status','FAILED_STALE','REGRESSION-OWNER-CONTEXT-001 stale RUNNING exceeded retry budget');return{handled:true,status:'FAILED_STALE',request:req};}
    upsertWorkerState_('fl101_owner_validation_retry_count','1','REGRESSION-OWNER-CONTEXT-001 one bounded stale-run recovery');
  }else upsertWorkerState_('fl101_owner_validation_retry_count','0','REGRESSION-OWNER-CONTEXT-001 new request');
  const started=typeof iso_==='function'?iso_():new Date().toISOString();
  upsertWorkerState_('fl101_owner_validation_active_request',req,'REGRESSION-OWNER-CONTEXT-001');
  upsertWorkerState_('fl101_owner_validation_started_at',started,'REGRESSION-OWNER-CONTEXT-001');
  upsertWorkerState_('fl101_owner_validation_status','RUNNING','REGRESSION-OWNER-CONTEXT-001 owner trigger executing privileged regression');
  try{
    const reg=runPhase1_2RegressionSuite();
    if(!reg||reg.pass!==true)throw new Error('DETERMINISTIC:OWNER_P0_REGRESSION_FAILED:'+JSON.stringify(reg));
    const exact=rendererCareerBreakExact3SelfTest_();
    if(!exact||exact.pass!==true||Number(exact.total)!==3)throw new Error('DETERMINISTIC:OWNER_EXACT3_FAILED:'+JSON.stringify(exact));
    rendererCanaryAdmissionGuard_();
    const queued=rendererFreshCanaryEnqueue_();
    if(!queued||!queued.queueJobId||queued.status!=='queued'||Number(queued.attempts)!==0)throw new Error('DETERMINISTIC:OWNER_CANARY_ENQUEUE_READBACK:'+JSON.stringify(queued));
    rendererCanaryRecordAttempt_(queued.queueJobId);
    upsertWorkerState_('renderer_canary_pending_queue_id',queued.queueJobId,JSON.stringify({contract:'REGRESSION-OWNER-CONTEXT-001',request:req,deployment:rendererCanaryDeployment_()}).slice(0,1500));
    upsertWorkerState_('fl101_owner_validation_result',JSON.stringify({pass:true,request:req,regressionRunId:reg.runId||'',passed:reg.passed||0,total:reg.total||0,queueJobId:queued.queueJobId,deployment:rendererCanaryDeployment_(),finishedAt:typeof iso_==='function'?iso_():new Date().toISOString()}).slice(0,1500),'REGRESSION-RESULT-TRUTH-001 / CANARY-DEPLOYMENT-IDEMPOTENCY-001');
    upsertWorkerState_('fl101_owner_validation_status','ENQUEUED','REGRESSION-OWNER-CONTEXT-001 owner regression PASS and one canary queued');
    return{handled:true,status:'ENQUEUED',request:req,queueJobId:queued.queueJobId,regressionRunId:reg.runId||''};
  }catch(e){
    const msg=String((e&&e.stack)||e).slice(0,1500);
    upsertWorkerState_('fl101_owner_validation_result',JSON.stringify({pass:false,request:req,error:msg,finishedAt:typeof iso_==='function'?iso_():new Date().toISOString()}).slice(0,1500),'REGRESSION-RESULT-TRUTH-001');
    upsertWorkerState_('fl101_owner_validation_status','FAILED',msg);
    return{handled:true,status:'FAILED',request:req,error:msg};
  }
  /* REGRESSION-OWNER-CONTEXT-001 / REGRESSION-RESULT-TRUTH-001 */
}`);

// Bind canary semantic idempotency to the verified deployment, not only app/version/input.
{
  const r=rangeOf('rendererFreshCanaryEnqueue_'); if(!r)throw new Error('rendererFreshCanaryEnqueue_ missing');
  let fn=s.slice(r.start,r.end);
  if(!fn.includes('CANARY-DEPLOYMENT-IDEMPOTENCY-001')){
    const marker="'CANARY-EXACT-EXECUTION-001'].join('|'))";
    if(!fn.includes(marker))throw new Error('Canary input-hash anchor missing');
    fn=fn.replace(marker,"'CANARY-EXACT-EXECUTION-001',rendererCanaryDeployment_()].join('|'))/* CANARY-DEPLOYMENT-IDEMPOTENCY-001 */");
    const payloadAnchor='const payload=rendererCanaryPayload_();';
    if(!fn.includes(payloadAnchor))throw new Error('Canary payload anchor missing');
    fn=fn.replace(payloadAnchor,payloadAnchor+"payload.deploymentIdentity=rendererCanaryDeployment_();payload.sourceHash=String(rendererWorkerStateValue_('deployment_source_sha256')||'');");
    s=s.slice(0,r.start)+fn+s.slice(r.end);
  }
}

// Owner health trigger executes one requested privileged validation and returns immediately,
// avoiding a long regression plus normal health work in the same Apps Script execution.
{
  const r=rangeOf('phase1HealthTick'); if(!r)throw new Error('phase1HealthTick missing');
  let fn=s.slice(r.start,r.end);
  if(!fn.includes('FL101-OWNER-VALIDATION-HOOK-001')){
    const p=fn.indexOf('{')+1;
    fn=fn.slice(0,p)+"const fl101=fl101OwnerValidationTick_();if(fl101&&fl101.handled)return fl101;/* FL101-OWNER-VALIDATION-HOOK-001 */"+fn.slice(p);
    s=s.slice(0,r.start)+fn+s.slice(r.end);
  }
}

for(const token of ['REGRESSION-OWNER-CONTEXT-001','REGRESSION-RESULT-TRUTH-001','CANARY-DEPLOYMENT-IDEMPOTENCY-001','FL101-OWNER-VALIDATION-HOOK-001','function fl101OwnerValidationTick_('])if(!s.includes(token))throw new Error('FL-101 contract missing '+token);
fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,ownerRegression:'REGRESSION-OWNER-CONTEXT-001',truthGate:'REGRESSION-RESULT-TRUTH-001',canaryIdempotency:'CANARY-DEPLOYMENT-IDEMPOTENCY-001',staleRecovery:'one bounded retry after 10m'},null,2));
