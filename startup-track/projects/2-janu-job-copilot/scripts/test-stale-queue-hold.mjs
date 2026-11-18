import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const patch=fileURLToPath(new URL('patch-stale-queue-hold.mjs',import.meta.url));
test('unknown stale outcome is held, deduplicated, and leaves other jobs eligible',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-p04-stale-'));
  try{
    const file=path.join(dir,'Runtime.js');
    fs.writeFileSync(file,`function verifyReleaseIdentity(){}
const JC={S:{Q:'Queue'},RETRIES:3};
function pdfFileState_(){const st='recovery_hold',out={active:false};if(['queued','running'].includes(st))out.active=true;return out;}
function duplicate(v,i){return ['queued','running','succeeded'].includes(v[i][3]);}
function recoverStaleQueueLeases_(){const s=SH_(JC.S.Q),v=s.getRange(2,1,s.getLastRow()-1,16).getValues();let rq=0,cx=0;for(let i=0;i<v.length;i++){if(v[i][3]!=='running')continue;const app=v[i][1],type=v[i][2],payload={},needed=queueJobFresh_(app,type,payload,v[i][5]),act=staleLeaseDecision_(v[i][3],v[i][9],v[i][6],v[i][7],needed),row=i+2;if(act==='requeue'){s.getRange(row,4).setValue('queued');rq++;}else if(act==='cancel'){s.getRange(row,4).setValue('cancelled');cx++;}}return{requeued:rq,cancelled:cx};}
function activeQueueAudit_(){const s=SH_(JC.S.Q);if(s.getLastRow()<2)return{running:0,queued:0,staleRunning:0,invalidQueued:0,pendingPdf:0};const v=s.getRange(2,1,s.getLastRow()-1,16).getValues();let running=0,queued=0,stale=0,invalid=0,pdf=0;for(const r of v){const st=String(r[3]||'');if(st==='running'){running++;}if(st==='queued'){queued++;}}return{running:running,queued:queued,staleRunning:stale,invalidQueued:invalid,pendingPdf:pdf};}
function livePreflightPhase1_2_(){const qa=activeQueueAudit_(),issues=[];if(qa.staleRunning)issues.push('stale_running_jobs='+qa.staleRunning);return{ok:issues.length===0,issues};}
`);
    execFileSync(process.execPath,[patch,dir]);const source=fs.readFileSync(file,'utf8');
    const rows=[Array(16).fill(''),['Q-1','APP','PDF_CAPTURE','running','hash','idem',1,3,new Date(0),new Date(0),'','','','{}',new Date(0),new Date(0)],['Q-2','APP','PDF_CAPTURE','queued','hash2','idem2',0,3,new Date(0),'','','','{}',new Date(0),new Date(0)]];
    const sheet={getLastRow:()=>rows.length,getRange(row,col,n=1){return{getValues:()=>rows.slice(row-1,row-1+n).map(r=>r.slice(col-1,col+15)),setValue:value=>{rows[row-1][col-1]=value;}};}};
    let held=false;const lock={tryLock(){if(held)return false;held=true;return true;},releaseLock(){held=false;}};
    const context=vm.createContext({SH_:()=>sheet,queueJobFresh_:()=>true,staleLeaseDecision_:()=> 'requeue',now_:()=>new Date(),p04TrackedScriptLock_:()=>lock});vm.runInContext(source,context);
    held=true;assert.throws(()=>context.recoverStaleQueueLeases_(),/temporarily unavailable P04 recovery lock/);assert.equal(rows[1][3],'running');held=false;
    const result=context.recoverStaleQueueLeases_();assert.equal(result.held,1);assert.equal(result.requeued,0);
    assert.equal(held,false);assert.equal(rows[1][3],'recovery_hold');assert.equal(rows[2][3],'queued');assert.equal(context.duplicate(rows,1),true);assert.equal(context.pdfFileState_().active,true);
    assert.equal(context.activeQueueAudit_().recoveryHold,1);assert.equal(context.livePreflightPhase1_2_().ok,false);
    execFileSync(process.execPath,[patch,dir]);assert.equal(fs.readFileSync(file,'utf8'),source);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
