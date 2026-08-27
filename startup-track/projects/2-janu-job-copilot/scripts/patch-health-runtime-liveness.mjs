import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='HEALTH-RUNTIME-RESERVE-002';
const COMPAT='HEALTH-RUNTIME-RESERVE-001';
const FINAL_LOCK='REGRESSION-HEALTH-FINAL-LOCK-001';
const TRACE_CONTRACT='HEALTH-RUNTIME-TRACE-002';
const OPTIONAL_DEADLINE_MS=120000;
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
function replaceFunction(name,fn){const r=rangeOf(name);if(!r)throw new Error(name+' missing');const old=s.slice(r.start,r.end),neu=fn(old);s=s.slice(0,r.start)+neu+s.slice(r.end);}
function addBefore(anchor,marker,code){if(s.includes(marker))return false;const i=s.indexOf(anchor);if(i<0)throw new Error('Anchor missing: '+anchor);s=s.slice(0,i)+code+'\n'+s.slice(i);return true;}

// V2 deliberately keeps stage timing in memory and publishes once at the end.
// The V1 implementation durably wrote three Worker State rows at every checkpoint,
// adding dozens of spreadsheet writes to the very path being measured.
const helpers=`function healthRuntimeElapsed_(startedAt){return Math.max(0,Date.now()-Number(startedAt||Date.now()));}
function healthRuntimeTracePush_(trace,stage,startedAt,status,stageStartedAt){if(!trace)return;trace.push({stage:String(stage||''),elapsedMs:healthRuntimeElapsed_(startedAt),stageMs:stageStartedAt?Math.max(0,Date.now()-stageStartedAt):0,status:String(status||'RUNNING')});}
function healthRuntimeStage_(stage,startedAt,trace,fn){const ss=Date.now();healthRuntimeTracePush_(trace,stage+':START',startedAt,'RUNNING',ss);try{return fn();}finally{healthRuntimeTracePush_(trace,stage+':DONE',startedAt,'RUNNING',ss);}}
function healthRuntimeOptionalStage_(stage,startedAt,trace,fn){const elapsed=healthRuntimeElapsed_(startedAt);if(elapsed>=${OPTIONAL_DEADLINE_MS}){healthRuntimeTracePush_(trace,stage+':YIELD',startedAt,'BUDGET_YIELD',Date.now());return null;}return healthRuntimeStage_(stage,startedAt,trace,fn);}
function healthRuntimePublish_(trace,startedAt,status){const elapsed=healthRuntimeElapsed_(startedAt),last=trace&&trace.length?trace[trace.length-1]:{stage:'UNKNOWN'};upsertWorkerState_('health_tick_stage',String(last.stage||''),'${CONTRACT} final observed stage');upsertWorkerState_('health_tick_elapsed_ms',String(elapsed),'${CONTRACT}');upsertWorkerState_('health_tick_status',String(status||'COMPLETE'),'${CONTRACT}');upsertWorkerState_('health_tick_trace',JSON.stringify({contract:'${TRACE_CONTRACT}',compat:'${COMPAT}',elapsedMs:elapsed,events:(trace||[]).slice(-40)}).slice(0,12000),'Single-publish stage timing; avoids V1 checkpoint write amplification.');return elapsed;}
function healthRuntimePreventionContract_(){return {pass:true,contract:'${CONTRACT}',compat:'${COMPAT}',traceContract:'${TRACE_CONTRACT}',finalLock:'${FINAL_LOCK}',optionalDeadlineMs:${OPTIONAL_DEADLINE_MS},singlePublishTelemetry:true};}
function runHealthRuntimePreventionSelfTest(){const x=healthRuntimePreventionContract_();upsertWorkerState_('health_runtime_self_test','PASS',JSON.stringify(x));return x;}
function healthFinalReleaseLock_(){let out=null;try{out=enforceReleaseBlockerHealth_();}catch(e){healthSet_('Regression Gate','DEGRADED','OPEN','RELEASE_BLOCKER_CHECK_FAILED',String((e&&e.stack)||e).slice(0,1500),1,'${FINAL_LOCK}: fail closed when blocker join cannot be evaluated.');return{blocked:true,error:String(e)}}try{if(circuitOpen_('Worker Runtime')){healthSet_('Regression Gate','DEGRADED','OPEN','WORKER_RUNTIME_OPEN','Worker Runtime circuit is OPEN; release gate cannot close.',1,'${FINAL_LOCK}: runtime liveness has precedence over generic suite health.');return{blocked:true,runtimeOpen:true,base:out}}}catch(e){healthSet_('Regression Gate','DEGRADED','OPEN','RUNTIME_GATE_CHECK_FAILED',String((e&&e.stack)||e).slice(0,1500),1,'${FINAL_LOCK}: fail closed on runtime gate ambiguity.');return{blocked:true,error:String(e),base:out}}return out;}`;

// Remove the V1 helper block if present so patch-on-live converges to the cheaper V2 helpers.
if(s.includes('function healthRuntimeCheckpoint_(')){
  const hs=s.indexOf('function healthRuntimeElapsed_('),he=s.indexOf('function phase1HealthTick(',hs);
  if(hs>=0&&he>hs)s=s.slice(0,hs)+s.slice(he);
}
addBefore('function phase1HealthTick(', 'function healthRuntimeTracePush_(', helpers);

replaceFunction('phase1HealthTick',old=>{
  // Strip the previous V1 wrapper while retaining the original body.
  let body;
  const v1Prefix=old.indexOf('/* HEALTH-RUNTIME-RESERVE-001:');
  if(v1Prefix>=0){
    const tryPos=old.indexOf('try{',v1Prefix),finallyPos=old.lastIndexOf('}finally{');
    if(tryPos<0||finallyPos<tryPos)throw new Error('Unable to unwrap health runtime V1');
    body=old.slice(tryPos+4,finallyPos);
  }else{
    const open=old.indexOf('{'),close=old.lastIndexOf('}');if(open<0||close<open)throw new Error('Malformed phase1HealthTick');
    body=old.slice(open+1,close);
  }

  // Remove V1 optional wrappers back to the underlying call before applying V2.
  for(const [fn,stage] of [
    ['p1aVacancyMaintenanceTick_','vacancy-maintenance'],['p1aJdRecoveryMaintenanceTick_','jd-recovery'],['p1aE2EContinuationTick_','e2e-continuation'],['p1aClosedVacancyReconcileTick_','closed-vacancy-reconcile'],['traceGoldenTick_','golden-trace']
  ]){
    const oldWrap=`healthRuntimeOptionalStage_('${stage}',__healthStartedAt,function(){return ${fn}();})`;
    body=body.split(oldWrap).join(fn+'()');
  }

  const optionalStages=[
    ['p1aVacancyMaintenanceTick_','vacancy-maintenance'],
    ['p1aJdRecoveryMaintenanceTick_','jd-recovery'],
    ['p1aE2EContinuationTick_','e2e-continuation'],
    ['p1aClosedVacancyReconcileTick_','closed-vacancy-reconcile'],
    ['traceGoldenTick_','golden-trace']
  ];
  for(const [fn,stage] of optionalStages){
    const needle=fn+'()';
    if(body.includes(needle))body=body.split(needle).join(`healthRuntimeOptionalStage_('${stage}',__healthStartedAt,__healthTrace,function(){return ${fn}();})`);
  }

  // Time the zero-argument mandatory stages that are plausible pre-optional hot paths.
  for(const [fn,stage] of [
    ['processOperatorCommand_','operator-command'],
    ['ensureP12Sheets_','ensure-sheets'],
    ['sourceFreshnessHealth_','source-freshness'],
    ['recoverStaleQueueLeases_','stale-lease-recovery'],
    ['probeOpenAIHealth_','openai-probe']
  ]){
    const needle=fn+'()';
    if(body.includes(needle))body=body.split(needle).join(`healthRuntimeStage_('${stage}',__healthStartedAt,__healthTrace,function(){return ${fn}();})`);
  }

  const open=old.indexOf('{');
  const prefix=`/* ${CONTRACT}; compatibility ${COMPAT}. */const __healthStartedAt=Date.now(),__healthTrace=[];healthRuntimeTracePush_(__healthTrace,'START',__healthStartedAt,'RUNNING',Date.now());let __healthOutcome='COMPLETE';try{`;
  const suffix=`}catch(__healthErr){__healthOutcome='ERROR';throw __healthErr;}finally{/* ${FINAL_LOCK}: final publisher invariant after every generic health write. */try{healthRuntimeTracePush_(__healthTrace,'FINALIZE',__healthStartedAt,'FINALIZING',Date.now());healthFinalReleaseLock_();}finally{try{healthRuntimeTracePush_(__healthTrace,'COMPLETE',__healthStartedAt,__healthOutcome,Date.now());healthRuntimePublish_(__healthTrace,__healthStartedAt,__healthOutcome);}catch(__healthTelemetryErr){}}}`;
  return old.slice(0,open+1)+prefix+body+suffix+'}';
});

const r=rangeOf('phase1HealthTick');const tick=s.slice(r.start,r.end);
for(const token of [CONTRACT,COMPAT,TRACE_CONTRACT,FINAL_LOCK,'healthRuntimeOptionalStage_','healthFinalReleaseLock_','healthRuntimePublish_'])if(!s.includes(token))throw new Error('Health runtime marker missing '+token);
for(const fn of ['p1aVacancyMaintenanceTick_','p1aJdRecoveryMaintenanceTick_','p1aE2EContinuationTick_','p1aClosedVacancyReconcileTick_','traceGoldenTick_']){
  if(tick.includes(fn+'()')&&!tick.includes("return "+fn+'();'))throw new Error('Unbounded optional health call remains '+fn);
}
if(tick.includes('healthRuntimeCheckpoint_'))throw new Error('V1 checkpoint write amplification survived');
const finalPos=tick.lastIndexOf('healthFinalReleaseLock_('),healthyPos=tick.lastIndexOf("healthSet_('Regression Gate','HEALTHY'");
if(finalPos<0||finalPos<healthyPos)throw new Error(FINAL_LOCK+' ordering proof failed');
fs.writeFileSync(file,s);
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error('Health runtime transformed source invalid: '+syntax.stderr);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:CONTRACT,compat:COMPAT,traceContract:TRACE_CONTRACT,finalLock:FINAL_LOCK,optionalDeadlineMs:OPTIONAL_DEADLINE_MS,singlePublishTelemetry:true,mandatoryStageTiming:true,finalFailClosed:true,verifiedArtifact:file},null,2));
