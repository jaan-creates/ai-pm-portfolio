import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-health-runtime-'));
const fixture=`const P12={};
function upsertWorkerState_(){}
function healthSet_(){}
function SH_(){return {getLastRow(){return 1},getRange(){return {getDisplayValue(){return''},createTextFinder(){return {matchEntireCell(){return this},findNext(){return null}}}}}}}
function hm_(){return {}}
function circuitOpen_(name){return name==='Worker Runtime';}
function enforceReleaseBlockerHealth_(){healthSet_('Regression Gate','DEGRADED','OPEN');return {blocked:true,ids:['FL-060'],recurrence:'SELF_TEST_PASS_CANARY_PENDING',replay:'BLOCKED_FL060_QUARANTINE_BREACH'};}
function processOperatorCommand_(){}
function ensureP12Sheets_(){}
function sourceFreshnessHealth_(){}
function recoverStaleQueueLeases_(){}
function probeOpenAIHealth_(){}
function p1aVacancyMaintenanceTick_(){}
function p1aJdRecoveryMaintenanceTick_(){}
function p1aE2EContinuationTick_(){}
function p1aClosedVacancyReconcileTick_(){}
function traceGoldenTick_(){}
const LockService={getScriptLock(){return {tryLock(){return true},releaseLock(){}}}};
function verifyReleaseIdentity(){return true;}
function phase1HealthTick(){
  processOperatorCommand_();
  ensureP12Sheets_();
  sourceFreshnessHealth_();
  recoverStaleQueueLeases_();
  probeOpenAIHealth_();
  enforceReleaseBlockerHealth_();
  healthSet_('Regression Gate','HEALTHY','CLOSED');
  p1aVacancyMaintenanceTick_();
  p1aJdRecoveryMaintenanceTick_();
  p1aE2EContinuationTick_();
  p1aClosedVacancyReconcileTick_();
  traceGoldenTick_();
  if(false)return 'early';
  return 'done';
}`;
fs.writeFileSync(path.join(dir,'TrackerWorkflow.js'),fixture);
const patch=path.resolve(path.dirname(new URL(import.meta.url).pathname),'patch-health-runtime-liveness.mjs');
function apply(){const r=spawnSync(process.execPath,[patch,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout||'patch failed');return r.stdout;}
function fnSource(text,name){const start=text.indexOf('function '+name+'(');if(start<0)throw new Error(name+' missing');const open=text.indexOf('{',start);let d=0,q=null,e=false,line=false,block=false;for(let i=open;i<text.length;i++){const c=text[i],n=text[i+1]||'';if(line){if(c==='\n')line=false;continue;}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(start,i+1);}throw new Error('unterminated '+name);}
apply();
const once=fs.readFileSync(path.join(dir,'TrackerWorkflow.js'),'utf8');
apply();
const out=fs.readFileSync(path.join(dir,'TrackerWorkflow.js'),'utf8');
if(once!==out)throw new Error('health runtime/control-plane patch is not idempotent');
for(const token of ['HEALTH-RUNTIME-RESERVE-002','HEALTH-RUNTIME-RESERVE-001','HEALTH-RUNTIME-TRACE-002','HEALTH-OPTIONAL-BUDGET-003','REGRESSION-HEALTH-FINAL-LOCK-001','REGRESSION-HEALTH-BLOCKER-READBACK-001','HEALTH-CONTROL-PLANE-001','HEALTH-CONSISTENCY-001','JD-RECOVERY-ISOLATION-001','healthRuntimeOptionalStage_','healthRuntimeCheckpoint_','healthFinalReleaseLock_','health_tick_trace','phase1JdRecoveryTick','health_runtime_slo_ms'])if(!out.includes(token))throw new Error('missing '+token);
const tick=fnSource(out,'phase1HealthTick');
if(tick.lastIndexOf('healthFinalReleaseLock_(')<tick.lastIndexOf("healthSet_('Regression Gate','HEALTHY'"))throw new Error('final lock is not final');
for(const fn of ['p1aVacancyMaintenanceTick_','p1aE2EContinuationTick_','p1aClosedVacancyReconcileTick_','traceGoldenTick_'])if(!tick.includes("return "+fn+'();'))throw new Error('optional stage not bounded: '+fn);
if(tick.includes('p1aJdRecoveryMaintenanceTick_('))throw new Error('JD recovery mutation remains in health control plane');
if(!tick.includes('jd-recovery:ISOLATED'))throw new Error('JD recovery isolation telemetry missing');
const jd=fnSource(out,'phase1JdRecoveryTick');if(!jd.includes('p1aJdRecoveryMaintenanceTick_('))throw new Error('standalone JD recovery tick missing work-plane call');
const lock=fnSource(out,'healthFinalReleaseLock_');
for(const token of ['healthComponentSnapshot_','HEALTH_STATE_INCONSISTENT','REGRESSION-HEALTH-BLOCKER-READBACK-001','if(base&&base.blocked)','RELEASE_BLOCKER_OPEN','blocker truth must survive generic health publication'])if(!lock.includes(token))throw new Error('health blocker final-lock regression missing '+token);
const lockVm=`let gate={found:true,status:'HEALTHY',circuit:'CLOSED',errorCode:'',errorDetail:''};function enforceReleaseBlockerHealth_(){return{blocked:true,ids:['FL-060','FL-063'],recurrence:'SELF_TEST_PASS_CANARY_PENDING',replay:'BLOCKED_FL060_QUARANTINE_BREACH'}}function healthComponentSnapshot_(name){if(name==='Worker Runtime')return{found:true,status:'HEALTHY',circuit:'CLOSED',errorCode:'',errorDetail:''};return Object.assign({},gate)}function healthConsistencyDecision_(){return{kind:'OK'}}function healthSet_(name,status,circuit,errorCode,errorDetail){if(name==='Regression Gate')gate={found:true,status,circuit,errorCode,errorDetail}}${lock};const result=healthFinalReleaseLock_();console.log(JSON.stringify({result,gate}));`;
const lockRun=spawnSync(process.execPath,['-e',lockVm],{encoding:'utf8'});if(lockRun.status!==0)throw new Error(lockRun.stderr||lockRun.stdout);const lockGot=JSON.parse(lockRun.stdout.trim());if(!lockGot.result.blocked||lockGot.gate.status!=='DEGRADED'||lockGot.gate.circuit!=='OPEN'||lockGot.gate.errorCode!=='RELEASE_BLOCKER_OPEN')throw new Error('REGRESSION-HEALTH-BLOCKER-READBACK-001 fixture failed '+JSON.stringify(lockGot));
const opt=fnSource(out,'healthRuntimeOptionalStage_');if(!opt.includes('elapsed>=60000'))throw new Error('HEALTH-OPTIONAL-BUDGET-003 executable 60s deadline missing');
const prevention=fnSource(out,'healthRuntimePreventionContract_');if(!prevention.includes("budgetContract:'HEALTH-OPTIONAL-BUDGET-003'")||!prevention.includes("blockerReadback:'REGRESSION-HEALTH-BLOCKER-READBACK-001'")||!prevention.includes('optionalDeadlineMs:60000'))throw new Error('health prevention contract did not converge to current budget/blocker readback');
const cp=fnSource(out,'healthRuntimeCheckpoint_');
if(!cp.includes("String(stage)==='COMPLETE'"))throw new Error('terminal-only publish guard missing');
if((cp.match(/upsertWorkerState_/g)||[]).length!==4)throw new Error('checkpoint must publish exactly four Worker State rows');
if(!cp.includes('HEALTH_RUNTIME_TRACE_.push'))throw new Error('in-memory trace missing');
const syntax=spawnSync(process.execPath,['--check',path.join(dir,'TrackerWorkflow.js')],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({pass:true,contract:'HEALTH-RUNTIME-RESERVE-002',compat:'HEALTH-RUNTIME-RESERVE-001',trace:'HEALTH-RUNTIME-TRACE-002',budget:'HEALTH-OPTIONAL-BUDGET-003',optionalDeadlineMs:60000,finalLock:'REGRESSION-HEALTH-FINAL-LOCK-001',blockerReadback:'REGRESSION-HEALTH-BLOCKER-READBACK-001',controlPlane:'HEALTH-CONTROL-PLANE-001',consistency:'HEALTH-CONSISTENCY-001',jdIsolation:'JD-RECOVERY-ISOLATION-001',healthSloMs:180000,terminalOnlyTelemetry:true,healthMutatesJdRecovery:false,blockerFixture:true,idempotent:true},null,2));
