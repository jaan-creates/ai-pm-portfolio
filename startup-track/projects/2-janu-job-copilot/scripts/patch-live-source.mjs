import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target)throw new Error('TrackerWorkflow source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;

function functionRange(src,name){
  const a=src.indexOf('function '+name+'(');if(a<0)throw new Error(name+' missing');
  const b=src.indexOf('{',a);let depth=0,quote='',esc=false,line=false,block=false;
  for(let i=b;i<src.length;i++){
    const c=src[i],n=src[i+1];
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(quote){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===quote)quote='';continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='\''||c==='"'||c==='`'){quote=c;continue;}
    if(c==='{')depth++;else if(c==='}'&&--depth===0)return[a,i+1];
  }
  throw new Error('Unclosed function '+name);
}

// v20: make the strict regression gate bounded/resumable and make closure self-rebase
// to the deployed release when source advances while an older closure is in flight.
s=s.replaceAll('1.3.8','1.3.9').replaceAll('p0-regression-v19','p0-regression-v20');

const closureAnchor='function p0PrepareAction_(){';
if(!s.includes('function closureReleaseDriftDecision_(')){
  const i=s.indexOf(closureAnchor);if(i<0)throw new Error('p0PrepareAction_ anchor missing');
  const h="function closureReleaseDriftDecision_(phase,installedVersion,installedSuite){const p=String(phase||'');return p!=='INSTALL'&&p!=='COMPLETE'&&(String(installedVersion||'')!==P12.VERSION||String(installedSuite||'')!==P12.SUITE);}\nfunction closureReleaseDrift_(phase){return closureReleaseDriftDecision_(phase,workerStateValue_('worker_version'),workerStateValue_('regression_suite'));}\n";
  s=s.slice(0,i)+h+s.slice(i);
}

// A deployed release must not continue an older closure package. Rebase to INSTALL
// without relying on the operator-command trigger path.
const oldPhase="clearP0ClosureStepTriggers_();const phase=P_().getProperty('P0_CLOSURE_PHASE')||'INSTALL',attempt=p0ClosureAttempt_(phase);scheduleP0ClosureStep_(330000);";
const newPhase="clearP0ClosureStepTriggers_();let phase=P_().getProperty('P0_CLOSURE_PHASE')||'INSTALL';if(closureReleaseDrift_(phase)){p0ClosureState_('INSTALL','Release drift detected; rebasing closure to '+P12.VERSION+' / '+P12.SUITE);scheduleP0ClosureStep_(30000);return{phase:'REBASE',next:'INSTALL',version:P12.VERSION,suite:P12.SUITE};}const attempt=p0ClosureAttempt_(phase);scheduleP0ClosureStep_(330000);";
if(s.includes(oldPhase))s=s.replace(oldPhase,newPhase);
if(!s.includes(newPhase))throw new Error('FL-036 release self-rebase contract missing');

// Capture the exact current regression cases before replacing the monolithic runner.
const [ra,rb]=functionRange(s,'runPhase1_2RegressionSuite');
const oldRegression=s.slice(ra,rb);
let caseLines=oldRegression.split('\n').map(x=>x.trim()).filter(x=>x.startsWith('results.push(regressionTest_('));
if(caseLines.length<46)throw new Error('Expected at least 46 regression cases, found '+caseLines.length);
if(!caseLines.some(x=>x.includes("'BOOTSTRAP-009'"))){
  const idx=caseLines.findIndex(x=>x.includes("'PACK-SAN-001'"));if(idx<0)throw new Error('PACK-SAN-001 anchor missing');
  caseLines.splice(idx,0,"results.push(regressionTest_(runId,start,'BOOTSTRAP-009','Release Runtime',()=>{assert_(regressionChunkDecision_(0,47,0,8)==='CONTINUE','fresh suite must continue');assert_(regressionChunkDecision_(8,47,8,8)==='YIELD','bounded batch must yield');assert_(regressionChunkDecision_(47,47,1,8)==='COMPLETE','finished suite must complete');assert_(closureReleaseDriftDecision_('REGRESSION','0.0.0','old')===true,'release drift must rebase non-install closure');assert_(closureReleaseDriftDecision_('INSTALL','0.0.0','old')===false,'INSTALL must be allowed to repair release drift');return 'cursor gate yields and closure self-rebases';},'regression progress is durable/bounded and release drift rebases to INSTALL','synthetic release runtime'));" );
}
const total=caseLines.length;
const cases=caseLines.map((line,i)=>{
  const stmt=line.replace(/^results\.push\(/,'return ').replace(/\);$/,';');
  return `case ${i}:{${stmt}}`;
}).join('');

const resumable=`function regressionChunkDecision_(cursor,total,ran,maxPerRun){if(Number(cursor||0)>=Number(total||0))return 'COMPLETE';return Number(ran||0)>=Number(maxPerRun||0)?'YIELD':'CONTINUE';}\nfunction regressionProgressClear_(){['REGRESSION_ACTIVE_SUITE','REGRESSION_ACTIVE_RUN','REGRESSION_ACTIVE_STARTED_AT','REGRESSION_CURSOR','REGRESSION_FAILURES','REGRESSION_ACTIVE_INDEX'].forEach(k=>P_().deleteProperty(k));}\nfunction runRegressionCase_(index,runId,start){switch(Number(index)){${cases}default:throw new Error('Unknown regression case '+index);}}\nfunction runPhase1_2RegressionSuite(){verifyReleaseIdentity();ensureP12Sheets_();const p=P_(),suite=P12.SUITE,count=${total};let activeSuite=p.getProperty('REGRESSION_ACTIVE_SUITE'),runId=p.getProperty('REGRESSION_ACTIVE_RUN');if(activeSuite!==suite||!runId){regressionProgressClear_();runId='REG-'+Utilities.formatDate(now_(),'Asia/Kolkata','yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().slice(0,6);p.setProperty('REGRESSION_ACTIVE_SUITE',suite);p.setProperty('REGRESSION_ACTIVE_RUN',runId);p.setProperty('REGRESSION_ACTIVE_STARTED_AT',iso_());p.setProperty('REGRESSION_CURSOR','0');p.setProperty('REGRESSION_FAILURES','0');}let cursor=Number(p.getProperty('REGRESSION_CURSOR')||0),failures=Number(p.getProperty('REGRESSION_FAILURES')||0),ran=0;const start=new Date(p.getProperty('REGRESSION_ACTIVE_STARTED_AT')||iso_()),deadline=Date.now()+150000,maxPerRun=8;while(cursor<count&&ran<maxPerRun&&Date.now()<deadline){p.setProperty('REGRESSION_ACTIVE_INDEX',String(cursor));const ok=runRegressionCase_(cursor,runId,start);if(!ok)failures++;cursor++;ran++;p.setProperty('REGRESSION_CURSOR',String(cursor));p.setProperty('REGRESSION_FAILURES',String(failures));p.deleteProperty('REGRESSION_ACTIVE_INDEX');}const decision=regressionChunkDecision_(cursor,count,ran,maxPerRun);upsertWorkerState_('regression_progress',cursor+'/'+count,runId+' failures='+failures+' decision='+decision);if(decision!=='COMPLETE')return{runId:runId,pass:null,complete:false,cursor:cursor,total:count,failures:failures,ran:ran};const pass=failures===0;p.setProperty('REGRESSION_GATE_PASS',pass?'1':'0');p.setProperty('REGRESSION_SUITE_PASS',pass?P12.SUITE:'');p.setProperty('REGRESSION_LAST_RUN',runId);healthSet_('Regression Gate',pass?'HEALTHY':'BLOCKED',pass?'CLOSED':'OPEN',pass?'':'REGRESSION_FAILURE',pass?'':'One or more deterministic tests failed',failures,'Run '+runId+' '+(pass?'passed':'failed'));upsertWorkerState_('regression_last_run',runId,pass?'PASS':'FAIL');upsertWorkerState_('regression_gate',pass?'PASS':'FAIL',P12.SUITE);regressionProgressClear_();return{runId:runId,pass:pass,complete:true,passed:count-failures,total:count,failures:failures,next:pass?'run live preflight / bounded enable':'inspect __Regression Results'};}\n`;
s=s.slice(0,ra)+resumable+s.slice(rb);

// Closure must yield and reschedule while the current-suite cursor is incomplete.
const oldReg="if(phase==='REGRESSION'){const reg=runPhase1_2RegressionSuite();if(!reg.pass)throw new Error('P0_BOOTSTRAP_REGRESSION_FAILED '+reg.runId);p0ClosureState_('PREFLIGHT','Regression PASS '+reg.runId);scheduleP0ClosureStep_(30000);return{phase:'REGRESSION',attempt:attempt,runId:reg.runId,next:'PREFLIGHT'};}";
const newReg="if(phase==='REGRESSION'){const reg=runPhase1_2RegressionSuite();if(reg.complete===false){p0ClosureState_('REGRESSION','Regression progress '+reg.cursor+'/'+reg.total+' '+reg.runId);scheduleP0ClosureStep_(30000);return{phase:'REGRESSION',attempt:attempt,status:'IN_PROGRESS',runId:reg.runId,cursor:reg.cursor,total:reg.total};}if(!reg.pass)throw new Error('P0_BOOTSTRAP_REGRESSION_FAILED '+reg.runId);p0ClosureState_('PREFLIGHT','Regression PASS '+reg.runId);scheduleP0ClosureStep_(30000);return{phase:'REGRESSION',attempt:attempt,runId:reg.runId,next:'PREFLIGHT'};}";
if(s.includes(oldReg))s=s.replace(oldReg,newReg);
if(!s.includes(newReg))throw new Error('Closure REGRESSION resumable branch missing');

for(const token of ["VERSION:'1.3.9'","SUITE:'p0-regression-v20'","expectedVersion='1.3.9'","expectedSuite='p0-regression-v20'","'BOOTSTRAP-009'","'BOOTSTRAP-008'","'BOOTSTRAP-007'","'CONTROL-002'","'PACK-SAN-001'","'QA-REPAIR-001'","'RELEASE-001'","return 'SCHEDULE_REPLACEMENT'","replacementScheduled:true","function regressionChunkDecision_(","function runRegressionCase_(","reg.complete===false","function closureReleaseDriftDecision_("]){if(!s.includes(token))throw new Error('Required v20 contract missing: '+token);}
for(const stale of ['1.3.8','p0-regression-v19','1.3.7','p0-regression-v18','1.3.6','p0-regression-v17','1.3.5','p0-regression-v16','1.3.4','p0-regression-v15','1.3.3','p0-regression-v14','1.3.2','p0-regression-v13','1.3.1','p0-regression-v12'])if(s.includes(stale))throw new Error('Stale release identity remains: '+stale);

if(s!==before)fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,release:'1.3.9',suite:'p0-regression-v20',regressionCases:total,fixes:['FL-031','CONTROL-002','FL-033','FL-034','FL-035','FL-036']},null,2));
