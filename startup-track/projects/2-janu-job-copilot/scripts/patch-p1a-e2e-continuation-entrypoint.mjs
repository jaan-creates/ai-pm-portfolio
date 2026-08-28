import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='E2E-LIVE-ENTRYPOINT-001';
const PAYLOAD_CONTRACT='E2E-JD-PAYLOAD-001';
const ADMISSION_CONTRACT='JD-PREDECISION-ADMISSION-001';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function p1aE2EContinuationTick_(')&&t.includes('P1-A-E2E-CONTINUATION-4')&&t.includes('const P12');});
if(!target)throw new Error('E2E V4 TrackerWorkflow source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;
const oldPayload="enqueue_(id,'JD_RETRIEVE',{source:'p1a-e2e-continuation-v4',reason:'STRANDED_VERIFYING_JD',contract:'E2E-STRANDED-JD-001'},input)";
const newPayload="enqueue_(id,'JD_RETRIEVE',{url:url,source:'p1a-e2e-continuation-v4',reason:'STRANDED_VERIFYING_JD',contract:'E2E-STRANDED-JD-001',payloadContract:'E2E-JD-PAYLOAD-001'},input)";
if(s.includes(oldPayload))s=s.replace(oldPayload,newPayload);
if(!s.includes(newPayload))throw new Error(PAYLOAD_CONTRACT+' stranded JD payload wiring missing');
if(!s.includes(PAYLOAD_CONTRACT))s+='\n// '+PAYLOAD_CONTRACT+' requires JD_RETRIEVE payload.url for live stranded-JD recovery.\n';
const code=`function runP1AE2EContinuationTick(){const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return{status:'LOCKED',contract:'${CONTRACT}'};try{const self=p1aE2EContinuationSelfTest_();if(!self||self.pass!==true)throw new Error('DETERMINISTIC:E2E_V4_SELF_TEST_NOT_PASS');const out=p1aE2EContinuationTick_();upsertWorkerState_('p1a_e2e_live_entrypoint_last_result','PASS',JSON.stringify({contract:'${CONTRACT}',payloadContract:'${PAYLOAD_CONTRACT}',admissionContract:'${ADMISSION_CONTRACT}',out:out}).slice(0,1500));return out;}catch(e){upsertWorkerState_('p1a_e2e_live_entrypoint_last_result','FAIL',String((e&&e.stack)||e).slice(0,1500));throw e;}finally{try{lock.releaseLock();}catch(__e){}}}`;
if(!s.includes('function runP1AE2EContinuationTick(')){
  const anchors=['function verifyReleaseIdentity()','function phase1HealthTick('];
  const anchor=anchors.find(a=>s.includes(a));
  if(anchor){const i=s.indexOf(anchor);s=s.slice(0,i)+code+'\n'+s.slice(i);}else{s+='\n'+code+'\n';}
}
if(!s.includes(CONTRACT)||!s.includes(PAYLOAD_CONTRACT)||!s.includes('function runP1AE2EContinuationTick(')||!s.includes('p1aE2EContinuationSelfTest_()')||!s.includes('p1aE2EContinuationTick_()'))throw new Error(CONTRACT+' wiring incomplete');
fs.writeFileSync(file,s);
let admissionApplied=false;
if(s.includes('function workNeededFromState_(')){
  const admission=spawnSync(process.execPath,[path.resolve(path.dirname(new URL(import.meta.url).pathname),'patch-jd-predecision-admission.mjs'),root],{encoding:'utf8'});
  if(admission.status!==0)throw new Error(admission.stderr||admission.stdout||ADMISSION_CONTRACT+' patch failed');
  s=fs.readFileSync(file,'utf8');
  if(!s.includes(ADMISSION_CONTRACT))throw new Error(ADMISSION_CONTRACT+' not composed');
  admissionApplied=true;
}
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:CONTRACT,payloadContract:PAYLOAD_CONTRACT,admissionContract:ADMISSION_CONTRACT,admissionApplied,lock:true,selfTestGate:true,jdRetrievePayloadUrl:true,maxMutatingAppPerCall:1,anchorFallback:true,syntax:true},null,2));
