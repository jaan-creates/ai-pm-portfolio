import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
if(!files.length)throw new Error(`No .gs/.js Apps Script files found in ${root}`);
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target)throw new Error('Could not locate TrackerWorkflow source after clasp pull');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');const before=s;

// v16 is the control-plane continuity release on top of verified v15.
s=s.replaceAll('1.3.4','1.3.5').replaceAll('p0-regression-v15','p0-regression-v16');

// Retain/normalize FL-031 conservative continuation contract if an older source is pulled.
s=s.replace("function lockCollisionAction_(triggerCount){return Number(triggerCount||0)>0?'KEEP_EXISTING':'SCHEDULE_RETRY';}","function lockCollisionAction_(triggerCount){return 'SCHEDULE_REPLACEMENT';}");
s=s.replace("function ensureP0ClosureRetryTrigger_(delayMs){const count=p0ClosureTriggerCount_(),action=lockCollisionAction_(count);if(action==='SCHEDULE_RETRY')ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||60000))).create();upsertWorkerState_('p0_closure_lock_retry',action,iso_());return{action:action,existingTriggers:count};}","function ensureP0ClosureRetryTrigger_(delayMs){const count=p0ClosureTriggerCount_(),action=lockCollisionAction_(count);ScriptApp.newTrigger('runP0ClosureStep_').timeBased().after(Math.max(30000,Number(delayMs||60000))).create();upsertWorkerState_('p0_closure_lock_retry',action,iso_()+' prior_trigger_count='+count);return{action:action,existingTriggers:count,replacementScheduled:true};}");
if(!s.includes("function lockCollisionAction_(triggerCount){return 'SCHEDULE_REPLACEMENT';}"))throw new Error('FL-031 replacement action missing');
if(!s.includes('replacementScheduled:true'))throw new Error('FL-031 replacement scheduling evidence missing');

// CONTROL-002: operator commands must remain executable while the broad worker
// is intentionally absent during release gating. phase1HealthTick is a durable
// scheduled trigger, so dispatch there before ordinary health work.
const healthStart='function phase1HealthTick(){';
const healthControlled='function phase1HealthTick(){const op=processOperatorCommand_();if(op)return op;';
if(!s.includes(healthControlled)){
  if(!s.includes(healthStart))throw new Error('phase1HealthTick entrypoint not found');
  s=s.replace(healthStart,healthControlled);
}

if(!s.includes("'CONTROL-002'")){
  const a="results.push(regressionTest_(runId,start,'CONTROL-001'";
  const i=s.indexOf(a);if(i<0)throw new Error('CONTROL-001 anchor missing');
  const e=s.indexOf('\n',i);if(e<0)throw new Error('CONTROL-001 line end missing');
  const t="  results.push(regressionTest_(runId,start,'CONTROL-002','Operator Control',()=>{assert_(typeof phase1HealthTick==='function','health trigger missing');assert_(typeof processOperatorCommand_==='function','operator dispatcher missing');assert_(operatorCommandAction_('P0_BOOTSTRAP')==='P0_BOOTSTRAP','bootstrap command not allow-listed');return 'health trigger retains release-control dispatcher';},'operator commands remain reachable while broad worker is gated','synthetic control-plane continuity'));";
  s=s.slice(0,e+1)+t+'\n'+s.slice(e+1);
}

const required=["VERSION:'1.3.5'","SUITE:'p0-regression-v16'","expectedVersion='1.3.5'","expectedSuite='p0-regression-v16'","'PACK-SAN-001'","'QA-REPAIR-001'","'BOOTSTRAP-004'","'BOOTSTRAP-005'","'CONTROL-001'","'CONTROL-002'","'RELEASE-001'","return 'SCHEDULE_REPLACEMENT'","replacementScheduled:true","status:'LOCKED_RETRY_SAFE'",healthControlled,'function processOperatorCommand_('];
for(const token of required)if(!s.includes(token))throw new Error(`Required v16 contract missing: ${token}`);
for(const stale of ['1.3.4','p0-regression-v15','1.3.3','p0-regression-v14','1.3.2','p0-regression-v13','1.3.1','p0-regression-v12','1.3.0','p0-regression-v11','1.2.9','p0-regression-v10'])if(s.includes(stale))throw new Error(`Stale release identity remains after patch: ${stale}`);
if(s!==before)fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,release:'1.3.5',suite:'p0-regression-v16',fixes:['FL-031','CONTROL-002']},null,2));
