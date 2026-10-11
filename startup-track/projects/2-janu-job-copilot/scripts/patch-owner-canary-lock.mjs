import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function runOwnedRendererCanaryTick(')&&t.includes('CONTROL-PLANE-CANARY-TELEMETRY-001');});
if(!target)throw new Error('Owner canary lock target missing');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');

function rangeOf(name){
  const sig='function '+name+'(';const start=s.indexOf(sig);if(start<0)return null;
  const open=s.indexOf('{',start);let d=0,q=null,e=false,line=false,block=false;
  for(let i=open;i<s.length;i++){const c=s[i],n=s[i+1]||'';
    if(line){if(c==='\\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(q){if(e){e=false;continue;}if(c==='\\\\'){e=true;continue;}if(c===q)q=null;continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='"'||c==="'"||c==='\`'){q=c;continue;}
    if(c==='{')d++;else if(c==='}'&&--d===0)return{start,end:i+1};
  }
  throw new Error('Unterminated '+name);
}
const replacement=[
"function runOwnedRendererCanaryTick(){",
"  const lock=LockService.getScriptLock();",
"  if(!lock.tryLock(5000)){",
"    const deferred=JSON.stringify({contract:'CANARY-OWNER-WORKER-LOCK-001',deferred:true,reason:'CANARY_LOCKED',at:typeof iso_==='function'?iso_():new Date().toISOString()});",
"    upsertWorkerState_('renderer_canary_trigger_last_result','DEFERRED',deferred);",
"    return {pass:false,deferred:true,reason:'CANARY_LOCKED',contract:'CANARY-OWNER-WORKER-LOCK-001'};",
"  }",
"  const started=typeof iso_==='function'?iso_():new Date().toISOString();let qid='';",
"  try{",
"    upsertWorkerState_('renderer_canary_trigger_last_start',started,'CONTROL-PLANE-CANARY-TELEMETRY-001 owner one-shot entered under canonical script lock');",
"    if(!controlPlaneExecutionAuthorized_())throw new Error('CONTROL_OWNER_MISMATCH');",
"    qid=rendererWorkerStateValue_('renderer_canary_pending_queue_id');",
"    let rb=qid?rendererCanaryQueueReadback_(qid):null;",
"    if(!rb||!rb.found||rb.status!=='queued'||rb.attempts!==0){",
"      rendererCanaryAdmissionGuard_();",
"      const fresh=rendererFreshCanaryEnqueue_();qid=fresh.queueJobId;",
"      upsertWorkerState_('renderer_canary_pending_queue_id',qid,JSON.stringify({contract:'CONTROL-PLANE-CANARY-FRESH-001',replacedStale:true}).slice(0,1500));",
"      rb=rendererCanaryQueueReadback_(qid);",
"    }",
"    if(!rb||rb.status!=='queued'||rb.attempts!==0)throw new Error('FRESH_CANARY_NOT_QUEUED:'+JSON.stringify(rb));",
"    rendererCanaryRecordAttempt_(qid);",
"    const out=rendererExactCanaryExecute_(qid);",
"    upsertWorkerState_('renderer_canary_failure_guard','RESOLVED',JSON.stringify({contract:'CANARY-REPEAT-GUARD-001',queueJobId:qid,deployment:rendererCanaryDeployment_()}).slice(0,1500));",
"    upsertWorkerState_('renderer_canary_trigger_last_result','PASS',JSON.stringify({contract:'CONTROL-PLANE-CANARY-TELEMETRY-001',queueJobId:qid,startedAt:started,finishedAt:typeof iso_==='function'?iso_():new Date().toISOString(),lockContract:'CANARY-OWNER-WORKER-LOCK-001'}).slice(0,1500));",
"    return out;",
"  }catch(e){",
"    if(qid)rendererCanaryPersistFailureFromQueue_(qid);",
"    upsertWorkerState_('renderer_canary_trigger_last_result','FAIL',JSON.stringify({contract:'CONTROL-PLANE-CANARY-TELEMETRY-001',startedAt:started,finishedAt:typeof iso_==='function'?iso_():new Date().toISOString(),error:String((e&&e.stack)||e),lockContract:'CANARY-OWNER-WORKER-LOCK-001'}).slice(0,1500));",
"    throw e;",
"  }finally{lock.releaseLock();}",
"  /* CONTROL-PLANE-CANARY-FRESH-001 / CONTROL-PLANE-CANARY-TELEMETRY-001 / CANARY-REPEAT-GUARD-001 / CANARY-OWNER-WORKER-LOCK-001 */",
"}"
].join('\n');
const r=rangeOf('runOwnedRendererCanaryTick');if(!r)throw new Error('Owner canary function missing');
if(!s.slice(r.start,r.end).includes('CANARY-OWNER-WORKER-LOCK-001'))s=s.slice(0,r.start)+replacement+s.slice(r.end);
if(!s.includes('CANARY-OWNER-WORKER-LOCK-001'))throw new Error('Owner worker lock contract missing');
fs.writeFileSync(file,s);
const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr||'syntax failure');
console.log(JSON.stringify({status:'PASS',file:target,contract:'CANARY-OWNER-WORKER-LOCK-001',failClosed:true,canonicalScriptLock:true,duplicateRenderPrevention:true},null,2));
