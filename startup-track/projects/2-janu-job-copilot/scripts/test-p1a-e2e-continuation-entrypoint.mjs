import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const projectDir=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patcher=path.join(projectDir,'scripts','patch-p1a-e2e-continuation-entrypoint.mjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-e2e-entrypoint-'));
const file=path.join(dir,'TrackerWorkflow.js');
fs.writeFileSync(file,`const P12={};\n// P1-A-E2E-CONTINUATION-4\nfunction p1aE2EContinuationSelfTest_(){return {pass:true};}\nfunction p1aE2EContinuationTick_(){const id='x',url='https://jobs.example/x',input='h';return enqueue_(id,'JD_RETRIEVE',{source:'p1a-e2e-continuation-v4',reason:'STRANDED_VERIFYING_JD',contract:'E2E-STRANDED-JD-001'},input);}\nfunction enqueue_(){return 'Q1';}\nfunction upsertWorkerState_(){}\nconst LockService={getScriptLock(){return {tryLock(){return true},releaseLock(){}}}};\nfunction verifyReleaseIdentity(){return true;}\n`);
function run(){const r=spawnSync(process.execPath,[patcher,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout||'entrypoint patch failed');return r.stdout;}
run();const once=fs.readFileSync(file,'utf8');run();const out=fs.readFileSync(file,'utf8');if(once!==out)throw new Error('E2E live entrypoint patch not idempotent');
for(const token of ['E2E-LIVE-ENTRYPOINT-001','E2E-JD-PAYLOAD-001','function runP1AE2EContinuationTick(','LockService.getScriptLock()','p1aE2EContinuationSelfTest_()','p1aE2EContinuationTick_()','p1a_e2e_live_entrypoint_last_result',"enqueue_(id,'JD_RETRIEVE',{url:url,source:'p1a-e2e-continuation-v4'"])if(!out.includes(token))throw new Error('missing '+token);
if((out.match(/function runP1AE2EContinuationTick\(/g)||[]).length!==1)throw new Error('entrypoint duplicated');
if((out.match(/payloadContract:'E2E-JD-PAYLOAD-001'/g)||[]).length<1)throw new Error('JD payload contract missing');
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({status:'PASS',contract:'E2E-LIVE-ENTRYPOINT-001',payloadContract:'E2E-JD-PAYLOAD-001',idempotent:true,lock:true,selfTestGate:true,jdRetrievePayloadUrl:true,syntax:true},null,2));
