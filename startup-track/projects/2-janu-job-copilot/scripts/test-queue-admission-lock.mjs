import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const patch=fileURLToPath(new URL('patch-queue-admission-lock.mjs',import.meta.url));

test('queue admission serializes independent executions and reuses an owned script lock',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-p04-admission-'));
  try{
    const file=path.join(dir,'Runtime.js');
    const fixture=`function verifyReleaseIdentity(){}
/* P04-QUEUE-LOCK-ENTRY-001 */
function enqueue_(app,type,payload,h,opts){
  const existing=queue.find(x=>x.key===h);
  if(existing)return existing.id;
  if(hook)hook();
  const id='Q-'+(queue.length+1);
  queue.push({id,key:h});
  return id;
}
function outer(){const lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw Error('locked');try{return enqueue_('APP','JD',{},'KEY');}finally{lock.releaseLock();}}
function lockSite2(){return LockService.getScriptLock();}
function lockSite3(){return LockService.getScriptLock();}
function lockSite4(){return LockService.getScriptLock();}
function lockSite5(){return LockService.getScriptLock();}
function lockSite6(){return LockService.getScriptLock();}
function lockSite7(){return LockService.getScriptLock();}
`;
    fs.writeFileSync(file,fixture);
    execFileSync(process.execPath,[patch,dir]);
    const source=fs.readFileSync(file,'utf8');
    assert.equal((source.match(/LockService\.getScriptLock\(\)/g)||[]).length,1);
    const queue=[];let held=false,flushes=0,secondError='';
    const lock={tryLock(){if(held)return false;held=true;return true;},releaseLock(){held=false;}};
    const makeContext=()=>vm.createContext({LockService:{getScriptLock:()=>lock},SpreadsheetApp:{flush(){flushes++;}},queue,hook:null});
    const first=makeContext(),second=makeContext();
    vm.runInContext(source,first);vm.runInContext(source,second);
    first.hook=()=>{try{second.enqueue_('APP','JD',{},'KEY');}catch(e){secondError=String(e.message||e);}};
    assert.equal(first.outer(),'Q-1');
    assert.match(secondError,/temporarily unavailable P04 queue admission lock/);
    assert.equal(queue.length,1);
    assert.equal(held,false);
    assert.equal(flushes,1);
    first.hook=null;
    assert.equal(second.enqueue_('APP','JD',{},'KEY'),'Q-1');
    assert.equal(queue.length,1);
    assert.equal(flushes,2);
    execFileSync(process.execPath,[patch,dir]);
    assert.equal(fs.readFileSync(file,'utf8'),source);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
