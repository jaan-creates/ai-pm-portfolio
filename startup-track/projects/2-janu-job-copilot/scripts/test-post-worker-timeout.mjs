import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const patch=fileURLToPath(new URL('patch-post-worker-timeout.mjs',import.meta.url));
test('completed worker remains succeeded after elapsed-time warning',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-p04-timeout-'));
  try{
    const file=path.join(dir,'Runtime.js');
    fs.writeFileSync(file,`function verifyReleaseIdentity(){}
const P12={MAX_JOB_RUNTIME_MS:240000};
function runJob(){const qid='Q-1',type='PDF_CAPTURE',started=now_();try{worker();if(now_()-started>P12.MAX_JOB_RUNTIME_MS)throw new Error('DETERMINISTIC:JOB_RUNTIME_EXCEEDED');status='succeeded';}catch(e){status='failed';throw e;}return status;}
`);
    execFileSync(process.execPath,[patch,dir]);
    const source=fs.readFileSync(file,'utf8');let elapsed=0,workers=0,status='queued',warnings=[];
    const context=vm.createContext({now_:()=>new Date(elapsed),worker:()=>{workers++;elapsed=300000;},upsertWorkerState_:(...args)=>warnings.push(args),status});
    vm.runInContext(source,context);
    assert.equal(context.runJob(),'succeeded');assert.equal(context.status,'succeeded');assert.equal(workers,1);assert.equal(warnings.length,1);
    assert.match(warnings[0][2],/P04-POST-WORKER-OUTCOME-001/);
    context.upsertWorkerState_=()=>{throw Error('telemetry unavailable');};context.status='queued';elapsed=0;
    assert.equal(context.runJob(),'succeeded');assert.equal(context.status,'succeeded');assert.equal(workers,2);
    execFileSync(process.execPath,[patch,dir]);assert.equal(fs.readFileSync(file,'utf8'),source);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
