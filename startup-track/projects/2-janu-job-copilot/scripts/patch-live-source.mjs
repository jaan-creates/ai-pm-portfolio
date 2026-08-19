import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || '.janu-live';
const files = fs.readdirSync(root).filter(f => f.endsWith('.gs') || f.endsWith('.js'));
if (!files.length) throw new Error(`No .gs/.js Apps Script files found in ${root}`);

const target = files.find(f => {
  const t = fs.readFileSync(path.join(root, f), 'utf8');
  return t.includes('function verifyReleaseIdentity()') && t.includes('const P12');
});
if (!target) throw new Error('Could not locate TrackerWorkflow source after clasp pull');

const file = path.join(root, target);
let s = fs.readFileSync(file, 'utf8');
const before = s;

// Remove stale embedded release header inherited from the v10 ancestor.
s = s.replace('// RELEASE: 1.2.9\n// REGRESSION SUITE: p0-regression-v10\n// GENERATED: 2026-08-19 01:15 IST\n', '');

// Normalize the complete release identity surface to v14.
s = s.replaceAll('1.3.2', '1.3.3');
s = s.replaceAll('p0-regression-v13', 'p0-regression-v14');
s = s.replace("expectedVersion='1.3.1', expectedSuite='p0-regression-v12'", "expectedVersion='1.3.3', expectedSuite='p0-regression-v14'");
s = s.replace("expectedVersion='1.3.3', expectedSuite='p0-regression-v12'", "expectedVersion='1.3.3', expectedSuite='p0-regression-v14'");
s = s.replace('// RELEASE: 1.3.1', '// RELEASE: 1.3.3');
s = s.replace('// REGRESSION SUITE: p0-regression-v12', '// REGRESSION SUITE: p0-regression-v14');

// Closure lock collisions must preserve or recreate a continuation.
const scheduleFn = "function scheduleP0ClosureStep_(delayMs){clearP0ClosureStepTriggers_();ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||30000))).create();}";
const collisionHelpers = `${scheduleFn}\nfunction p0ClosureTriggerCount_(){return ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='runP0ClosureStep_').length;}\nfunction lockCollisionAction_(triggerCount){return Number(triggerCount||0)>0?'KEEP_EXISTING':'SCHEDULE_RETRY';}\nfunction ensureP0ClosureRetryTrigger_(delayMs){const count=p0ClosureTriggerCount_(),action=lockCollisionAction_(count);if(action==='SCHEDULE_RETRY')ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||60000))).create();upsertWorkerState_('p0_closure_lock_retry',action,iso_());return{action:action,existingTriggers:count};}`;
if (!s.includes('function lockCollisionAction_(')) {
  if (!s.includes(scheduleFn)) throw new Error('Expected scheduleP0ClosureStep_ signature not found');
  s = s.replace(scheduleFn, collisionHelpers);
}

const oldStart = "function runP0ClosureStep_(){const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return{status:'LOCKED'};clearP0ClosureStepTriggers_();";
const newStart = "function runP0ClosureStep_(){const lock=LockService.getScriptLock();if(!lock.tryLock(1000)){const retry=ensureP0ClosureRetryTrigger_(60000);return{status:'LOCKED_RETRY_SAFE',retry:retry};}clearP0ClosureStepTriggers_();";
if (s.includes(oldStart)) s = s.replace(oldStart, newStart);
if (!s.includes(newStart)) throw new Error('Retry-safe lock-collision handling is missing');

// Allow-listed operator command plane. No arbitrary evaluation is permitted.
const upsertFn = "function upsertWorkerState_(key,value,notes){const s=SH_('__Worker State'),m=hm_(s),f=s.getLastRow()>1?s.getRange(2,m['Key'],s.getLastRow()-1,1).createTextFinder(String(key)).matchEntireCell(true).findNext():null;if(f)set_('__Worker State',f.getRow(),{'Key':key,'Value':value,'Updated At':now_(),'Notes':notes||''});else append_('__Worker State',{'Key':key,'Value':value,'Updated At':now_(),'Notes':notes||''});}";
const controlHelpers = `${upsertFn}\nfunction workerStateValue_(key){const s=SH_('__Worker State'),m=hm_(s);if(s.getLastRow()<2||!m['Key']||!m['Value'])return'';const f=s.getRange(2,m['Key'],s.getLastRow()-1,1).createTextFinder(String(key)).matchEntireCell(true).findNext();return f?String(s.getRange(f.getRow(),m['Value']).getDisplayValue()||''):'';}\nfunction operatorCommandAction_(cmd){const c=String(cmd||'').trim().toUpperCase();return['P0_BOOTSTRAP','RUN_REGRESSION','RUN_PREFLIGHT','ENABLE_WORKER','DISABLE_WORKER','ONE_JOB_TICK'].includes(c)?c:'REJECT';}\nfunction processOperatorCommand_(){const raw=workerStateValue_('operator_command'),cmd=operatorCommandAction_(raw);if(!String(raw||'').trim())return null;const id=String(workerStateValue_('operator_command_id')||'').trim();if(!id){upsertWorkerState_('operator_command_status','REJECTED','Missing operator_command_id');upsertWorkerState_('operator_command_result','Missing operator_command_id',iso_());upsertWorkerState_('operator_command','',iso_());return{handled:true,status:'REJECTED',command:String(raw)};}const claim='OPCMD_'+hash_(id),prior=P_().getProperty(claim);if(prior){let parsed={};try{parsed=JSON.parse(prior);}catch(e){parsed={status:'SUCCEEDED',result:prior};}upsertWorkerState_('operator_command_status',parsed.status||'SUCCEEDED','Idempotent replay '+id);upsertWorkerState_('operator_command_result',String(parsed.result||prior).slice(0,45000),iso_());upsertWorkerState_('operator_command','',iso_());return{handled:true,status:parsed.status||'SUCCEEDED',command:String(raw),id:id,replayed:true};}if(cmd==='REJECT'){const rej={status:'REJECTED',result:'Unknown operator command '+String(raw)};P_().setProperty(claim,JSON.stringify(rej));upsertWorkerState_('operator_command_status','REJECTED','Command '+id);upsertWorkerState_('operator_command_result',rej.result,iso_());upsertWorkerState_('operator_command','',iso_());return{handled:true,status:'REJECTED',command:String(raw),id:id};}upsertWorkerState_('operator_command_status','RUNNING',cmd+' '+id);upsertWorkerState_('operator_command_result','',iso_());let result;try{if(cmd==='P0_BOOTSTRAP')result=runP0ClosureBootstrap();else if(cmd==='RUN_REGRESSION')result=runPhase1_2RegressionSuite();else if(cmd==='RUN_PREFLIGHT')result=livePreflightPhase1_2_({forEnable:false,repair:false});else if(cmd==='ENABLE_WORKER')result=enablePhase1_2Worker();else if(cmd==='DISABLE_WORKER')result=disablePhase1_2Worker();else if(cmd==='ONE_JOB_TICK')result=phase1OneJobTickCore_();const out=JSON.stringify(result===undefined?null:result);P_().setProperty(claim,JSON.stringify({status:'SUCCEEDED',result:out}));upsertWorkerState_('operator_command_status','SUCCEEDED',cmd+' '+id);upsertWorkerState_('operator_command_result',out.slice(0,45000),iso_());upsertWorkerState_('operator_command','',iso_());return{handled:true,status:'SUCCEEDED',command:cmd,id:id,result:result};}catch(e){const msg=String((e&&e.stack)||e||'').slice(0,45000);P_().setProperty(claim,JSON.stringify({status:'FAILED',result:msg}));upsertWorkerState_('operator_command_status','FAILED',cmd+' '+id);upsertWorkerState_('operator_command_result',msg,iso_());upsertWorkerState_('operator_command','',iso_());try{learnRuntimeFailure_('SYSTEM','OPERATOR_'+cmd,e);}catch(le){}return{handled:true,status:'FAILED',command:cmd,id:id,error:String((e&&e.message)||e)};}}`;
if (!s.includes('function processOperatorCommand_(')) {
  if (!s.includes(upsertFn)) throw new Error('Expected upsertWorkerState_ signature not found');
  s = s.replace(upsertFn, controlHelpers);
}

const oldTick = "function phase1OneJobTick(){const l=LockService.getScriptLock();if(!l.tryLock(5000))return{status:'LOCKED'};try{return phase1OneJobTickCore_();}finally{l.releaseLock();}}";
const newTick = "function phase1OneJobTick(){const op=processOperatorCommand_();if(op)return op;const l=LockService.getScriptLock();if(!l.tryLock(5000))return{status:'LOCKED'};try{return phase1OneJobTickCore_();}finally{l.releaseLock();}}";
if (s.includes(oldTick)) s = s.replace(oldTick, newTick);
if (!s.includes(newTick)) throw new Error('Operator command dispatch is not wired into phase1OneJobTick');

// Add release regressions for lock continuation and command allowlist/idempotent dispatcher presence.
const b3 = "results.push(regressionTest_(runId,start,'BOOTSTRAP-003','Release Runtime',()=>{const e=new Error('Service Spreadsheets failed while accessing document with id X.');assert_(classifyError_(e).kind==='TRANSIENT','google service error not transient');assert_(closureRetryable_(e,1)===true,'attempt 1 should retry');assert_(closureRetryable_(e,3)===false,'attempt 3 must stop');return 'transient closure retry bounded';},'Google Workspace transient errors retry same phase with bounded attempts','synthetic transient closure'));";
const b4 = "results.push(regressionTest_(runId,start,'BOOTSTRAP-004','Release Runtime',()=>{assert_(lockCollisionAction_(0)==='SCHEDULE_RETRY','missing trigger must schedule retry');assert_(lockCollisionAction_(1)==='KEEP_EXISTING','existing watchdog must be preserved');return 'lock collision preserves or recreates continuation';},'lock collision never abandons closure continuation','synthetic trigger topology'));";
if (!s.includes("'BOOTSTRAP-004'")) {
  if (!s.includes(b3)) throw new Error('BOOTSTRAP-003 anchor not found');
  s = s.replace(b3, `${b3}\n  ${b4}`);
}

const qa = "results.push(regressionTest_(runId,start,'QA-REPAIR-001','QA Remediation',()=>{assert_(qaRepairDecision_({passed:false,text_readable:true,structure_ok:true})==='REGENERATE','failed QA must regenerate');assert_(qaRepairDecision_({passed:true,text_readable:true,structure_ok:true})==='PASS','clean QA must pass');return 'failed QA routes to fresh resume generation';},'REGENERATE on failed QA; PASS on clean QA','synthetic QA outcome'));";
const control = "results.push(regressionTest_(runId,start,'CONTROL-001','Operator Control',()=>{assert_(operatorCommandAction_('P0_BOOTSTRAP')==='P0_BOOTSTRAP','bootstrap not allow-listed');assert_(operatorCommandAction_('ONE_JOB_TICK')==='ONE_JOB_TICK','one-job tick not allow-listed');assert_(operatorCommandAction_('eval(1)')==='REJECT','unknown command not rejected');assert_(typeof processOperatorCommand_==='function','dispatcher missing');return 'fixed allowlist + dispatcher';},'only fixed operator commands accepted; unknown commands rejected','synthetic control command'));";
if (!s.includes("'CONTROL-001'")) {
  if (!s.includes(qa)) throw new Error('QA-REPAIR-001 anchor not found');
  s = s.replace(qa, `${qa}\n  ${control}`);
}

const required = [
  "VERSION:'1.3.3'",
  "SUITE:'p0-regression-v14'",
  "expectedVersion='1.3.3'",
  "expectedSuite='p0-regression-v14'",
  "'PACK-SAN-001'",
  "'QA-REPAIR-001'",
  "'BOOTSTRAP-004'",
  "'CONTROL-001'",
  'function processOperatorCommand_('
];
for (const token of required) if (!s.includes(token)) throw new Error(`Required v14 contract missing: ${token}`);

for (const stale of ['1.3.2','p0-regression-v13','1.3.1','p0-regression-v12','1.3.0','p0-regression-v11','1.2.9','p0-regression-v10']) {
  if (s.includes(stale)) throw new Error(`Stale release identity remains after patch: ${stale}`);
}

if (s !== before) fs.writeFileSync(file, s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,release:'1.3.3',suite:'p0-regression-v14'}, null, 2));
