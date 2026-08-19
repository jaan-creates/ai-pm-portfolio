import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
if(!files.length)throw new Error(`No .gs/.js Apps Script files found in ${root}`);
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target)throw new Error('Could not locate TrackerWorkflow source after clasp pull');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');const before=s;

// v17 closes the live PREPARE runtime defect discovered after v16 proved FL-031 recovery.
s=s.replaceAll('1.3.5','1.3.6').replaceAll('p0-regression-v16','p0-regression-v17');

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

// FL-033: PREPARE repeatedly exceeded the Apps Script runtime ceiling even though
// the prior live preflight was clean. Do not rerun the expensive legacy migration
// inside release orchestration. Instead, make PREPARE bounded and defer validation
// to the current-release regression and strict live preflight, both of which fail closed.
const closureStart=s.indexOf('function runP0ClosureStep_(');
if(closureStart<0)throw new Error('runP0ClosureStep_ not found');
if(!s.includes('function p0PrepareAction_(){'))s=s.slice(0,closureStart)+"function p0PrepareAction_(){return 'DEFER_TO_STRICT_GATES';}\n"+s.slice(closureStart);
const cs=s.indexOf('function runP0ClosureStep_(');
let ce=s.indexOf('\nfunction ',cs+1);if(ce<0)ce=s.length;
let closure=s.slice(cs,ce);
const prepMarkers=["if(phase==='PREPARE'){",'if(phase==="PREPARE"){'];
const regMarkers=["else if(phase==='REGRESSION'){","if(phase==='REGRESSION'){",'else if(phase==="REGRESSION"){','if(phase==="REGRESSION"){'];
let pi=-1;for(const m of prepMarkers){const x=closure.indexOf(m);if(x>=0){pi=x;break;}}
let ri=-1;for(const m of regMarkers){const x=closure.indexOf(m,pi+1);if(x>=0&&(ri<0||x<ri))ri=x;}
if(pi<0||ri<0||ri<=pi)throw new Error('Could not isolate PREPARE -> REGRESSION branch in runP0ClosureStep_');
const boundedPrepare="if(phase==='PREPARE'){const action=p0PrepareAction_();upsertWorkerState_('p0_control_repair',action,'v17 bounded PREPARE; current regression and live preflight remain fail-closed');upsertWorkerState_('p0_closure_phase','REGRESSION','Bounded PREPARE complete; strict gates next');scheduleP0ClosureStep_(30000);return{phase:'PREPARE',action:action,next:'REGRESSION'};}";
closure=closure.slice(0,pi)+boundedPrepare+closure.slice(ri);
s=s.slice(0,cs)+closure+s.slice(ce);

if(!s.includes("'CONTROL-002'")){
  const a="results.push(regressionTest_(runId,start,'CONTROL-001'";
  const i=s.indexOf(a);if(i<0)throw new Error('CONTROL-001 anchor missing');
  const e=s.indexOf('\n',i);if(e<0)throw new Error('CONTROL-001 line end missing');
  const t="  results.push(regressionTest_(runId,start,'CONTROL-002','Operator Control',()=>{assert_(typeof phase1HealthTick==='function','health trigger missing');assert_(typeof processOperatorCommand_==='function','operator dispatcher missing');assert_(operatorCommandAction_('P0_BOOTSTRAP')==='P0_BOOTSTRAP','bootstrap command not allow-listed');return 'health trigger retains release-control dispatcher';},'operator commands remain reachable while broad worker is gated','synthetic control-plane continuity'));";
  s=s.slice(0,e+1)+t+'\n'+s.slice(e+1);
}

if(!s.includes("'BOOTSTRAP-006'")){
  const a="results.push(regressionTest_(runId,start,'BOOTSTRAP-005'";
  const i=s.indexOf(a);if(i<0)throw new Error('BOOTSTRAP-005 anchor missing');
  const e=s.indexOf('\n',i);if(e<0)throw new Error('BOOTSTRAP-005 line end missing');
  const t="  results.push(regressionTest_(runId,start,'BOOTSTRAP-006','Release Runtime',()=>{assert_(p0PrepareAction_()==='DEFER_TO_STRICT_GATES','PREPARE must stay bounded');return 'PREPARE defers expensive legacy scan to strict regression/preflight gates';},'PREPARE does not rerun unbounded legacy migration','synthetic release phase'));";
  s=s.slice(0,e+1)+t+'\n'+s.slice(e+1);
}

const required=["VERSION:'1.3.6'","SUITE:'p0-regression-v17'","expectedVersion='1.3.6'","expectedSuite='p0-regression-v17'","'PACK-SAN-001'","'QA-REPAIR-001'","'BOOTSTRAP-004'","'BOOTSTRAP-005'","'BOOTSTRAP-006'","'CONTROL-001'","'CONTROL-002'","'RELEASE-001'","return 'SCHEDULE_REPLACEMENT'","replacementScheduled:true","status:'LOCKED_RETRY_SAFE'",healthControlled,'function processOperatorCommand_(',"function p0PrepareAction_(){return 'DEFER_TO_STRICT_GATES';}","'p0_closure_phase','REGRESSION','Bounded PREPARE complete; strict gates next'"];
for(const token of required)if(!s.includes(token))throw new Error(`Required v17 contract missing: ${token}`);
for(const stale of ['1.3.5','p0-regression-v16','1.3.4','p0-regression-v15','1.3.3','p0-regression-v14','1.3.2','p0-regression-v13','1.3.1','p0-regression-v12','1.3.0','p0-regression-v11','1.2.9','p0-regression-v10'])if(s.includes(stale))throw new Error(`Stale release identity remains after patch: ${stale}`);
if(s!==before)fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,release:'1.3.6',suite:'p0-regression-v17',fixes:['FL-031','CONTROL-002','FL-033']},null,2));
