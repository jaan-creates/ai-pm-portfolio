import fs from 'node:fs';import path from 'node:path';
const root=process.argv[2];if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8'),marker='P04-STALE-OUTCOME-HOLD-001';let s=original;
if(!s.includes(marker)){
  const dedupe="['queued','running','succeeded'].includes(v[i][3])",pdf="if(['queued','running'].includes(st))out.active=true;";
  if(s.split(dedupe).length-1!==1||s.split(pdf).length-1!==1)throw new Error('Queue admission dedupe not recognized');
  s=s.replace(dedupe,"['queued','running','recovery_hold','succeeded'].includes(v[i][3])").replace(pdf,"if(['queued','running','recovery_hold'].includes(st))out.active=true;");
  const anchor='function recoverStaleQueueLeases_(){',start=s.indexOf(anchor),end=s.indexOf('\n',start);
  if(start<0||end<0||s.slice(start,end).split(anchor).length-1!==1||!s.slice(start,end).includes("if(act==='requeue')"))throw new Error('Stale lease recovery not recognized');
  const replacement=`function recoverStaleQueueLeases_(){
  const lock=p04TrackedScriptLock_();if(!lock.tryLock(5000))throw new Error('temporarily unavailable P04 recovery lock');
  try{
  const s=SH_(JC.S.Q);if(s.getLastRow()<2)return{requeued:0,cancelled:0,held:0};
  const v=s.getRange(2,1,s.getLastRow()-1,16).getValues();let cx=0,held=0;
  for(let i=0;i<v.length;i++){
    if(String(v[i][3]||'')!=='running')continue;
    const app=String(v[i][1]||''),type=String(v[i][2]||''),payload=v[i][13]?(()=>{try{return JSON.parse(v[i][13]);}catch(e){return{};}})():{};
    const needed=queueJobFresh_(app,type,payload,String(v[i][5]||'')),act=staleLeaseDecision_(v[i][3],v[i][9],v[i][6],v[i][7],needed),row=i+2;
    if(act==='requeue'){
      /* ${marker}: worker may have committed an external side effect before interruption. */
      s.getRange(row,4).setValue('recovery_hold');s.getRange(row,12).setValue('STALE_LEASE_OUTCOME_UNKNOWN');
      s.getRange(row,13).setValue('Worker outcome is uncertain after interruption. Reconcile side effects before explicit replay.');s.getRange(row,16).setValue(now_());held++;
    }else if(act==='cancel'){
      s.getRange(row,4).setValue('cancelled');s.getRange(row,11).setValue(now_());s.getRange(row,12).setValue('STALE_LEASE_CANCELLED');
      s.getRange(row,13).setValue('Running lease exceeded 15 minutes and work is no longer current or attempts exhausted.');s.getRange(row,16).setValue(now_());cx++;
    }
  }
  return{requeued:0,cancelled:cx,held:held};
  }finally{lock.releaseLock();}
}`;
  s=s.slice(0,start)+replacement+s.slice(end);
  const audit=[
    ["return{running:0,queued:0,staleRunning:0,invalidQueued:0,pendingPdf:0};","return{running:0,queued:0,staleRunning:0,invalidQueued:0,pendingPdf:0,recoveryHold:0};"],
    ["let running=0,queued=0,stale=0,invalid=0,pdf=0;","let running=0,queued=0,stale=0,invalid=0,pdf=0,hold=0;"],
    ["if(st==='running'){running++;","if(st==='recovery_hold')hold++;if(st==='running'){running++;"],
    ["pendingPdf:pdf};","pendingPdf:pdf,recoveryHold:hold};"],
    ["if(qa.staleRunning)issues.push('stale_running_jobs='+qa.staleRunning);","if(qa.staleRunning)issues.push('stale_running_jobs='+qa.staleRunning);if(qa.recoveryHold)issues.push('recovery_hold_jobs='+qa.recoveryHold);"]
  ];
  for(const [before,after] of audit){if(s.split(before).length-1!==1)throw new Error('Recovery-hold preflight anchor not recognized: '+before);s=s.replace(before,after);}
}
if(s!==original)fs.writeFileSync(file,s);
console.log(JSON.stringify({changed:s!==original,contract:marker}));
