import fs from 'node:fs';import path from 'node:path';
const root=process.argv[2];if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8'),marker='P04-POST-WORKER-OUTCOME-001';let s=original;
if(!s.includes(marker)){
  const old="if(now_()-started>P12.MAX_JOB_RUNTIME_MS)throw new Error('DETERMINISTIC:JOB_RUNTIME_EXCEEDED');";
  if(s.split(old).length-1!==1)throw new Error('Post-worker runtime check not recognized');
  const replacement="if(now_()-started>P12.MAX_JOB_RUNTIME_MS){try{upsertWorkerState_('queue_job_runtime_over_budget','WARN',JSON.stringify({contract:'"+marker+"',queueJobId:qid,workerType:type,elapsedMs:now_()-started}));}catch(__p04TelemetryError){}}";
  s=s.replace(old,replacement);
}
if(s!==original)fs.writeFileSync(file,s);
console.log(JSON.stringify({changed:s!==original,contract:marker}));
