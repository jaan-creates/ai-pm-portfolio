import fs from 'node:fs';import path from 'node:path';
const root=process.argv[2];if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8');let s=original;
const marker='P04-QUEUE-LOCK-ENTRY-001';
if(!s.includes(marker)){
  const runner='function runQ_(r){';if(s.split(runner).length-1!==1)throw new Error('Queue runner signature not recognized');s=s.replace(runner,'function p04RunQCore_(r){');
  const tick="const l=LockService.getScriptLock();if(!l.tryLock(5000))return{status:'LOCKED'};try{return phase1OneJobTickCore_();}finally{l.releaseLock();}";
  const lockedTick="const l=LockService.getScriptLock();if(!l.tryLock(5000))return{status:'LOCKED'};P04_QUEUE_LOCK_HELD=true;try{return phase1OneJobTickCore_();}finally{try{SpreadsheetApp.flush();}finally{P04_QUEUE_LOCK_HELD=false;l.releaseLock();}}";
  if(s.split(tick).length-1!==1)throw new Error('Worker tick lock boundary not recognized');s=s.replace(tick,lockedTick);
  const begin=s.indexOf('function runRendererAuthorizedCanary(){'),end=s.indexOf('function runRendererAuthorizedCanaryEnqueue(){',begin);
  if(begin<0||end<0)throw new Error('Canary lock boundary not recognized');let canary=s.slice(begin,end);
  if(!canary.includes("throw new Error('DETERMINISTIC:CANARY_LOCKED');try{")||!canary.includes('}finally{l.releaseLock();}'))throw new Error('Canary lock shape changed');
  canary=canary.replace("throw new Error('DETERMINISTIC:CANARY_LOCKED');try{","throw new Error('DETERMINISTIC:CANARY_LOCKED');P04_QUEUE_LOCK_HELD=true;try{").replace('}finally{l.releaseLock();}','}finally{try{SpreadsheetApp.flush();}finally{P04_QUEUE_LOCK_HELD=false;l.releaseLock();}}');
  s=s.slice(0,begin)+canary+s.slice(end);
  s+='\n/* '+marker+' */\nlet P04_QUEUE_LOCK_HELD=false;\nfunction runQ_(r){\n  if(P04_QUEUE_LOCK_HELD)return p04RunQCore_(r);\n  const lock=LockService.getScriptLock();\n  if(!lock.tryLock(5000))throw new Error(\'temporarily unavailable P04 queue lock\');\n  P04_QUEUE_LOCK_HELD=true;\n  try{return p04RunQCore_(r);}finally{try{SpreadsheetApp.flush();}finally{P04_QUEUE_LOCK_HELD=false;lock.releaseLock();}}\n}\n';
}
if(s!==original)fs.writeFileSync(file,s);
console.log(JSON.stringify({changed:s!==original,contract:marker}));
