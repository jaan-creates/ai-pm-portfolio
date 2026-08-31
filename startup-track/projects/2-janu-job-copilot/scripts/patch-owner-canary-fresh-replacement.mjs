import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function runOwnedRendererCanaryTick(')&&t.includes('function rendererFreshCanaryEnqueue_(');});
if(!target)throw new Error('Owner canary target missing');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');
function rangeOf(name){const start=s.indexOf('function '+name+'(');if(start<0)throw new Error(name+' missing');const open=s.indexOf('{',start);let d=0,q=null,e=false;for(let i=open;i<s.length;i++){const c=s[i];if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0)return{start,end:i+1};}throw new Error('Unterminated '+name);}
const r=rangeOf('runOwnedRendererCanaryTick');
const code=`function runOwnedRendererCanaryTick(){if(!controlPlaneExecutionAuthorized_())throw new Error('CONTROL_OWNER_MISMATCH');let qid=rendererWorkerStateValue_('renderer_canary_pending_queue_id'),rb=qid?rendererCanaryQueueReadback_(qid):null;if(!rb||!rb.found||rb.status!=='queued'||rb.attempts!==0){const fresh=rendererFreshCanaryEnqueue_();qid=fresh.queueJobId;upsertWorkerState_('renderer_canary_pending_queue_id',qid,JSON.stringify({contract:'CONTROL-PLANE-CANARY-FRESH-001',replacedStale:true}).slice(0,1500));rb=rendererCanaryQueueReadback_(qid);}if(!rb||rb.status!=='queued'||rb.attempts!==0)throw new Error('FRESH_CANARY_NOT_QUEUED:'+JSON.stringify(rb));return rendererExactCanaryExecute_(qid);/* CONTROL-PLANE-CANARY-FRESH-001 */}`;
s=s.slice(0,r.start)+code+s.slice(r.end);if(!s.includes('CONTROL-PLANE-CANARY-FRESH-001'))throw new Error('fresh canary marker missing');fs.writeFileSync(file,s);const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr);console.log(JSON.stringify({status:'PASS',contract:'CONTROL-PLANE-CANARY-FRESH-001',file:target},null,2));