import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || '.janu-live';
const files = fs.readdirSync(root).filter(f => f.endsWith('.gs') || f.endsWith('.js'));
if (!files.length) throw new Error(`No .gs/.js Apps Script files found in ${root}`);
const target = files.find(f => { const t=fs.readFileSync(path.join(root,f),'utf8'); return t.includes('function verifyReleaseIdentity()') && t.includes('const P12'); });
if (!target) throw new Error('Could not locate TrackerWorkflow source after clasp pull');
const file=path.join(root,target); let s=fs.readFileSync(file,'utf8'); const before=s;

// Advance v14 -> v15 atomically. Running this on already-v15 source is safe.
s=s.replaceAll('1.3.3','1.3.4').replaceAll('p0-regression-v14','p0-regression-v15');

// FL-031: a visible one-shot trigger can be the currently executing watchdog,
// so trigger count cannot prove a future continuation exists. On every lock
// collision, schedule a fresh bounded replacement. The next successful phase
// entry clears duplicate closure triggers before continuing.
const oldHelpers="function p0ClosureTriggerCount_(){return ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='runP0ClosureStep_').length;}\nfunction lockCollisionAction_(triggerCount){return Number(triggerCount||0)>0?'KEEP_EXISTING':'SCHEDULE_RETRY';}\nfunction ensureP0ClosureRetryTrigger_(delayMs){const count=p0ClosureTriggerCount_(),action=lockCollisionAction_(count);if(action==='SCHEDULE_RETRY')ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||60000))).create();upsertWorkerState_('p0_closure_lock_retry',action,iso_());return{action:action,existingTriggers:count};}";
const newHelpers="function p0ClosureTriggerCount_(){return ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='runP0ClosureStep_').length;}\nfunction lockCollisionAction_(triggerCount){return 'SCHEDULE_REPLACEMENT';}\nfunction ensureP0ClosureRetryTrigger_(delayMs){const count=p0ClosureTriggerCount_(),action=lockCollisionAction_(count);ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||60000))).create();upsertWorkerState_('p0_closure_lock_retry',action,iso_()+' prior_trigger_count='+count);return{action:action,existingTriggers:count,replacementScheduled:true};}";
if(s.includes(oldHelpers))s=s.replace(oldHelpers,newHelpers);

// Normalize any intermediate UID-aware implementation to the final conservative contract.
s=s.replace(/function pendingTriggerCountForCollision_\([\s\S]*?function ensureP0ClosureRetryTrigger_\(delayMs,currentUid\)\{[\s\S]*?\}\n/,newHelpers+'\n');
s=s.replace("function runP0ClosureStep_(e){const lock=LockService.getScriptLock();if(!lock.tryLock(1000)){const retry=ensureP0ClosureRetryTrigger_(60000,e&&e.triggerUid);return{status:'LOCKED_RETRY_SAFE',retry:retry};}clearP0ClosureStepTriggers_();","function runP0ClosureStep_(){const lock=LockService.getScriptLock();if(!lock.tryLock(1000)){const retry=ensureP0ClosureRetryTrigger_(60000);return{status:'LOCKED_RETRY_SAFE',retry:retry};}clearP0ClosureStepTriggers_();");

const oldB4="results.push(regressionTest_(runId,start,'BOOTSTRAP-004','Release Runtime',()=>{assert_(lockCollisionAction_(0)==='SCHEDULE_RETRY','missing trigger must schedule retry');assert_(lockCollisionAction_(1)==='KEEP_EXISTING','existing watchdog must be preserved');return 'lock collision preserves or recreates continuation';},'lock collision never abandons closure continuation','synthetic trigger topology'));";
const newB4="results.push(regressionTest_(runId,start,'BOOTSTRAP-004','Release Runtime',()=>{assert_(lockCollisionAction_(0)==='SCHEDULE_REPLACEMENT','missing trigger must schedule replacement');assert_(lockCollisionAction_(1)==='SCHEDULE_REPLACEMENT','executing one-shot trigger must not be trusted as future continuation');return 'lock collision always schedules durable replacement';},'lock collision never abandons closure continuation','synthetic trigger topology'));";
if(s.includes(oldB4))s=s.replace(oldB4,newB4);

const b5="results.push(regressionTest_(runId,start,'BOOTSTRAP-005','Release Runtime',()=>{assert_(lockCollisionAction_(0)==='SCHEDULE_REPLACEMENT','zero visible triggers must replace');assert_(lockCollisionAction_(1)==='SCHEDULE_REPLACEMENT','currently executing one-shot must replace');assert_(lockCollisionAction_(2)==='SCHEDULE_REPLACEMENT','ambiguous topology must replace');return 'collision lifecycle cannot strand closure';},'every lock collision creates a fresh future continuation','synthetic one-shot lifecycle'));";
if(!s.includes("'BOOTSTRAP-005'")){if(!s.includes(newB4))throw new Error('BOOTSTRAP-004 v15 anchor missing');s=s.replace(newB4,newB4+'\n  '+b5);}

const required=["VERSION:'1.3.4'","SUITE:'p0-regression-v15'","expectedVersion='1.3.4'","expectedSuite='p0-regression-v15'","'PACK-SAN-001'","'QA-REPAIR-001'","'BOOTSTRAP-004'","'BOOTSTRAP-005'","'CONTROL-001'","'RELEASE-001'","return 'SCHEDULE_REPLACEMENT'","replacementScheduled:true","status:'LOCKED_RETRY_SAFE'",'function processOperatorCommand_('];
for(const token of required)if(!s.includes(token))throw new Error(`Required v15 contract missing: ${token}`);
for(const stale of ['1.3.3','p0-regression-v14','1.3.2','p0-regression-v13','1.3.1','p0-regression-v12','1.3.0','p0-regression-v11','1.2.9','p0-regression-v10'])if(s.includes(stale))throw new Error(`Stale release identity remains after patch: ${stale}`);
if(s!==before)fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,release:'1.3.4',suite:'p0-regression-v15',fix:'FL-031'},null,2));
