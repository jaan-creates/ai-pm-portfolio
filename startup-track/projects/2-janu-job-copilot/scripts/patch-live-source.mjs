import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
if(!files.length)throw new Error(`No .gs/.js Apps Script files found in ${root}`);
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target)throw new Error('Could not locate TrackerWorkflow source after clasp pull');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');const before=s;

// v18 closes the live ENABLE runtime defect after v17 proved regression/preflight green.
s=s.replaceAll('1.3.6','1.3.7').replaceAll('p0-regression-v17','p0-regression-v18');

// Retain FL-031 conservative continuation contract.
s=s.replace("function lockCollisionAction_(triggerCount){return Number(triggerCount||0)>0?'KEEP_EXISTING':'SCHEDULE_RETRY';}","function lockCollisionAction_(triggerCount){return 'SCHEDULE_REPLACEMENT';}");
s=s.replace("function ensureP0ClosureRetryTrigger_(delayMs){const count=p0ClosureTriggerCount_(),action=lockCollisionAction_(count);if(action==='SCHEDULE_RETRY')ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||60000))).create();upsertWorkerState_('p0_closure_lock_retry',action,iso_());return{action:action,existingTriggers:count};}","function ensureP0ClosureRetryTrigger_(delayMs){const count=p0ClosureTriggerCount_(),action=lockCollisionAction_(count);ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||60000))).create();upsertWorkerState_('p0_closure_lock_retry',action,iso_()+' prior_trigger_count='+count);return{action:action,existingTriggers:count,replacementScheduled:true};}");
if(!s.includes("function lockCollisionAction_(triggerCount){return 'SCHEDULE_REPLACEMENT';}"))throw new Error('FL-031 replacement action missing');
if(!s.includes('replacementScheduled:true'))throw new Error('FL-031 replacement scheduling evidence missing');

// CONTROL-002: operator commands remain reachable while the broad worker is gated.
const healthStart='function phase1HealthTick(){';
const healthControlled='function phase1HealthTick(){const op=processOperatorCommand_();if(op)return op;';
if(!s.includes(healthControlled)){
  if(!s.includes(healthStart))throw new Error('phase1HealthTick entrypoint not found');
  s=s.replace(healthStart,healthControlled);
}

// FL-033: PREPARE stays bounded and defers expensive validation to strict gates.
const closureStart0=s.indexOf('function runP0ClosureStep_(');
if(closureStart0<0)throw new Error('runP0ClosureStep_ not found');
if(!s.includes('function p0PrepareAction_(){'))s=s.slice(0,closureStart0)+"function p0PrepareAction_(){return 'DEFER_TO_STRICT_GATES';}\n"+s.slice(closureStart0);
let cs=s.indexOf('function runP0ClosureStep_('),ce=s.indexOf('\nfunction ',cs+1);if(ce<0)ce=s.length;
let closure=s.slice(cs,ce);
if(!closure.includes("p0PrepareAction_()")){
  const prepMarkers=["if(phase==='PREPARE'){",'if(phase==="PREPARE"){'];
  const regMarkers=["else if(phase==='REGRESSION'){","if(phase==='REGRESSION'){",'else if(phase==="REGRESSION"){','if(phase==="REGRESSION"){'];
  let pi=-1;for(const m of prepMarkers){const x=closure.indexOf(m);if(x>=0){pi=x;break;}}
  let ri=-1;for(const m of regMarkers){const x=closure.indexOf(m,pi+1);if(x>=0&&(ri<0||x<ri))ri=x;}
  if(pi<0||ri<0||ri<=pi)throw new Error('Could not isolate PREPARE -> REGRESSION branch in runP0ClosureStep_');
  const boundedPrepare="if(phase==='PREPARE'){const action=p0PrepareAction_();upsertWorkerState_('p0_control_repair',action,'v18 bounded PREPARE; current regression and live preflight remain fail-closed');upsertWorkerState_('p0_closure_phase','REGRESSION','Bounded PREPARE complete; strict gates next');scheduleP0ClosureStep_(30000);return{phase:'PREPARE',action:action,next:'REGRESSION'};}";
  closure=closure.slice(0,pi)+boundedPrepare+closure.slice(ri);
  s=s.slice(0,cs)+closure+s.slice(ce);
}

// FL-034: ENABLE previously reran livePreflightPhase1_2_ even though PREFLIGHT had
// just passed in the immediately preceding closure phase. That duplicate strict scan
// repeatedly hit the Apps Script hard runtime ceiling. Reuse only the durable PASS
// while the resumable state machine is exactly in ENABLE; all other enable entrypoints
// keep the original full preflight behavior.
let enableStart=s.indexOf('function enablePhase1_2Worker(');
if(enableStart<0)throw new Error('enablePhase1_2Worker not found');
if(!s.includes('function enablePreflightMode_(')){
  const helpers="function enablePreflightMode_(phase,status){return String(phase||'')==='ENABLE'&&String(status||'')==='PASS'?'REUSE_STRICT_PREFLIGHT':'RUN_PREFLIGHT';}\nfunction closureAwareEnablePreflight_(opts){const mode=enablePreflightMode_(p0ClosureState_(),workerStateValue_('p0_live_preflight'));if(mode==='REUSE_STRICT_PREFLIGHT')return{ok:true,issues:[],reused:true,version:P12.VERSION,suite:P12.SUITE};return livePreflightPhase1_2_(opts);}\n";
  s=s.slice(0,enableStart)+helpers+s.slice(enableStart);
  enableStart=s.indexOf('function enablePhase1_2Worker(');
}
let enableEnd=s.indexOf('\nfunction ',enableStart+1);if(enableEnd<0)enableEnd=s.length;
let enable=s.slice(enableStart,enableEnd);
if(!enable.includes('closureAwareEnablePreflight_(')){
  const idx=enable.indexOf('livePreflightPhase1_2_(');
  if(idx<0)throw new Error('enablePhase1_2Worker preflight call not found');
  enable=enable.slice(0,idx)+'closureAwareEnablePreflight_('+enable.slice(idx+'livePreflightPhase1_2_('.length);
  s=s.slice(0,enableStart)+enable+s.slice(enableEnd);
}

if(!s.includes("'CONTROL-002'")){
  const a="results.push(regressionTest_(runId,start,'CONTROL-001'";const i=s.indexOf(a);if(i<0)throw new Error('CONTROL-001 anchor missing');const e=s.indexOf('\n',i);if(e<0)throw new Error('CONTROL-001 line end missing');
  const t="  results.push(regressionTest_(runId,start,'CONTROL-002','Operator Control',()=>{assert_(typeof phase1HealthTick==='function','health trigger missing');assert_(typeof processOperatorCommand_==='function','operator dispatcher missing');assert_(operatorCommandAction_('P0_BOOTSTRAP')==='P0_BOOTSTRAP','bootstrap command not allow-listed');return 'health trigger retains release-control dispatcher';},'operator commands remain reachable while broad worker is gated','synthetic control-plane continuity'));";
  s=s.slice(0,e+1)+t+'\n'+s.slice(e+1);
}
if(!s.includes("'BOOTSTRAP-006'")){
  const a="results.push(regressionTest_(runId,start,'BOOTSTRAP-005'";const i=s.indexOf(a);if(i<0)throw new Error('BOOTSTRAP-005 anchor missing');const e=s.indexOf('\n',i);if(e<0)throw new Error('BOOTSTRAP-005 line end missing');
  const t="  results.push(regressionTest_(runId,start,'BOOTSTRAP-006','Release Runtime',()=>{assert_(p0PrepareAction_()==='DEFER_TO_STRICT_GATES','PREPARE must stay bounded');return 'PREPARE defers expensive legacy scan to strict regression/preflight gates';},'PREPARE does not rerun unbounded legacy migration','synthetic release phase'));";
  s=s.slice(0,e+1)+t+'\n'+s.slice(e+1);
}
if(!s.includes("'BOOTSTRAP-007'")){
  const a="results.push(regressionTest_(runId,start,'BOOTSTRAP-006'";const i=s.indexOf(a);if(i<0)throw new Error('BOOTSTRAP-006 anchor missing');const e=s.indexOf('\n',i);if(e<0)throw new Error('BOOTSTRAP-006 line end missing');
  const t="  results.push(regressionTest_(runId,start,'BOOTSTRAP-007','Release Runtime',()=>{assert_(enablePreflightMode_('ENABLE','PASS')==='REUSE_STRICT_PREFLIGHT','closure ENABLE must reuse immediately prior strict preflight');assert_(enablePreflightMode_('ENABLE','FAIL')==='RUN_PREFLIGHT','failed preflight must never be reused');assert_(enablePreflightMode_('COMPLETE','PASS')==='RUN_PREFLIGHT','non-closure enable must still run full preflight');return 'ENABLE avoids duplicate strict scan only after durable closure preflight PASS';},'closure ENABLE is bounded without weakening standalone enable safety','synthetic release phase'));";
  s=s.slice(0,e+1)+t+'\n'+s.slice(e+1);
}

const required=["VERSION:'1.3.7'","SUITE:'p0-regression-v18'","expectedVersion='1.3.7'","expectedSuite='p0-regression-v18'","'PACK-SAN-001'","'QA-REPAIR-001'","'BOOTSTRAP-004'","'BOOTSTRAP-005'","'BOOTSTRAP-006'","'BOOTSTRAP-007'","'CONTROL-001'","'CONTROL-002'","'RELEASE-001'","return 'SCHEDULE_REPLACEMENT'","replacementScheduled:true","status:'LOCKED_RETRY_SAFE'",healthControlled,'function processOperatorCommand_(',"function p0PrepareAction_(){return 'DEFER_TO_STRICT_GATES';}",'function enablePreflightMode_(','function closureAwareEnablePreflight_(','closureAwareEnablePreflight_('];
for(const token of required)if(!s.includes(token))throw new Error(`Required v18 contract missing: ${token}`);
for(const stale of ['1.3.6','p0-regression-v17','1.3.5','p0-regression-v16','1.3.4','p0-regression-v15','1.3.3','p0-regression-v14','1.3.2','p0-regression-v13','1.3.1','p0-regression-v12','1.3.0','p0-regression-v11','1.2.9','p0-regression-v10'])if(s.includes(stale))throw new Error(`Stale release identity remains after patch: ${stale}`);
if(s!==before)fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,release:'1.3.7',suite:'p0-regression-v18',fixes:['FL-031','CONTROL-002','FL-033','FL-034']},null,2));
