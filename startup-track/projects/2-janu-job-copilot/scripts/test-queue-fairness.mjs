import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';

const folder=fs.mkdtempSync(path.join(os.tmpdir(),'janu-queue-fair-'));
try{
  const file=path.join(folder,'TrackerWorkflow.js');
  fs.writeFileSync(file,`function verifyReleaseIdentity(){}\n/* P04-WORKER-OUTCOME-UNKNOWN-001 */\nfunction nextQ_(onlyApp){/* QUEUE-NOJOB-QUARANTINE-001 */return qPriority_(onlyApp,'');}\n`);
  const patch=path.join(import.meta.dirname,'patch-queue-fairness.mjs');
  assert.equal(JSON.parse(execFileSync(process.execPath,[patch,folder],{encoding:'utf8'})).changed,true);
  assert.equal(JSON.parse(execFileSync(process.execPath,[patch,folder],{encoding:'utf8'})).changed,false);
  const source=fs.readFileSync(file,'utf8');
  const now=new Date('2026-11-19T00:00:00Z'),minutes=n=>new Date(now.getTime()-n*60000);
  const row=(app,type,age,payload='{}',nextAt=now)=>['Q-'+app,app,type,'queued','','',0,3,nextAt,'','','','',payload,minutes(age),now];
  let rows=[row('A','PDF_CAPTURE',0),row('B','CONTACT_ENRICH',45)];
  const context={Date,Number,Math,JSON,Infinity,JC:{S:{Q:'Queue'}},now_:()=>now,qPriority_:(_,type)=>({PDF_CAPTURE:900,CONTACT_ENRICH:250}[type]||100),rendererQuarantineBlocks_:(_app,_type,payload)=>payload.quarantine===true,SH_:()=>({getLastRow:()=>rows.length+1,getRange:()=>({getValues:()=>rows})})};
  vm.createContext(context);vm.runInContext(source,context);
  assert.equal(context.nextQ_(null),3,'aged lower-priority application must eventually run');
  rows[1][3]='succeeded';assert.equal(context.nextQ_(null),2,'completed work cannot be claimed again');
  rows[1][3]='queued';rows[1][8]=new Date(now.getTime()+60000);assert.equal(context.nextQ_(null),2,'future retry stays deferred');
  rows[1][8]=now;rows[1][13]='{"quarantine":true}';assert.equal(context.nextQ_(null),2,'quarantined work stays deferred');
  rows[1][13]='{}';assert.equal(context.nextQ_('A'),2,'application filter is preserved');
  assert.equal(context.nextQ_('B'),3,'application filter can select the waiting application');
  rows=[row('A','PDF_CAPTURE',0),row('B','PDF_CAPTURE',2)];assert.equal(context.nextQ_(null),3,'older eligible work wins');
  rows[1][14]='';assert.equal(context.p04FairQueueScore_(250,'',now.getTime()),250,'missing creation time gets no artificial age');
  rows[0][14]='';rows[1][14]=minutes(0);assert.equal(context.nextQ_(null),3,'valid timestamp wins a same-priority tie against missing time');
  console.log(JSON.stringify({status:'PASS',contract:'P04-QUEUE-FAIR-AGING-001',checks:11}));
}finally{
  const resolved=fs.realpathSync(folder),tempRoot=fs.realpathSync(os.tmpdir());
  if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('janu-queue-fair-'))throw new Error('Refusing to remove unexpected test directory');
  fs.rmSync(resolved,{recursive:true,force:true});
}
