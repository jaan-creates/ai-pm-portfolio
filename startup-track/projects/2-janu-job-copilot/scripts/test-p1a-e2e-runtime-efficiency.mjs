import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const projectDir=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patcher=path.join(projectDir,'scripts','patch-p1a-e2e-runtime-efficiency.mjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-e2e-eff-'));
const file=path.join(dir,'TrackerWorkflow.js');
const fixture=`const P12={};
const JC={W:{JD:'JD_RETRIEVE'},S:{A:'Applications'}};
// P1-A-E2E-CONTINUATION-4
function queueMutationAllowed_(opts){return opts&&opts.recoverySafe===true;}
function workNeededFromState_(a,type){if(String(a['Decision']||'')!=='Apply')return false;if(['Closed','On Hold','Submitted','Rejected','Offer'].includes(String(a['Status']||'')))return false;if(type===JC.W.JD){const c=Number(a['JD Completeness %']||0),js=String(a['JD Snapshot Status']||'');return c<70||!/Full JD|Partial JD/.test(js);}return true;}
function upsertWorkerState_(){}
function p1aE2EContinuationTick_(){const aSheet=SH_(JC.S.A),last=aSheet.getLastRow();if(last<2)return{status:'NO_ROWS'};const cursor=0,rows=[2],nextCursor=2;let closedCount=0;for(let i=0;i<rows.length;i++){const r=rows[i],a=obj_(aSheet,r),id=String(a['Application ID']||'');if(!id)continue;if(p1aVerifyingJdNeedsRetrieve_(a)){const qj=p1aQueueWorkerState_(id,'JD_RETRIEVE');if(qj.state==='ACTIVE')continue;const url=String(a['Canonical Apply URL']||a['Job URL']||'').trim(),input=hash_(id+'|'+url+'|E2E-STRANDED-JD-001'),job=enqueue_(id,'JD_RETRIEVE',{source:'p1a-e2e-continuation-v4',reason:'STRANDED_VERIFYING_JD',contract:'E2E-STRANDED-JD-001'},input);if(!job)throw new Error('DETERMINISTIC:P1A_E2E_JD_ENQUEUE_FAILED');upsertWorkerState_('x','PASS','');const out={status:'STRANDED_VERIFYING_JD_ENQUEUED'};return out;}}return{status:'NO_ELIGIBLE_STALL',closedPropagated:closedCount,nextCursor};}
function runP1AE2EContinuationSelfTest(){return {pass:true};}
`;
fs.writeFileSync(file,fixture);
function apply(){const r=spawnSync(process.execPath,[patcher,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout||'efficiency patch failed');return r.stdout;}
apply();const once=fs.readFileSync(file,'utf8');apply();const out=fs.readFileSync(file,'utf8');
if(once!==out)throw new Error('E2E efficiency patch is not idempotent');
for(const token of ['E2E-BULK-SCAN-001','QUEUE-ADMISSION-REASON-001','QUEUE-JD-NEW-001','function p1aE2EBulkRows_(','function p1aE2EQueueAdmission_(','function p1aJdNewQueueEligible_(','p1aE2EBulkRows_(aSheet,rows)','JD_ENQUEUE_DEFERRED','DETERMINISTIC:P1A_E2E_JD_ENQUEUE_FAILED_AFTER_ADMISSION','p1aQueueWorkerState_(id,JC.W.JD)','enqueue_(id,JC.W.JD',"if(type===JC.W.JD&&p1aJdNewQueueEligible_(a))return true;"])if(!out.includes(token))throw new Error('missing '+token);
if(out.includes("p1aQueueWorkerState_(id,'JD_RETRIEVE')")||out.includes("enqueue_(id,'JD_RETRIEVE'"))throw new Error('literal JD worker path remains');
const gate=out.indexOf("if(type===JC.W.JD&&p1aJdNewQueueEligible_(a))return true;"),generic=out.indexOf("if(String(a['Decision']||'')!=='Apply')return false;");
if(gate<0||generic<0||gate>generic)throw new Error('trusted New JD admission must precede generic Apply gate');
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({status:'PASS',bulk:'E2E-BULK-SCAN-001',admission:'QUEUE-ADMISSION-REASON-001',jdNew:'QUEUE-JD-NEW-001',idempotent:true,jdWorkerConstant:true,circuitDefer:true,newDecisionAdmissionAheadOfApplyGate:true,syntax:true},null,2));
