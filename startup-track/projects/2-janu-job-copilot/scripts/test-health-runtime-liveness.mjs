import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-health-runtime-'));
const fixture=`const P12={};
function upsertWorkerState_(){}
function healthSet_(){}
function circuitOpen_(name){return name==='Worker Runtime';}
function enforceReleaseBlockerHealth_(){healthSet_('Regression Gate','DEGRADED','OPEN');return {blocked:true};}
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
apply();
const once=fs.readFileSync(path.join(dir,'TrackerWorkflow.js'),'utf8');
apply();
const out=fs.readFileSync(path.join(dir,'TrackerWorkflow.js'),'utf8');
if(once!==out)throw new Error('health runtime patch is not idempotent');
for(const token of ['HEALTH-RUNTIME-RESERVE-002','HEALTH-RUNTIME-RESERVE-001','HEALTH-RUNTIME-TRACE-002','REGRESSION-HEALTH-FINAL-LOCK-001','healthRuntimeOptionalStage_','healthRuntimeStage_','healthRuntimePublish_','healthFinalReleaseLock_'])if(!out.includes(token))throw new Error('missing '+token);
if(out.includes('function healthRuntimeCheckpoint_('))throw new Error('V1 checkpoint write amplification survived');
const tickStart=out.indexOf('function phase1HealthTick('),tickEnd=out.indexOf('\n}',tickStart)+2,tick=out.slice(tickStart,tickEnd);
if(tick.lastIndexOf('healthFinalReleaseLock_(')<tick.lastIndexOf("healthSet_('Regression Gate','HEALTHY'"))throw new Error('final lock is not final');
for(const fn of ['p1aVacancyMaintenanceTick_','p1aJdRecoveryMaintenanceTick_','p1aE2EContinuationTick_','p1aClosedVacancyReconcileTick_','traceGoldenTick_'])if(!tick.includes("return "+fn+'();'))throw new Error('optional stage not bounded: '+fn);
for(const stage of ['operator-command','ensure-sheets','source-freshness','stale-lease-recovery','openai-probe'])if(!tick.includes("healthRuntimeStage_('"+stage+"'"))throw new Error('mandatory timing missing: '+stage);
const publishCount=(out.match(/function healthRuntimePublish_\(/g)||[]).length;if(publishCount!==1)throw new Error('expected one publish helper');
const syntax=spawnSync(process.execPath,['--check',path.join(dir,'TrackerWorkflow.js')],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({pass:true,contract:'HEALTH-RUNTIME-RESERVE-002',compat:'HEALTH-RUNTIME-RESERVE-001',trace:'HEALTH-RUNTIME-TRACE-002',finalLock:'REGRESSION-HEALTH-FINAL-LOCK-001',singlePublishTelemetry:true,idempotent:true},null,2));
