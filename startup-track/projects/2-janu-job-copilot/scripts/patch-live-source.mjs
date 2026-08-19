import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || '.janu-live';
const files = fs.readdirSync(root).filter(f => f.endsWith('.gs') || f.endsWith('.js'));
if (!files.length) throw new Error(`No .gs/.js Apps Script files found in ${root}`);

const target = files.find(f => {
  const t = fs.readFileSync(path.join(root, f), 'utf8');
  return t.includes('function verifyReleaseIdentity()') && t.includes('const P12');
});
if (!target) throw new Error('Could not locate TrackerWorkflow source after clasp pull');

const file = path.join(root, target);
let s = fs.readFileSync(file, 'utf8');
const before = s;

// v15 is a narrow FL-031 release on top of the verified v14 baseline.
// Advance the entire executable/human-readable release identity atomically.
s = s.replaceAll('1.3.3', '1.3.4');
s = s.replaceAll('p0-regression-v14', 'p0-regression-v15');

// FL-031: a currently executing one-shot watchdog must not count as a durable
// future continuation. Exclude its trigger UID; only another pending trigger
// can satisfy KEEP_EXISTING. If none remains, schedule a replacement.
const oldHelpers = "function p0ClosureTriggerCount_(){return ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='runP0ClosureStep_').length;}\nfunction lockCollisionAction_(triggerCount){return Number(triggerCount||0)>0?'KEEP_EXISTING':'SCHEDULE_RETRY';}\nfunction ensureP0ClosureRetryTrigger_(delayMs){const count=p0ClosureTriggerCount_(),action=lockCollisionAction_(count);if(action==='SCHEDULE_RETRY')ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||60000))).create();upsertWorkerState_('p0_closure_lock_retry',action,iso_());return{action:action,existingTriggers:count};}";
const newHelpers = "function pendingTriggerCountForCollision_(total,currentPresent){return Math.max(0,Number(total||0)-(currentPresent?1:0));}\nfunction p0ClosureTriggerTopology_(currentUid){const ts=ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='runP0ClosureStep_');let currentPresent=false;const pending=ts.filter(t=>{if(currentUid&&String(t.getUniqueId())===String(currentUid)){currentPresent=true;return false;}return true;});return{total:ts.length,pending:pending.length,currentPresent:currentPresent};}\nfunction lockCollisionAction_(pendingCount){return Number(pendingCount||0)>0?'KEEP_EXISTING':'SCHEDULE_RETRY';}\nfunction ensureP0ClosureRetryTrigger_(delayMs,currentUid){const top=p0ClosureTriggerTopology_(currentUid),action=lockCollisionAction_(top.pending);if(action==='SCHEDULE_RETRY')ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||60000))).create();upsertWorkerState_('p0_closure_lock_retry',action,JSON.stringify(top));return{action:action,topology:top};}";
if (s.includes(oldHelpers)) s = s.replace(oldHelpers, newHelpers);
if (!s.includes('function pendingTriggerCountForCollision_(')) throw new Error('FL-031 trigger-exclusion helpers are missing');

const oldStart = "function runP0ClosureStep_(){const lock=LockService.getScriptLock();if(!lock.tryLock(1000)){const retry=ensureP0ClosureRetryTrigger_(60000);return{status:'LOCKED_RETRY_SAFE',retry:retry};}clearP0ClosureStepTriggers_();";
const newStart = "function runP0ClosureStep_(e){const lock=LockService.getScriptLock();if(!lock.tryLock(1000)){const retry=ensureP0ClosureRetryTrigger_(60000,e&&e.triggerUid);return{status:'LOCKED_RETRY_SAFE',retry:retry};}clearP0ClosureStepTriggers_();";
if (s.includes(oldStart)) s = s.replace(oldStart, newStart);
if (!s.includes(newStart)) throw new Error('FL-031 event-aware collision guard is missing');

const b4 = "results.push(regressionTest_(runId,start,'BOOTSTRAP-004','Release Runtime',()=>{assert_(lockCollisionAction_(0)==='SCHEDULE_RETRY','missing trigger must schedule retry');assert_(lockCollisionAction_(1)==='KEEP_EXISTING','existing watchdog must be preserved');return 'lock collision preserves or recreates continuation';},'lock collision never abandons closure continuation','synthetic trigger topology'));";
const b5 = "results.push(regressionTest_(runId,start,'BOOTSTRAP-005','Release Runtime',()=>{assert_(pendingTriggerCountForCollision_(1,true)===0,'currently executing one-shot watchdog counted as future continuation');assert_(pendingTriggerCountForCollision_(2,true)===1,'separate pending continuation was lost');assert_(pendingTriggerCountForCollision_(1,false)===1,'non-current pending trigger was incorrectly excluded');assert_(lockCollisionAction_(pendingTriggerCountForCollision_(1,true))==='SCHEDULE_RETRY','active watchdog collision must schedule replacement');return 'active one-shot trigger excluded from future-continuation count';},'current executing watchdog never satisfies durable continuation requirement','synthetic trigger UID topology'));";
if (!s.includes("'BOOTSTRAP-005'")) {
  if (!s.includes(b4)) throw new Error('BOOTSTRAP-004 anchor not found');
  s = s.replace(b4, `${b4}\n  ${b5}`);
}

const required = [
  "VERSION:'1.3.4'",
  "SUITE:'p0-regression-v15'",
  "expectedVersion='1.3.4'",
  "expectedSuite='p0-regression-v15'",
  "'PACK-SAN-001'",
  "'QA-REPAIR-001'",
  "'BOOTSTRAP-004'",
  "'BOOTSTRAP-005'",
  "'CONTROL-001'",
  "'RELEASE-001'",
  'function processOperatorCommand_(',
  'function pendingTriggerCountForCollision_(',
  "ensureP0ClosureRetryTrigger_(60000,e&&e.triggerUid)"
];
for (const token of required) if (!s.includes(token)) throw new Error(`Required v15 contract missing: ${token}`);

for (const stale of ['1.3.3','p0-regression-v14','1.3.2','p0-regression-v13','1.3.1','p0-regression-v12','1.3.0','p0-regression-v11','1.2.9','p0-regression-v10']) {
  if (s.includes(stale)) throw new Error(`Stale release identity remains after patch: ${stale}`);
}

if (s !== before) fs.writeFileSync(file, s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,release:'1.3.4',suite:'p0-regression-v15',fix:'FL-031'}, null, 2));
