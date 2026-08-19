import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target)throw new Error('TrackerWorkflow source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;

// v19 fixes the durable closure-state contract exposed by the live v18 PREPARE loop.
s=s.replaceAll('1.3.7','1.3.8').replaceAll('p0-regression-v18','p0-regression-v19');

// FL-035a: PREPARE must advance the ScriptProperties state consumed by the engine,
// not only mirror REGRESSION into __Worker State telemetry.
s=s.replace("upsertWorkerState_('p0_closure_phase','REGRESSION','Bounded PREPARE complete; strict gates next')","p0ClosureState_('REGRESSION','Bounded PREPARE complete; strict gates next')");

// FL-035b: p0ClosureState_ is a setter, never a getter. Read the durable property
// directly when deciding whether ENABLE may reuse the immediately prior strict PASS.
s=s.replace("enablePreflightMode_(p0ClosureState_(),workerStateValue_('p0_live_preflight'))","enablePreflightMode_(P_().getProperty('P0_CLOSURE_PHASE'),workerStateValue_('p0_live_preflight'))");

// Pure transition contract used by regression; the runtime branch remains statically
// validated below to ensure it actually calls p0ClosureState_ for PREPARE -> REGRESSION.
const closureAnchor='function p0PrepareAction_(){';
if(!s.includes('function closurePhaseNext_(')){
  const i=s.indexOf(closureAnchor);if(i<0)throw new Error('p0PrepareAction_ anchor missing');
  s=s.slice(0,i)+"function closurePhaseNext_(phase){const p=String(phase||'');return p==='INSTALL'?'PREPARE':p==='PREPARE'?'REGRESSION':p==='REGRESSION'?'PREFLIGHT':p==='PREFLIGHT'?'ENABLE':p==='ENABLE'?'COMPLETE':p;}\n"+s.slice(i);
}

if(!s.includes("'BOOTSTRAP-008'")){
  const a="results.push(regressionTest_(runId,start,'BOOTSTRAP-007'";const i=s.indexOf(a);if(i<0)throw new Error('BOOTSTRAP-007 anchor missing');const e=s.indexOf('\n',i);if(e<0)throw new Error('BOOTSTRAP-007 line end missing');
  const t="  results.push(regressionTest_(runId,start,'BOOTSTRAP-008','Release Runtime',()=>{assert_(closurePhaseNext_('PREPARE')==='REGRESSION','PREPARE must durably advance to REGRESSION');assert_(closurePhaseNext_('REGRESSION')==='PREFLIGHT','REGRESSION next phase mismatch');assert_(enablePreflightMode_('ENABLE','PASS')==='REUSE_STRICT_PREFLIGHT','bounded ENABLE decision lost');return 'durable closure phase transitions are explicit';},'closure state machine advances via durable phase contract','synthetic release phase'));";
  s=s.slice(0,e+1)+t+'\n'+s.slice(e+1);
}

const cs=s.indexOf('function runP0ClosureStep_('),ce=cs<0?-1:(s.indexOf('\nfunction ',cs+1)<0?s.length:s.indexOf('\nfunction ',cs+1));
if(cs<0)throw new Error('runP0ClosureStep_ missing');
const closure=s.slice(cs,ce);
if(!closure.includes("p0ClosureState_('REGRESSION','Bounded PREPARE complete; strict gates next')"))throw new Error('FL-035 durable PREPARE transition missing');
if(closure.includes("upsertWorkerState_('p0_closure_phase','REGRESSION'"))throw new Error('FL-035 telemetry-only PREPARE transition still present');
if(!s.includes("enablePreflightMode_(P_().getProperty('P0_CLOSURE_PHASE'),workerStateValue_('p0_live_preflight'))"))throw new Error('FL-035 closure ENABLE durable-state read missing');
if(s.includes('enablePreflightMode_(p0ClosureState_(),'))throw new Error('FL-035 setter misused as getter');

for(const token of ["VERSION:'1.3.8'","SUITE:'p0-regression-v19'","expectedVersion='1.3.8'","expectedSuite='p0-regression-v19'","'BOOTSTRAP-008'","'BOOTSTRAP-007'","'BOOTSTRAP-006'","'BOOTSTRAP-005'","'CONTROL-002'","'PACK-SAN-001'","'QA-REPAIR-001'","'RELEASE-001'","return 'SCHEDULE_REPLACEMENT'","replacementScheduled:true","function closurePhaseNext_("]){if(!s.includes(token))throw new Error('Required v19 contract missing: '+token);}
for(const stale of ['1.3.7','p0-regression-v18','1.3.6','p0-regression-v17','1.3.5','p0-regression-v16','1.3.4','p0-regression-v15','1.3.3','p0-regression-v14','1.3.2','p0-regression-v13','1.3.1','p0-regression-v12'])if(s.includes(stale))throw new Error('Stale release identity remains: '+stale);

if(s!==before)fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,release:'1.3.8',suite:'p0-regression-v19',fixes:['FL-031','CONTROL-002','FL-033','FL-034','FL-035']},null,2));
