import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.argv[2]||'.janu-live';
const dir=path.dirname(new URL(import.meta.url).pathname);
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function runOwnedRendererCanaryTick(')&&t.includes('function rendererFreshCanaryEnqueue_(');});
if(!target)throw new Error('Owner canary target missing');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');
function rangeOf(name){const start=s.indexOf('function '+name+'(');if(start<0)throw new Error(name+' missing');const open=s.indexOf('{',start);let d=0,q=null,e=false;for(let i=open;i<s.length;i++){const c=s[i];if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0)return{start,end:i+1};}throw new Error('Unterminated '+name);}
function replaceFn(name,code){const r=rangeOf(name);s=s.slice(0,r.start)+code+s.slice(r.end);}
replaceFn('runOwnedRendererCanaryTick',`function runOwnedRendererCanaryTick(){const started=iso_();upsertWorkerState_('renderer_canary_trigger_last_start',started,'CONTROL-PLANE-CANARY-TELEMETRY-001 owner one-shot entered');try{if(!controlPlaneExecutionAuthorized_())throw new Error('CONTROL_OWNER_MISMATCH');let qid=rendererWorkerStateValue_('renderer_canary_pending_queue_id'),rb=qid?rendererCanaryQueueReadback_(qid):null;if(!rb||!rb.found||rb.status!=='queued'||rb.attempts!==0){const fresh=rendererFreshCanaryEnqueue_();qid=fresh.queueJobId;upsertWorkerState_('renderer_canary_pending_queue_id',qid,JSON.stringify({contract:'CONTROL-PLANE-CANARY-FRESH-001',replacedStale:true}).slice(0,1500));rb=rendererCanaryQueueReadback_(qid);}if(!rb||rb.status!=='queued'||rb.attempts!==0)throw new Error('FRESH_CANARY_NOT_QUEUED:'+JSON.stringify(rb));const out=rendererExactCanaryExecute_(qid);upsertWorkerState_('renderer_canary_trigger_last_result','PASS',JSON.stringify({contract:'CONTROL-PLANE-CANARY-TELEMETRY-001',queueJobId:qid,startedAt:started,finishedAt:iso_()}).slice(0,1500));return out;}catch(e){upsertWorkerState_('renderer_canary_trigger_last_result','FAIL',JSON.stringify({contract:'CONTROL-PLANE-CANARY-TELEMETRY-001',startedAt:started,finishedAt:iso_(),error:String((e&&e.stack)||e)}).slice(0,1500));throw e;}/* CONTROL-PLANE-CANARY-FRESH-001 / CONTROL-PLANE-CANARY-TELEMETRY-001 */}`);
replaceFn('installOwnedRendererCanaryTrigger',`function installOwnedRendererCanaryTrigger(){if(!controlPlaneExecutionAuthorized_())throw new Error('CONTROL_OWNER_MISMATCH');for(const t of ScriptApp.getProjectTriggers())if(String(t.getHandlerFunction()||'')==='runOwnedRendererCanaryTick')ScriptApp.deleteTrigger(t);ScriptApp.newTrigger('runOwnedRendererCanaryTick').timeBased().after(60*1000).create();upsertWorkerState_('renderer_canary_trigger_installed_at',iso_(),'CONTROL-PLANE-CANARY-TELEMETRY-001 one-shot scheduled after >=60s');return{pass:true,contract:'CONTROL-PLANE-CANARY-ONLY-001',telemetry:'CONTROL-PLANE-CANARY-TELEMETRY-001'};}`);
if(!s.includes('CONTROL-PLANE-CANARY-FRESH-001')||!s.includes('CONTROL-PLANE-CANARY-TELEMETRY-001'))throw new Error('fresh canary/telemetry marker missing');fs.writeFileSync(file,s);
// Always prove the post-composition sanitizer behavior. Synthetic canary fixtures do
// not contain pack_(), so mutate the pack only when this root is the full runtime.
const test=spawnSync(process.execPath,[path.resolve(dir,'test-pack-live-evidence-sanitization.mjs'),path.resolve(dir,'..')],{encoding:'utf8'});if(test.status!==0)throw new Error(test.stderr||test.stdout||'PACK-SAN-LIVE-METAFORMS-001 regression failed');
s=fs.readFileSync(file,'utf8');let packSanitization='fixture-only';
if(s.includes('function pack_(')&&s.includes('function stripInternalEvidenceTags_(')&&s.includes('function assertExternalTextClean_(')){
 const patch=spawnSync(process.execPath,[path.resolve(dir,'patch-pack-live-evidence-sanitization.mjs'),root],{encoding:'utf8'});if(patch.status!==0)throw new Error(patch.stderr||patch.stdout||'PACK-SAN-LIVE-EVIDENCE-001 patch failed');
 s=fs.readFileSync(file,'utf8');if(!s.includes('PACK-SAN-LIVE-EVIDENCE-001'))throw new Error('pack live-evidence sanitizer missing after convergence');packSanitization='PACK-SAN-LIVE-EVIDENCE-001';
}
// Daily Sourcing health must distinguish a genuine scheduled cycle from manual/recovery
// success. This prevents a recovery row from falsely proving recurring scheduler liveness.
const sourcingTest=spawnSync(process.execPath,[path.resolve(dir,'test-sourcing-scheduler-health.mjs'),path.resolve(dir,'..')],{encoding:'utf8'});if(sourcingTest.status!==0)throw new Error(sourcingTest.stderr||sourcingTest.stdout||'SOURCING-RECOVERY-NOT-LIVENESS-001 regression failed');
if(s.includes('function sourceFreshnessHealth_(')){
 const sourcingPatch=spawnSync(process.execPath,[path.resolve(dir,'patch-sourcing-scheduler-health.mjs'),root],{encoding:'utf8'});if(sourcingPatch.status!==0)throw new Error(sourcingPatch.stderr||sourcingPatch.stdout||'SOURCING-HEALTH-BLOCKER-PRECEDENCE-001 patch failed');
 s=fs.readFileSync(file,'utf8');if(!s.includes('SOURCING-HEALTH-BLOCKER-PRECEDENCE-001'))throw new Error('sourcing scheduler health contract missing after convergence');
}
const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr);console.log(JSON.stringify({status:'PASS',contract:'CONTROL-PLANE-CANARY-FRESH-001',canaryTelemetry:'CONTROL-PLANE-CANARY-TELEMETRY-001',packSanitization:packSanitization,sourcingHealth:'SOURCING-HEALTH-BLOCKER-PRECEDENCE-001',file:target},null,2));
