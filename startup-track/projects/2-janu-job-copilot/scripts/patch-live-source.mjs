import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || '.janu-live';
const files = fs.readdirSync(root).filter(f => f.endsWith('.gs'));
if (!files.length) throw new Error(`No .gs files found in ${root}`);

const target = files.find(f => {
  const t = fs.readFileSync(path.join(root, f), 'utf8');
  return t.includes('function verifyReleaseIdentity()') && t.includes('const P12');
});
if (!target) throw new Error('Could not locate TrackerWorkflow source after clasp pull');

const file = path.join(root, target);
let s = fs.readFileSync(file, 'utf8');
const before = s;

// Remove stale embedded release header inherited from the v10 ancestor.
s = s.replace('// RELEASE: 1.2.9\n// REGRESSION SUITE: p0-regression-v10\n// GENERATED: 2026-08-19 01:15 IST\n', '');

// Normalize the complete release identity surface to v14.
s = s.replaceAll('1.3.2', '1.3.3');
s = s.replaceAll('p0-regression-v13', 'p0-regression-v14');
s = s.replace("expectedVersion='1.3.1', expectedSuite='p0-regression-v12'", "expectedVersion='1.3.3', expectedSuite='p0-regression-v14'");
s = s.replace("expectedVersion='1.3.3', expectedSuite='p0-regression-v12'", "expectedVersion='1.3.3', expectedSuite='p0-regression-v14'");
s = s.replace('// RELEASE: 1.3.1', '// RELEASE: 1.3.3');
s = s.replace('// REGRESSION SUITE: p0-regression-v12', '// REGRESSION SUITE: p0-regression-v14');

const scheduleFn = "function scheduleP0ClosureStep_(delayMs){clearP0ClosureStepTriggers_();ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||30000))).create();}";
const collisionHelpers = `${scheduleFn}\nfunction p0ClosureTriggerCount_(){return ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='runP0ClosureStep_').length;}\nfunction lockCollisionAction_(triggerCount){return Number(triggerCount||0)>0?'KEEP_EXISTING':'SCHEDULE_RETRY';}\nfunction ensureP0ClosureRetryTrigger_(delayMs){const count=p0ClosureTriggerCount_(),action=lockCollisionAction_(count);if(action==='SCHEDULE_RETRY')ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||60000))).create();upsertWorkerState_('p0_closure_lock_retry',action,iso_());return{action:action,existingTriggers:count};}`;
if (!s.includes('function lockCollisionAction_(')) {
  if (!s.includes(scheduleFn)) throw new Error('Expected scheduleP0ClosureStep_ signature not found');
  s = s.replace(scheduleFn, collisionHelpers);
}

const oldStart = "function runP0ClosureStep_(){const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return{status:'LOCKED'};clearP0ClosureStepTriggers_();";
const newStart = "function runP0ClosureStep_(){const lock=LockService.getScriptLock();if(!lock.tryLock(1000)){const retry=ensureP0ClosureRetryTrigger_(60000);return{status:'LOCKED_RETRY_SAFE',retry:retry};}clearP0ClosureStepTriggers_();";
if (s.includes(oldStart)) s = s.replace(oldStart, newStart);
if (!s.includes(newStart)) throw new Error('Retry-safe lock-collision handling is missing');

const b3 = "results.push(regressionTest_(runId,start,'BOOTSTRAP-003','Release Runtime',()=>{const e=new Error('Service Spreadsheets failed while accessing document with id X.');assert_(classifyError_(e).kind==='TRANSIENT','google service error not transient');assert_(closureRetryable_(e,1)===true,'attempt 1 should retry');assert_(closureRetryable_(e,3)===false,'attempt 3 must stop');return 'transient closure retry bounded';},'Google Workspace transient errors retry same phase with bounded attempts','synthetic transient closure'));";
const b4 = "results.push(regressionTest_(runId,start,'BOOTSTRAP-004','Release Runtime',()=>{assert_(lockCollisionAction_(0)==='SCHEDULE_RETRY','missing trigger must schedule retry');assert_(lockCollisionAction_(1)==='KEEP_EXISTING','existing watchdog must be preserved');return 'lock collision preserves or recreates continuation';},'lock collision never abandons closure continuation','synthetic trigger topology'));";
if (!s.includes("'BOOTSTRAP-004'")) {
  if (!s.includes(b3)) throw new Error('BOOTSTRAP-003 anchor not found');
  s = s.replace(b3, `${b3}\n  ${b4}`);
}

const required = [
  "VERSION:'1.3.3'",
  "SUITE:'p0-regression-v14'",
  "expectedVersion='1.3.3'",
  "expectedSuite='p0-regression-v14'",
  "'PACK-SAN-001'",
  "'QA-REPAIR-001'",
  "'BOOTSTRAP-004'",
  "'CONTROL-001'"
];
for (const token of required) if (!s.includes(token)) throw new Error(`Required v14 contract missing: ${token}`);

for (const stale of ['1.3.2','p0-regression-v13','1.3.1','p0-regression-v12','1.3.0','p0-regression-v11','1.2.9','p0-regression-v10']) {
  if (s.includes(stale)) throw new Error(`Stale release identity remains after patch: ${stale}`);
}

if (s !== before) fs.writeFileSync(file, s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,release:'1.3.3',suite:'p0-regression-v14'}, null, 2));
