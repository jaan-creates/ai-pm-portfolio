import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target) throw new Error('TrackerWorkflow source not found');
const file=path.join(root,target);
let s=fs.readFileSync(file,'utf8');
const before=s;

// FL-031: the trigger visible during a lock collision can be the currently executing
// one-shot trigger. Never treat it as a durable future continuation. Always create
// a replacement trigger without clearing the current trigger set.
s=s.replaceAll('1.3.3','1.3.4').replaceAll('p0-regression-v14','p0-regression-v15');
s=s.replace("function lockCollisionAction_(triggerCount){return Number(triggerCount||0)>0?'KEEP_EXISTING':'SCHEDULE_RETRY';}","function lockCollisionAction_(triggerCount){return 'SCHEDULE_REPLACEMENT';}");
s=s.replace("function ensureP0ClosureRetryTrigger_(delayMs){const count=p0ClosureTriggerCount_(),action=lockCollisionAction_(count);if(action==='SCHEDULE_RETRY')ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||60000))).create();upsertWorkerState_('p0_closure_lock_retry',action,iso_());return{action:action,existingTriggers:count};}","function ensureP0ClosureRetryTrigger_(delayMs){const count=p0ClosureTriggerCount_(),action=lockCollisionAction_(count);ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||60000))).create();upsertWorkerState_('p0_closure_lock_retry',action,iso_()+' prior_trigger_count='+count);return{action:action,existingTriggers:count,replacementScheduled:true};}");

s=s.replace("assert_(lockCollisionAction_(0)==='SCHEDULE_RETRY','missing trigger must schedule retry');assert_(lockCollisionAction_(1)==='KEEP_EXISTING','existing watchdog must be preserved');return 'lock collision preserves or recreates continuation';","assert_(lockCollisionAction_(0)==='SCHEDULE_REPLACEMENT','missing trigger must schedule replacement');assert_(lockCollisionAction_(1)==='SCHEDULE_REPLACEMENT','executing one-shot trigger must not be trusted as future continuation');return 'lock collision always schedules durable replacement';");

if(!s.includes("'BOOTSTRAP-005'")){
  const anchor="results.push(regressionTest_(runId,start,'BOOTSTRAP-004'";
  const i=s.indexOf(anchor); if(i<0) throw new Error('BOOTSTRAP-004 anchor missing');
  const end=s.indexOf('\n',i); if(end<0) throw new Error('BOOTSTRAP-004 line end missing');
  const test="  results.push(regressionTest_(runId,start,'BOOTSTRAP-005','Release Runtime',()=>{assert_(lockCollisionAction_(0)==='SCHEDULE_REPLACEMENT','zero visible triggers must replace');assert_(lockCollisionAction_(1)==='SCHEDULE_REPLACEMENT','currently executing one-shot must replace');assert_(lockCollisionAction_(2)==='SCHEDULE_REPLACEMENT','ambiguous topology must replace');return 'collision lifecycle cannot strand closure';},'every lock collision creates a fresh future continuation','synthetic one-shot lifecycle'));";
  s=s.slice(0,end+1)+test+'\n'+s.slice(end+1);
}

for(const token of ["VERSION:'1.3.4'","SUITE:'p0-regression-v15'","expectedVersion='1.3.4'","expectedSuite='p0-regression-v15'","'BOOTSTRAP-005'","return 'SCHEDULE_REPLACEMENT'","replacementScheduled:true"]){if(!s.includes(token))throw new Error('FL-031 v15 contract missing: '+token);}
for(const stale of ['1.3.3','p0-regression-v14']) if(s.includes(stale)) throw new Error('stale v14 identity remains: '+stale);
fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,release:'1.3.4',suite:'p0-regression-v15',fix:'FL-031'},null,2));
