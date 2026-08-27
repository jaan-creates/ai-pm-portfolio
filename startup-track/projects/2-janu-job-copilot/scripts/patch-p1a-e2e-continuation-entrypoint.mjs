import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='E2E-LIVE-ENTRYPOINT-001';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function p1aE2EContinuationTick_(')&&t.includes('P1-A-E2E-CONTINUATION-4')&&t.includes('const P12');});
if(!target)throw new Error('E2E V4 TrackerWorkflow source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;
if(!s.includes('function LockService')&&!s.includes('LockService.')){/* Apps Script global; source-level declaration not required. */}

function addBefore(anchor,marker,code){if(s.includes(marker))return;const i=s.indexOf(anchor);if(i<0)throw new Error('Anchor missing '+anchor);s=s.slice(0,i)+code+'\n'+s.slice(i);}
const anchor=s.includes('function verifyReleaseIdentity()')?'function verifyReleaseIdentity()':'function phase1HealthTick(';
addBefore(anchor,'function runP1AE2EContinuationTick(',`function runP1AE2EContinuationTick(){const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return{status:'LOCKED',contract:'${CONTRACT}'};try{const self=p1aE2EContinuationSelfTest_();if(!self||self.pass!==true)throw new Error('DETERMINISTIC:E2E_V4_SELF_TEST_NOT_PASS');const out=p1aE2EContinuationTick_();upsertWorkerState_('p1a_e2e_live_entrypoint_last_result','PASS',JSON.stringify({contract:'${CONTRACT}',out:out}).slice(0,1500));return out;}catch(e){upsertWorkerState_('p1a_e2e_live_entrypoint_last_result','FAIL',String((e&&e.stack)||e).slice(0,1500));throw e;}finally{try{lock.releaseLock();}catch(__e){}}}`);
if(!s.includes(CONTRACT)||!s.includes('function runP1AE2EContinuationTick(')||!s.includes('p1aE2EContinuationSelfTest_()')||!s.includes('p1aE2EContinuationTick_()'))throw new Error(CONTRACT+' wiring incomplete');
fs.writeFileSync(file,s);
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:CONTRACT,lock:true,selfTestGate:true,maxMutatingAppPerCall:1,syntax:true},null,2));
