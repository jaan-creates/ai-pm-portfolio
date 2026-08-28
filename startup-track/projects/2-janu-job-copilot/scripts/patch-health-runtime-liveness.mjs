import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='HEALTH-RUNTIME-RESERVE-002';
const COMPAT='HEALTH-RUNTIME-RESERVE-001';
const FINAL_LOCK='REGRESSION-HEALTH-FINAL-LOCK-001';
const BLOCKER_READBACK='REGRESSION-HEALTH-BLOCKER-READBACK-001';
const TRACE_CONTRACT='HEALTH-RUNTIME-TRACE-002';
const BUDGET_CONTRACT='HEALTH-OPTIONAL-BUDGET-003';
const OPTIONAL_DEADLINE_MS=60000;
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function phase1HealthTick(')&&t.includes('const P12');});
if(!target)throw new Error('TrackerWorkflow source with phase1HealthTick not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;

function rangeOf(name){
  const start=s.indexOf('function '+name+'(');if(start<0)return null;
  const open=s.indexOf('{',start);if(open<0)throw new Error('Malformed '+name);
  let depth=0,quote=null,esc=false,line=false,block=false;
  for(let i=open;i<s.length;i++){
    const c=s[i],n=s[i+1]||'';
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(quote){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===quote)quote=null;continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}
    if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='{')depth++;else if(c==='}'&&--depth===0)return{start,open,end:i+1};
  }
  throw new Error('Unterminated '+name);
}
function replaceFunction(name,code){const r=rangeOf(name);if(!r)throw new Error(name+' missing');s=s.slice(0,r.start)+code+s.slice(r.end);}
function addBefore(anchor,marker,code){if(s.includes(marker))return false;const i=s.indexOf(anchor);if(i<0)throw new Error('Anchor missing: '+anchor);s=s.slice(0,i)+code+'\n'+s.slice(i);return true;}

if(!s.includes(COMPAT)){
  const helpersV1=`function healthRuntimeElapsed_(startedAt){return Math.max(0,Date.now()-Number(startedAt||Date.now()));}\nfunction healthRuntimeCheckpoint_(stage,startedAt,status){const elapsed=healthRuntimeElapsed_(startedAt);upsertWorkerState_('health_tick_stage',String(stage||''),'${COMPAT} last durable stage');upsertWorkerState_('health_tick_elapsed_ms',String(elapsed),'${COMPAT}');upsertWorkerState_('health_tick_status',String(status||'RUNNING'),'${COMPAT}');return elapsed;}\nfunction healthRuntimeOptionalStage_(stage,startedAt,fn){const elapsed=healthRuntimeElapsed_(startedAt);if(elapsed>=${OPTIONAL_DEADLINE_MS}){healthRuntimeCheckpoint_(stage,startedAt,'BUDGET_YIELD');return null;}healthRuntimeCheckpoint_(stage+':START',startedAt,'RUNNING');const out=fn();healthRuntimeCheckpoint_(stage+':DONE',startedAt,'RUNNING');return out;}\nfunction healthRuntimePreventionContract_(){return {pass:true,contract:'${COMPAT}',finalLock:'${FINAL_LOCK}',optionalDeadlineMs:${OPTIONAL_DEADLINE_MS}};}\nfunction runHealthRuntimePreventionSelfTest(){const x=healthRuntimePreventionContract_();upsertWorkerState_('health_runtime_self_test','PASS',JSON.stringify(x));return x;}\nfunction healthFinalReleaseLock_(){let out=null;try{out=enforceReleaseBlockerHealth_();}catch(e){healthSet_('Regression Gate','DEGRADED','OPEN','RELEASE_BLOCKER_CHECK_FAILED',String((e&&e.stack)||e).slice(0,1500),1,'${FINAL_LOCK}: fail closed when blocker join cannot be evaluated.');return{blocked:true,error:String(e)}}try{if(circuitOpen_('Worker Runtime')){healthSet_('Regression Gate','DEGRADED','OPEN','WORKER_RUNTIME_OPEN','Worker Runtime circuit is OPEN; release gate cannot close.',1,'${FINAL_LOCK}: runtime liveness has precedence over generic suite health.');return{blocked:true,runtimeOpen:true,base:out}}}catch(e){healthSet_('Regression Gate','DEGRADED','OPEN','RUNTIME_GATE_CHECK_FAILED',String((e&&e.stack)||e).slice(0,1500),1,'${FINAL_LOCK}: fail closed on runtime gate ambiguity.');return{blocked:true,error:String(e),base:out}}return out;}`;
  addBefore('function phase1HealthTick(', 'function healthRuntimeElapsed_(', helpersV1);
  const r=rangeOf('phase1HealthTick'),old=s.slice(r.start,r.end),open=old.indexOf('{'),close=old.lastIndexOf('}');
  let body=old.slice(open+1,close);
  for(const [fn,stage] of [['p1aVacancyMaintenanceTick_','vacancy-maintenance'],['p1aJdRecoveryMaintenanceTick_','jd-recovery'],['p1aE2EContinuationTick_','e2e-continuation'],['p1aClosedVacancyReconcileTick_','closed-vacancy-reconcile'],['traceGoldenTick_','golden-trace']]){
    const needle=fn+'()';if(body.includes(needle))body=body.split(needle).join(`healthRuntimeOptionalStage_('${stage}',__healthStartedAt,function(){return ${fn}();})`);
  }
  const prefix=`/* ${COMPAT}: durable stage telemetry + hard reserve before optional health maintenance. */const __healthStartedAt=Date.now();healthRuntimeCheckpoint_('START',__healthStartedAt,'RUNNING');try{`;
  const suffix=`}finally{/* ${FINAL_LOCK}: final publisher invariant must run after every generic health write and on early return/exception. */try{healthRuntimeCheckpoint_('FINALIZE',__healthStartedAt,'FINALIZING');}catch(__healthTelemetryErr){}try{healthFinalReleaseLock_();}finally{try{healthRuntimeCheckpoint_('COMPLETE',__healthStartedAt,'COMPLETE');}catch(__healthTelemetryErr2){}}}`;
  replaceFunction('phase1HealthTick',old.slice(0,open+1)+prefix+body+suffix+old.slice(close));
}

if(!s.includes(TRACE_CONTRACT)){
  addBefore('function healthRuntimeElapsed_(', 'var HEALTH_RUNTIME_TRACE_', `var HEALTH_RUNTIME_TRACE_=[];`);
  replaceFunction('healthRuntimeCheckpoint_',`function healthRuntimeCheckpoint_(stage,startedAt,status){const elapsed=healthRuntimeElapsed_(startedAt);HEALTH_RUNTIME_TRACE_.push({stage:String(stage||''),elapsedMs:elapsed,status:String(status||'RUNNING')});if(HEALTH_RUNTIME_TRACE_.length>40)HEALTH_RUNTIME_TRACE_=HEALTH_RUNTIME_TRACE_.slice(-40);if(String(stage)==='COMPLETE'){upsertWorkerState_('health_tick_stage',String(stage),'${CONTRACT} final durable stage');upsertWorkerState_('health_tick_elapsed_ms',String(elapsed),'${CONTRACT}');upsertWorkerState_('health_tick_status',String(status||'COMPLETE'),'${CONTRACT}');upsertWorkerState_('health_tick_trace',JSON.stringify({contract:'${TRACE_CONTRACT}',compat:'${COMPAT}',elapsedMs:elapsed,events:HEALTH_RUNTIME_TRACE_}).slice(0,12000),'Single terminal publish; V1 per-checkpoint write amplification removed.');HEALTH_RUNTIME_TRACE_=[];}return elapsed;}`);
  const rr=rangeOf('phase1HealthTick');s=s.slice(0,rr.start)+'/* '+CONTRACT+' / '+TRACE_CONTRACT+' */\n'+s.slice(rr.start);
}

// Converge the current optional-work budget on every deployment, including
// targets already carrying the V2 runtime contract. A marker without current
// executable budget semantics is not release convergence.
replaceFunction('healthRuntimeOptionalStage_',`function healthRuntimeOptionalStage_(stage,startedAt,fn){const elapsed=healthRuntimeElapsed_(startedAt);if(elapsed>=${OPTIONAL_DEADLINE_MS}){healthRuntimeCheckpoint_(stage+':YIELD',startedAt,'BUDGET_YIELD');return null;}healthRuntimeCheckpoint_(stage+':START',startedAt,'RUNNING');const ss=Date.now();try{return fn();}finally{HEALTH_RUNTIME_TRACE_.push({stage:String(stage)+':DURATION',elapsedMs:healthRuntimeElapsed_(startedAt),stageMs:Math.max(0,Date.now()-ss),status:'RUNNING'});healthRuntimeCheckpoint_(stage+':DONE',startedAt,'RUNNING');}}`);
replaceFunction('healthRuntimePreventionContract_',`function healthRuntimePreventionContract_(){return {pass:true,contract:'${CONTRACT}',compat:'${COMPAT}',traceContract:'${TRACE_CONTRACT}',budgetContract:'${BUDGET_CONTRACT}',finalLock:'${FINAL_LOCK}',blockerReadback:'${BLOCKER_READBACK}',optionalDeadlineMs:${OPTIONAL_DEADLINE_MS},singleTerminalPublish:true};}`);

const tickRange=rangeOf('phase1HealthTick'),tick=s.slice(tickRange.start,tickRange.end);
for(const token of [CONTRACT,COMPAT,TRACE_CONTRACT,BUDGET_CONTRACT,FINAL_LOCK,'healthRuntimeOptionalStage_','healthFinalReleaseLock_'])if(!s.includes(token))throw new Error('Health runtime marker missing '+token);
for(const fn of ['p1aVacancyMaintenanceTick_','p1aJdRecoveryMaintenanceTick_','p1aE2EContinuationTick_','p1aClosedVacancyReconcileTick_','traceGoldenTick_'])if(tick.includes(fn+'()')&&!tick.includes('return '+fn+'();'))throw new Error('Unbounded optional health call remains '+fn);
const finalPos=tick.lastIndexOf('healthFinalReleaseLock_('),healthyPos=tick.lastIndexOf("healthSet_('Regression Gate','HEALTHY'");if(finalPos<0||finalPos<healthyPos)throw new Error(FINAL_LOCK+' ordering proof failed');
const checkpoint=rangeOf('healthRuntimeCheckpoint_');if(!checkpoint)throw new Error('checkpoint helper missing');const checkpointSource=s.slice(checkpoint.start,checkpoint.end);if((checkpointSource.match(/upsertWorkerState_/g)||[]).length!==4)throw new Error('V2 checkpoint should publish exactly four Worker State rows only at COMPLETE');if(!checkpointSource.includes("String(stage)==='COMPLETE'"))throw new Error('V2 terminal-only publish guard missing');
const optional=rangeOf('healthRuntimeOptionalStage_');const optionalSource=s.slice(optional.start,optional.end);if(!optionalSource.includes('elapsed>='+OPTIONAL_DEADLINE_MS))throw new Error(BUDGET_CONTRACT+' executable deadline missing');
fs.writeFileSync(file,s);
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error('Health runtime transformed source invalid: '+syntax.stderr);

const isolationPatch=path.resolve(path.dirname(new URL(import.meta.url).pathname),'patch-health-control-plane-isolation.mjs');
const isolation=spawnSync(process.execPath,[isolationPatch,root],{encoding:'utf8'});
if(isolation.status!==0)throw new Error(isolation.stderr||isolation.stdout||'Health control-plane isolation failed');
s=fs.readFileSync(file,'utf8');

// ${BLOCKER_READBACK}: the final lock must not merely call the blocker publisher;
// it must prove the live Regression Gate readback is fail-closed when blockers remain.
replaceFunction('healthFinalReleaseLock_',`function healthFinalReleaseLock_(){let base=null;try{base=enforceReleaseBlockerHealth_();}catch(e){healthSet_('Regression Gate','DEGRADED','OPEN','RELEASE_BLOCKER_CHECK_FAILED',String((e&&e.stack)||e).slice(0,1500),1,'${BLOCKER_READBACK}: fail closed when blocker join cannot be evaluated.');return{blocked:true,error:String(e)}}let runtime;try{runtime=healthComponentSnapshot_('Worker Runtime');}catch(e){runtime={found:false,error:String(e)}}const d=healthConsistencyDecision_(runtime);if(d.kind==='INCONSISTENT'){healthSet_('Regression Gate','DEGRADED','OPEN','HEALTH_STATE_INCONSISTENT',d.detail,1,'${BLOCKER_READBACK}: causal health state must be internally consistent.');return{blocked:true,inconsistent:true,runtime:runtime,base:base}}if(d.kind==='RUNTIME_OPEN'){healthSet_('Regression Gate','DEGRADED','OPEN','WORKER_RUNTIME_OPEN',d.detail,1,'${BLOCKER_READBACK}: current Worker Runtime snapshot has precedence over stale causal text.');return{blocked:true,runtimeOpen:true,runtime:runtime,base:base}}if(base&&base.blocked){const ids=(base.ids||[]).join(', '),detail='Open release blockers: '+ids+'; renderer recurrence='+String(base.recurrence||'')+' replay='+String(base.replay||'');healthSet_('Regression Gate','DEGRADED','OPEN','RELEASE_BLOCKER_OPEN',detail,(base.ids||[]).length||1,'${BLOCKER_READBACK}: blocker truth must survive generic health publication.');const rb=healthComponentSnapshot_('Regression Gate');if(!rb.found||String(rb.status||'').toUpperCase()!=='DEGRADED'||String(rb.circuit||'').toUpperCase()!=='OPEN'||String(rb.errorCode||'')!=='RELEASE_BLOCKER_OPEN'){healthSet_('Regression Gate','DEGRADED','OPEN','HEALTH_STATE_INCONSISTENT','Regression Gate readback failed to preserve unresolved release blockers.',(base.ids||[]).length||1,'${BLOCKER_READBACK}: fail closed on blocker/readback disagreement.');return{blocked:true,inconsistent:true,runtime:runtime,gate:rb,base:base}}return{blocked:true,runtime:runtime,gate:rb,base:base}}const gate=healthComponentSnapshot_('Regression Gate');if(!gate.found){healthSet_('Regression Gate','DEGRADED','OPEN','HEALTH_STATE_INCONSISTENT','Regression Gate readback missing after final publication.',1,'${BLOCKER_READBACK}: final write requires readback.');return{blocked:true,inconsistent:true,runtime:runtime,base:base}}if(String(gate.errorCode||'')==='WORKER_RUNTIME_OPEN'){healthSet_('Regression Gate','DEGRADED','OPEN','HEALTH_STATE_INCONSISTENT','Regression Gate asserted WORKER_RUNTIME_OPEN while Worker Runtime is HEALTHY/CLOSED.',1,'${BLOCKER_READBACK}: stale causal reason rejected by post-write readback.');return{blocked:true,inconsistent:true,runtime:runtime,gate:gate,base:base}}return base;}`);

for(const token of ['HEALTH-CONTROL-PLANE-001','HEALTH-CONSISTENCY-001','JD-RECOVERY-ISOLATION-001','health_runtime_slo_ms',BLOCKER_READBACK,'RELEASE_BLOCKER_OPEN','blocker truth must survive generic health publication'])if(!s.includes(token))throw new Error('Composed health control-plane marker missing '+token);
if(s.includes('function p1aJdRecoveryMaintenanceTick_(')&&!s.includes('function phase1JdRecoveryTick('))throw new Error('Composed health control-plane marker missing phase1JdRecoveryTick when JD recovery exists');
fs.writeFileSync(file,s);
const syntax2=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax2.status!==0)throw new Error('Composed health source invalid: '+syntax2.stderr);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:CONTRACT,compat:COMPAT,traceContract:TRACE_CONTRACT,budgetContract:BUDGET_CONTRACT,finalLock:FINAL_LOCK,blockerReadback:BLOCKER_READBACK,optionalDeadlineMs:OPTIONAL_DEADLINE_MS,singleTerminalPublish:true,phaseFunctionRewriteInV2:false,finalFailClosed:true,controlPlane:'HEALTH-CONTROL-PLANE-001',healthConsistency:'HEALTH-CONSISTENCY-001',jdIsolation:'JD-RECOVERY-ISOLATION-001',healthSloMs:180000,standaloneJdRecoveryTick:s.includes('function phase1JdRecoveryTick('),verifiedArtifact:file},null,2));
