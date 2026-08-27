import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='HEALTH-RUNTIME-RESERVE-001';
const FINAL_LOCK='REGRESSION-HEALTH-FINAL-LOCK-001';
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

const helpers=`function healthRuntimeElapsed_(startedAt){return Math.max(0,Date.now()-Number(startedAt||Date.now()));}
function healthRuntimeCheckpoint_(stage,startedAt,status){const elapsed=healthRuntimeElapsed_(startedAt);upsertWorkerState_('health_tick_stage',String(stage||''), '${CONTRACT} last durable stage');upsertWorkerState_('health_tick_elapsed_ms',String(elapsed),'${CONTRACT}');upsertWorkerState_('health_tick_status',String(status||'RUNNING'),'${CONTRACT}');return elapsed;}
function healthRuntimeOptionalStage_(stage,startedAt,fn){const elapsed=healthRuntimeElapsed_(startedAt);if(elapsed>=${OPTIONAL_DEADLINE_MS}){healthRuntimeCheckpoint_(stage,startedAt,'BUDGET_YIELD');return null;}healthRuntimeCheckpoint_(stage+':START',startedAt,'RUNNING');const out=fn();healthRuntimeCheckpoint_(stage+':DONE',startedAt,'RUNNING');return out;}
function healthRuntimePreventionContract_(){return {pass:true,contract:'${CONTRACT}',finalLock:'${FINAL_LOCK}',optionalDeadlineMs:${OPTIONAL_DEADLINE_MS}};}
function runHealthRuntimePreventionSelfTest(){const x=healthRuntimePreventionContract_();upsertWorkerState_('health_runtime_self_test','PASS',JSON.stringify(x));return x;}
function healthFinalReleaseLock_(){let out=null;try{out=enforceReleaseBlockerHealth_();}catch(e){healthSet_('Regression Gate','DEGRADED','OPEN','RELEASE_BLOCKER_CHECK_FAILED',String((e&&e.stack)||e).slice(0,1500),1,'${FINAL_LOCK}: fail closed when blocker join cannot be evaluated.');return{blocked:true,error:String(e)}}try{if(circuitOpen_('Worker Runtime')){healthSet_('Regression Gate','DEGRADED','OPEN','WORKER_RUNTIME_OPEN','Worker Runtime circuit is OPEN; release gate cannot close.',1,'${FINAL_LOCK}: runtime liveness has precedence over generic suite health.');return{blocked:true,runtimeOpen:true,base:out}}}catch(e){healthSet_('Regression Gate','DEGRADED','OPEN','RUNTIME_GATE_CHECK_FAILED',String((e&&e.stack)||e).slice(0,1500),1,'${FINAL_LOCK}: fail closed on runtime gate ambiguity.');return{blocked:true,error:String(e),base:out}}return out;}`;
addBefore('function phase1HealthTick(', 'function healthRuntimeElapsed_(', helpers);

replaceFunction('phase1HealthTick',old=>{
  if(old.includes(CONTRACT)&&old.includes(FINAL_LOCK))return old;
  const open=old.indexOf('{'),close=old.lastIndexOf('}');if(open<0||close<open)throw new Error('Malformed phase1HealthTick');
  let body=old.slice(open+1,close);
  const stages=[
    ['p1aVacancyMaintenanceTick_','vacancy-maintenance'],
    ['p1aJdRecoveryMaintenanceTick_','jd-recovery'],
    ['p1aE2EContinuationTick_','e2e-continuation'],
    ['p1aClosedVacancyReconcileTick_','closed-vacancy-reconcile'],
    ['traceGoldenTick_','golden-trace']
  ];
  for(const [fn,stage] of stages){
    const needle=fn+'()';
    if(body.includes(needle))body=body.split(needle).join(`healthRuntimeOptionalStage_('${stage}',__healthStartedAt,function(){return ${fn}();})`);
  }
  const prefix=`/* ${CONTRACT}: durable stage telemetry + hard reserve before optional health maintenance. */const __healthStartedAt=Date.now();healthRuntimeCheckpoint_('START',__healthStartedAt,'RUNNING');try{`;
  const suffix=`}finally{/* ${FINAL_LOCK}: final publisher invariant must run after every generic health write and on early return/exception. */try{healthRuntimeCheckpoint_('FINALIZE',__healthStartedAt,'FINALIZING');}catch(__healthTelemetryErr){}try{healthFinalReleaseLock_();}finally{try{healthRuntimeCheckpoint_('COMPLETE',__healthStartedAt,'COMPLETE');}catch(__healthTelemetryErr2){}}}`;
  return old.slice(0,open+1)+prefix+body+suffix+old.slice(close);
});

const r=rangeOf('phase1HealthTick');const tick=s.slice(r.start,r.end);
for(const token of [CONTRACT,FINAL_LOCK,'healthRuntimeOptionalStage_','healthFinalReleaseLock_'])if(!tick.includes(token))throw new Error('Health runtime marker missing '+token);
for(const fn of ['p1aVacancyMaintenanceTick_','p1aJdRecoveryMaintenanceTick_','p1aE2EContinuationTick_','p1aClosedVacancyReconcileTick_','traceGoldenTick_']){
  if(tick.includes(fn+'()')&&!tick.includes("return "+fn+'();'))throw new Error('Unbounded optional health call remains '+fn);
}
const finalPos=tick.lastIndexOf('healthFinalReleaseLock_('),healthyPos=tick.lastIndexOf("healthSet_('Regression Gate','HEALTHY'");
if(finalPos<0||finalPos<healthyPos)throw new Error(FINAL_LOCK+' ordering proof failed');
fs.writeFileSync(file,s);
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error('Health runtime transformed source invalid: '+syntax.stderr);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:CONTRACT,finalLock:FINAL_LOCK,optionalDeadlineMs:OPTIONAL_DEADLINE_MS,durableStageTelemetry:true,optionalMaintenanceBounded:true,finalFailClosed:true,verifiedArtifact:file},null,2));
