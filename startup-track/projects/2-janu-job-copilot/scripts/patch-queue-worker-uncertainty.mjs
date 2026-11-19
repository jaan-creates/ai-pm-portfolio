import fs from 'node:fs';import path from 'node:path';
const root=process.argv[2];if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8'),marker='P04-WORKER-OUTCOME-UNKNOWN-001';let s=original;
if(!s.includes(marker)){
  if(!s.includes('P04-STALE-OUTCOME-HOLD-001'))throw new Error('Stale-outcome hold must be installed first');
  const replacements=[
    ["if(String(SH_(JC.S.Q).getRange(r,4).getDisplayValue())!=='queued')return 0;/* P04-QUEUE-TERMINAL-REPLAY-001 */",
     "if(String(SH_(JC.S.Q).getRange(r,4).getDisplayValue())!=='queued')return 0;/* P04-QUEUE-TERMINAL-REPLAY-001 */const __p04NextAt=SH_(JC.S.Q).getRange(r,9).getValue();if(__p04NextAt&&new Date(__p04NextAt).getTime()>now_().getTime())return 0;/* P04-RETRY-DUE-001 */"],
    ["s.getRange(r,16).setValue(started);\n  try{","s.getRange(r,16).setValue(started);\n  let __p04WorkerEntered=false;try{"],
    ["    ({JD_RETRIEVE:workerJD_","    __p04WorkerEntered=true;({JD_RETRIEVE:workerJD_"],
    ["const c=classifyError_(e),detail=String(e.stack||e).slice(0,4000);s.getRange(r,12).setValue(c.code);s.getRange(r,13).setValue(detail);",
     "const c=classifyError_(e),detail=String(e.stack||e).slice(0,4000);s.getRange(r,12).setValue(c.code);s.getRange(r,13).setValue(detail);if(__p04WorkerEntered){/* "+marker+" */s.getRange(r,4).setValue('recovery_hold');s.getRange(r,12).setValue('WORKER_OUTCOME_UNKNOWN');s.getRange(r,13).setValue(c.code+': '+detail);try{if(c.kind==='GLOBAL')openCircuit_(/BUDGET/.test(c.code)?'Budget':'OpenAI',c.code,detail);if(c.kind==='DETERMINISTIC')learnRuntimeFailure_(app,type,c.code,detail,qid);}catch(__p04HoldTelemetryError){}throw e;}"],
  ];
  for(const [before,after] of replacements){if(s.split(before).length-1!==1)throw new Error('Queue worker anchor not recognized: '+before.slice(0,90));s=s.replace(before,after);}
}
if(s!==original)fs.writeFileSync(file,s);
console.log(JSON.stringify({changed:s!==original,contract:marker}));
