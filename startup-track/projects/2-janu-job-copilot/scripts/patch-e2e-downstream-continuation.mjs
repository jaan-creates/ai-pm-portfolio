import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target)throw new Error('TrackerWorkflow source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;
const anchor='function verifyReleaseIdentity()';

function rangeOf(name){
  const sig='function '+name+'(';
  const start=s.indexOf(sig);if(start<0)return null;
  const open=s.indexOf('{',start);if(open<0)throw new Error('Malformed '+name);
  let depth=0,quote=null,esc=false;
  for(let i=open;i<s.length;i++){
    const c=s[i];
    if(quote){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===quote)quote=null;continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='{')depth++;else if(c==='}'&&--depth===0)return{start,end:i+1,open};
  }
  throw new Error('Unterminated '+name);
}
function argsOf(name){const r=rangeOf(name);if(!r)return[];const head=s.slice(r.start,r.open);const a=head.slice(head.indexOf('(')+1,head.lastIndexOf(')'));return a.split(',').map(x=>x.trim()).filter(Boolean);}
function add(token,code){if(s.includes(token))return;const i=s.indexOf(anchor);if(i<0)throw new Error('release identity anchor missing');s=s.slice(0,i)+code+'\n'+s.slice(i);}

if(!s.includes('function orchestrateOne_('))throw new Error('orchestrateOne_ missing');
if(!s.includes('RESUME_GENERATE'))throw new Error('RESUME_GENERATE worker type missing');
const oargs=argsOf('orchestrateOne_');if(oargs.length<1)throw new Error('orchestrateOne_ has no usable argument');
const or=rangeOf('orchestrateOne_'),obody=s.slice(or.open+1,or.end-1),oa=oargs[0];
const rowPattern1=`obj_(SH_(JC.S.A),${oa})`,rowPattern2=`obj_(sheet,${oa})`,idPattern=`find_(JC.S.A,${oa})`;
let invoke='';
if(obody.includes(rowPattern1)||obody.includes(rowPattern2))invoke=`const rr=find_(JC.S.A,appId);if(!rr)return{status:'APPLICATION_MISSING'};orchestrateOne_(rr);`;
else if(obody.includes(idPattern)||/Application ID/.test(obody))invoke=`orchestrateOne_(appId);`;
else throw new Error('Unable to determine orchestrateOne_ argument semantics safely');

add('function p1eQueueHasWorker_(',`function p1eQueueHasWorker_(appId,worker){const q=SH_(JC.S.Q),m=hm_(q);if(!m['Application ID']||!m['Worker Type']||!m['Status']||q.getLastRow()<2)return false;for(let r=2;r<=q.getLastRow();r++){if(String(q.getRange(r,m['Application ID']).getDisplayValue())!==String(appId))continue;if(String(q.getRange(r,m['Worker Type']).getDisplayValue())!==String(worker))continue;const st=String(q.getRange(r,m['Status']).getDisplayValue()||'').toLowerCase();if(['queued','running','retry_wait','retry','pending','succeeded'].includes(st))return true;}return false;}`);
add('function p1eTailoringCandidate_(',`function p1eTailoringCandidate_(a){a=a||{};return String(a['Decision']||'')==='Apply'&&String(a['Status']||'')==='Tailoring'&&!String(a['Resume Version ID']||'')&&String(a['Vacancy Status']||'').toUpperCase()!=='CLOSED'&&(Number(a['JD Completeness %']||0)>=70||String(a['JD Snapshot Status']||'').indexOf('Verified')>=0);}`);
add('function p1eContinueTailoringForApp_(',`function p1eContinueTailoringForApp_(appId){const r=find_(JC.S.A,appId);if(!r)return{status:'APPLICATION_MISSING'};const a=obj_(SH_(JC.S.A),r);if(!p1eTailoringCandidate_(a))return{status:'NOT_ELIGIBLE'};if(p1eQueueHasWorker_(appId,'RESUME_GENERATE'))return{status:'RESUME_WORK_EXISTS'};${invoke}if(p1eQueueHasWorker_(appId,'RESUME_GENERATE'))return{status:'ORCHESTRATOR_ENQUEUED'};const q=enqueue_(appId,'RESUME_GENERATE',{source:'p1-e2e-continuation'},hash_(appId+'|RESUME_GENERATE|p1-e2e-continuation'));if(!q)throw new Error('DETERMINISTIC:P1E_RESUME_ENQUEUE_FAILED');return{status:'FALLBACK_ENQUEUED',queueJobId:q};}`);
add('function p1eDownstreamContinuationTick_(',`function p1eDownstreamContinuationTick_(){const sh=SH_(JC.S.A),last=Math.min(sh.getLastRow(),250);if(last<2)return{status:'NO_ROWS'};for(let r=2;r<=last;r++){const a=obj_(sh,r);if(!p1eTailoringCandidate_(a))continue;const id=String(a['Application ID']||'');if(!id)continue;const out=p1eContinueTailoringForApp_(id);upsertWorkerState_('p1e_downstream_last_result','PASS',JSON.stringify({applicationId:id,result:out}).slice(0,1500));return{status:'PROCESSED',applicationId:id,result:out};}upsertWorkerState_('p1e_downstream_last_result','NO_ELIGIBLE_ROWS','bounded scan complete');return{status:'NO_ELIGIBLE_ROWS'};}`);
add('function p1eDownstreamSelfTest_(',`function p1eDownstreamSelfTest_(){const c=[];c.push(p1eTailoringCandidate_({'Decision':'Apply','Status':'Tailoring','Resume Version ID':'','Vacancy Status':'OPEN','JD Completeness %':95})===true);c.push(p1eTailoringCandidate_({'Decision':'Apply','Status':'Tailoring','Resume Version ID':'V1','Vacancy Status':'OPEN','JD Completeness %':95})===false);c.push(p1eTailoringCandidate_({'Decision':'Apply','Status':'Tailoring','Resume Version ID':'','Vacancy Status':'CLOSED','JD Completeness %':95})===false);c.push(p1eTailoringCandidate_({'Decision':'Hold','Status':'Tailoring','Resume Version ID':'','Vacancy Status':'OPEN','JD Completeness %':95})===false);if(c.some(x=>!x))throw new Error('P1-E downstream self-test failed '+JSON.stringify(c));return{pass:true,total:c.length,contract:'P1-E-DOWNSTREAM-1'};}`);
add('function runP1EDownstreamSelfTest()',`function runP1EDownstreamSelfTest(){const x=p1eDownstreamSelfTest_();upsertWorkerState_('p1e_downstream_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));upsertWorkerState_('p1e_downstream_contract_version','P1-E-DOWNSTREAM-1','Tailoring continuation self-heals missing resume queue work');return x;}`);

const health=rangeOf('phase1HealthTick');if(!health)throw new Error('phase1HealthTick missing');let hbody=s.slice(health.open+1,health.end-1);if(!hbody.includes('runP1EDownstreamSelfTest();')){const close=health.end-1;s=s.slice(0,close)+`try{runP1EDownstreamSelfTest();}catch(e){upsertWorkerState_('p1e_downstream_self_test','FAIL',String((e&&e.stack)||e).slice(0,1500));}try{p1eDownstreamContinuationTick_();}catch(e){upsertWorkerState_('p1e_downstream_last_result','FAIL',String((e&&e.stack)||e).slice(0,1500));}`+s.slice(close);}

for(const token of ['function p1eQueueHasWorker_(','function p1eTailoringCandidate_(','function p1eContinueTailoringForApp_(','function p1eDownstreamContinuationTick_(','function p1eDownstreamSelfTest_(','function runP1EDownstreamSelfTest()','p1e_downstream_self_test','p1e_downstream_last_result','P1-E-DOWNSTREAM-1'])if(!s.includes(token))throw new Error('P1-E downstream wiring missing '+token);
if(s!==before)fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:'P1-E-DOWNSTREAM-1',orchestratorArgMode:invoke.includes('find_(JC.S.A,appId)')?'ROW':'APPLICATION_ID',fallbackResumeEnqueue:true,maxApplicationsPerHealthTick:1},null,2));
