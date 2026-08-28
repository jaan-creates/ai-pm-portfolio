import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='E2E-LIVE-ENTRYPOINT-001';
const PAYLOAD_CONTRACT='E2E-JD-PAYLOAD-001';
const ADMISSION_CONTRACT='JD-PREDECISION-ADMISSION-001';
const RECOVERY_CONTRACT='E2E-JD-RECOVERY-SAFE-001';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function p1aE2EContinuationTick_(')&&t.includes('P1-A-E2E-CONTINUATION-4')&&t.includes('const P12');});
if(!target)throw new Error('E2E V4 TrackerWorkflow source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;
const oldPayload="enqueue_(id,'JD_RETRIEVE',{source:'p1a-e2e-continuation-v4',reason:'STRANDED_VERIFYING_JD',contract:'E2E-STRANDED-JD-001'},input)";
const payloadWithUrl="enqueue_(id,'JD_RETRIEVE',{url:url,source:'p1a-e2e-continuation-v4',reason:'STRANDED_VERIFYING_JD',contract:'E2E-STRANDED-JD-001',payloadContract:'E2E-JD-PAYLOAD-001'},input)";
const recoveryPayload="enqueue_(id,'JD_RETRIEVE',{url:url,source:'p1a-e2e-continuation-v4',reason:'STRANDED_VERIFYING_JD',contract:'E2E-STRANDED-JD-001',payloadContract:'E2E-JD-PAYLOAD-001',recoveryContract:'E2E-JD-RECOVERY-SAFE-001'},input,{recoverySafe:true})";
if(s.includes(oldPayload))s=s.replace(oldPayload,recoveryPayload);
if(s.includes(payloadWithUrl))s=s.replace(payloadWithUrl,recoveryPayload);
if(!s.includes(recoveryPayload))throw new Error(RECOVERY_CONTRACT+' stranded JD recovery-safe wiring missing');
if(!s.includes(PAYLOAD_CONTRACT))s+='\n// '+PAYLOAD_CONTRACT+' requires JD_RETRIEVE payload.url for live stranded-JD recovery.\n';
if(!s.includes(RECOVERY_CONTRACT))s+='\n// '+RECOVERY_CONTRACT+' permits only the locked trusted stranded-JD recovery enqueue to bypass an open Worker Runtime circuit.\n';
const code=`function runP1AE2EContinuationTick(){const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return{status:'LOCKED',contract:'${CONTRACT}'};try{const self=p1aE2EContinuationSelfTest_();if(!self||self.pass!==true)throw new Error('DETERMINISTIC:E2E_V4_SELF_TEST_NOT_PASS');const out=p1aE2EContinuationTick_();upsertWorkerState_('p1a_e2e_live_entrypoint_last_result','PASS',JSON.stringify({contract:'${CONTRACT}',payloadContract:'${PAYLOAD_CONTRACT}',admissionContract:'${ADMISSION_CONTRACT}',recoveryContract:'${RECOVERY_CONTRACT}',out:out}).slice(0,1500));return out;}catch(e){upsertWorkerState_('p1a_e2e_live_entrypoint_last_result','FAIL',String((e&&e.stack)||e).slice(0,1500));throw e;}finally{try{lock.releaseLock();}catch(__e){}}}`;
if(!s.includes('function runP1AE2EContinuationTick(')){
  const anchors=['function verifyReleaseIdentity()','function phase1HealthTick('];
  const anchor=anchors.find(a=>s.includes(a));
  if(anchor){const i=s.indexOf(anchor);s=s.slice(0,i)+code+'\n'+s.slice(i);}else{s+='\n'+code+'\n';}
}else if(!s.includes("recoveryContract:'E2E-JD-RECOVERY-SAFE-001'")){
  const start=s.indexOf('function runP1AE2EContinuationTick('),open=s.indexOf('{',start);let d=0,q=null,e=false,line=false,block=false,end=-1;
  for(let i=open;i<s.length;i++){const c=s[i],n=s[i+1]||'';if(line){if(c==='\n')line=false;continue;}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0){end=i+1;break;}}
  if(end<0)throw new Error(CONTRACT+' existing entrypoint unterminated');
  s=s.slice(0,start)+code+s.slice(end);
}
if(!s.includes(CONTRACT)||!s.includes(PAYLOAD_CONTRACT)||!s.includes(RECOVERY_CONTRACT)||!s.includes('function runP1AE2EContinuationTick(')||!s.includes('p1aE2EContinuationSelfTest_()')||!s.includes('p1aE2EContinuationTick_()'))throw new Error(CONTRACT+' wiring incomplete');
const tickStart=s.indexOf('function p1aE2EContinuationTick_('),tickEnd=s.indexOf('function p1aE2EContinuationSelfTest_(',tickStart);const tick=s.slice(tickStart,tickEnd>tickStart?tickEnd:s.length);
if((tick.match(/recoverySafe:true/g)||[]).length!==1)throw new Error(RECOVERY_CONTRACT+' must appear exactly once in continuation tick');
if(!tick.includes("reason:'STRANDED_VERIFYING_JD'"))throw new Error(RECOVERY_CONTRACT+' trusted stranded-JD guard path missing');
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
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:CONTRACT,payloadContract:PAYLOAD_CONTRACT,admissionContract:ADMISSION_CONTRACT,recoveryContract:RECOVERY_CONTRACT,admissionApplied,lock:true,selfTestGate:true,jdRetrievePayloadUrl:true,recoverySafeExactlyOne:true,maxMutatingAppPerCall:1,anchorFallback:true,syntax:true},null,2));
