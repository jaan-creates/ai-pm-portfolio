import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const patch=fileURLToPath(new URL('patch-queue-worker-uncertainty.mjs',import.meta.url));
test('worker error with uncertain side effects is held and direct runner honors retry time',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-p04-worker-'));
  try{
    const file=path.join(dir,'Runtime.js');
    fs.writeFileSync(file,`function verifyReleaseIdentity(){}
/* P04-STALE-OUTCOME-HOLD-001 */
const JC={S:{Q:'Queue'}};
function p04RunQCore_(r){
  if(String(SH_(JC.S.Q).getRange(r,4).getDisplayValue())!=='queued')return 0;/* P04-QUEUE-TERMINAL-REPLAY-001 */
  const s=SH_(JC.S.Q),type='PDF_CAPTURE',app='APP',payload={},qid='Q-1',attempt=1,max=3,started=now_();s.getRange(r,16).setValue(started);
  try{
    ({JD_RETRIEVE:workerJD_,PDF_CAPTURE:workerPDF_})[type](app,Object.assign({},payload,{attempt:attempt,qid:qid}));
    s.getRange(r,4).setValue('succeeded');return 1;
  }catch(e){
    const c=classifyError_(e),detail=String(e.stack||e).slice(0,4000);s.getRange(r,12).setValue(c.code);s.getRange(r,13).setValue(detail);
    if(c.kind==='TRANSIENT'&&attempt<max){s.getRange(r,4).setValue('queued');}else{s.getRange(r,4).setValue('failed');}
    throw e;
  }
}
`);
    execFileSync(process.execPath,[patch,dir]);const source=fs.readFileSync(file,'utf8');
    const rows=[Array(16).fill(''),['Q-1','APP','PDF_CAPTURE','queued','','',0,3,new Date(100000),'','','','','',new Date(0),new Date(0)]];
    const sheet={getRange(row,col){return{getDisplayValue:()=>String(rows[row-1][col-1]),getValue:()=>rows[row-1][col-1],setValue:v=>{rows[row-1][col-1]=v;}};}};
    let sideEffects=0,errorKind='TRANSIENT';const context=vm.createContext({SH_:()=>sheet,now_:()=>new Date(0),workerJD_:()=>{},workerPDF_:()=>{sideEffects++;throw Error('worker threw after side effect');},classifyError_:()=>({kind:errorKind,code:errorKind+'_PROVIDER'}),openCircuit_:()=>{},learnRuntimeFailure_:()=>{}});
    vm.runInContext(source,context);assert.equal(context.p04RunQCore_(2),0);assert.equal(sideEffects,0);
    rows[1][8]=new Date(0);assert.throws(()=>context.p04RunQCore_(2),/worker threw after side effect/);assert.equal(rows[1][3],'recovery_hold');
    assert.equal(rows[1][11],'WORKER_OUTCOME_UNKNOWN');assert.equal(context.p04RunQCore_(2),0);assert.equal(sideEffects,1);
    for(const kind of ['USER','GLOBAL','DETERMINISTIC']){
      rows[1][3]='queued';errorKind=kind;
      assert.throws(()=>context.p04RunQCore_(2),/worker threw after side effect/);
      assert.equal(rows[1][3],'recovery_hold',kind+' worker outcome must remain held');
      assert.equal(rows[1][11],'WORKER_OUTCOME_UNKNOWN');
      assert.equal(context.p04RunQCore_(2),0,'held job must not run again');
    }
    assert.equal(sideEffects,4);
    execFileSync(process.execPath,[patch,dir]);assert.equal(fs.readFileSync(file,'utf8'),source);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
