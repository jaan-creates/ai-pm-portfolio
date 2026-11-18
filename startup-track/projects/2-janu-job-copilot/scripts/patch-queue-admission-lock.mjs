import fs from 'node:fs';import path from 'node:path';
const root=process.argv[2];if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8');let s=original;
const marker='P04-QUEUE-ADMISSION-LOCK-001';
if(!s.includes(marker)){
  if(!s.includes('P04-QUEUE-LOCK-ENTRY-001'))throw new Error('Direct queue lock must be installed first');
  const enqueue='function enqueue_(app,type,payload,h,opts){';
  if(s.split(enqueue).length-1!==1)throw new Error('Queue admission signature not recognized');
  s=s.replace(enqueue,'function p04EnqueueCore_(app,type,payload,h,opts){');
  const raw='LockService.getScriptLock()',count=s.split(raw).length-1;
  if(count<7)throw new Error('Expected tracked script lock sites, found '+count);
  s=s.replaceAll(raw,'p04TrackedScriptLock_()');
  s+='\n/* '+marker+' */\nlet P04_QUEUE_LOCK_DEPTH=0;\nfunction p04TrackedScriptLock_(){\n  const real=LockService.getScriptLock();let state=0;\n  return {\n    tryLock(ms){if(state)return true;if(P04_QUEUE_LOCK_DEPTH>0){P04_QUEUE_LOCK_DEPTH++;state=2;return true;}if(!real.tryLock(ms))return false;P04_QUEUE_LOCK_DEPTH++;state=1;return true;},\n    waitLock(ms){if(state)return;if(P04_QUEUE_LOCK_DEPTH>0){P04_QUEUE_LOCK_DEPTH++;state=2;return;}real.waitLock(ms);P04_QUEUE_LOCK_DEPTH++;state=1;},\n    hasLock(){return state!==0;},\n    releaseLock(){if(!state)return;const owner=state===1;try{if(owner)SpreadsheetApp.flush();}finally{P04_QUEUE_LOCK_DEPTH--;state=0;if(owner)real.releaseLock();}}\n  };\n}\nfunction enqueue_(app,type,payload,h,opts){\n  const lock=p04TrackedScriptLock_();if(!lock.tryLock(5000))throw new Error(\'temporarily unavailable P04 queue admission lock\');\n  try{return p04EnqueueCore_(app,type,payload,h,opts);}finally{lock.releaseLock();}\n}\n';
}
if(s!==original)fs.writeFileSync(file,s);
console.log(JSON.stringify({changed:s!==original,contract:marker}));
