import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const BULK='E2E-BULK-SCAN-001';
const ADMISSION='QUEUE-ADMISSION-REASON-001';
const JD_NEW='QUEUE-JD-NEW-001';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function p1aE2EContinuationTick_(')&&t.includes('P1-A-E2E-CONTINUATION-4')&&t.includes('const P12');});
if(!target)throw new Error('E2E V4 TrackerWorkflow source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;
function rangeOf(name){const start=s.indexOf('function '+name+'(');if(start<0)return null;const open=s.indexOf('{',start);if(open<0)throw new Error('Malformed '+name);let d=0,q=null,e=false,line=false,block=false;for(let i=open;i<s.length;i++){const c=s[i],n=s[i+1]||'';if(line){if(c==='\n')line=false;continue;}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0)return{start,end:i+1};}throw new Error('Unterminated '+name);}
function fn(name){const r=rangeOf(name);if(!r)throw new Error(name+' missing');return s.slice(r.start,r.end);}
function put(name,code){const r=rangeOf(name);if(!r)throw new Error(name+' missing');s=s.slice(0,r.start)+code+s.slice(r.end);}
function addBefore(anchor,marker,code){if(s.includes(marker))return;const i=s.indexOf(anchor);if(i<0)throw new Error('Anchor missing '+anchor);s=s.slice(0,i)+code+'\n'+s.slice(i);}

addBefore('function p1aE2EContinuationTick_','function p1aE2EBulkRows_(',`function p1aE2EBulkRows_(sheet,rows){const out={};if(!rows||!rows.length)return out;const last=sheet.getLastRow(),cols=sheet.getLastColumn();if(last<2||cols<1)return out;const headers=sheet.getRange(1,1,1,cols).getDisplayValues()[0],data=sheet.getRange(2,1,last-1,cols).getDisplayValues();for(let i=0;i<rows.length;i++){const r=Number(rows[i]),v=data[r-2];if(!v)continue;const o={};for(let c=0;c<headers.length;c++)if(headers[c])o[headers[c]]=v[c];out[String(r)]=o;}return out;}
function p1aE2EQueueAdmission_(opts){opts=opts||{};return queueMutationAllowed_(opts)?{allowed:true,reason:'ALLOWED',contract:'${ADMISSION}'}:{allowed:false,reason:'WORKER_RUNTIME_CIRCUIT_OPEN',contract:'${ADMISSION}'};}
function p1aJdNewQueueEligible_(a){a=a||{};const trusted=/TRACE-GOLDEN-01/i.test(String(a['Source']||''))||String(a['Source Reliability']||'').toUpperCase()==='OFFICIAL ATS',url=String(a['Canonical Apply URL']||a['Job URL']||'').trim(),vacancy=String(a['Vacancy Status']||'').toUpperCase(),complete=Number(a['JD Completeness %']||0),snap=String(a['JD Snapshot Status']||'');return String(a['Decision']||'')==='New'&&String(a['Status']||'')==='Verifying JD'&&vacancy!=='CLOSED'&&trusted&&!!url&&complete<70&&!/Full JD|Partial JD/i.test(snap);}`);

if(rangeOf('workNeededFromState_')){
  let wn=fn('workNeededFromState_');
  if(!wn.includes('p1aJdNewQueueEligible_(a)')){const open=wn.indexOf('{');wn=wn.slice(0,open+1)+`if(type===JC.W.JD&&p1aJdNewQueueEligible_(a))return true;`+wn.slice(open+1);put('workNeededFromState_',wn);}
}

let tick=fn('p1aE2EContinuationTick_');
if(!tick.includes('const bulk=p1aE2EBulkRows_(aSheet,rows);')){
  const old="let closedCount=0;for(let i=0;i<rows.length;i++){const r=rows[i],a=obj_(aSheet,r),id=String(a['Application ID']||'');";
  const neu="let closedCount=0;const bulk=p1aE2EBulkRows_(aSheet,rows);for(let i=0;i<rows.length;i++){const r=rows[i],a=bulk[String(r)]||{},id=String(a['Application ID']||'');";
  if(!tick.includes(old))throw new Error('E2E row loop anchor missing');
  tick=tick.replace(old,neu);
}
const oldJd="if(p1aVerifyingJdNeedsRetrieve_(a)){const qj=p1aQueueWorkerState_(id,'JD_RETRIEVE');if(qj.state==='ACTIVE')continue;const url=String(a['Canonical Apply URL']||a['Job URL']||'').trim(),input=hash_(id+'|'+url+'|E2E-STRANDED-JD-001'),job=enqueue_(id,'JD_RETRIEVE',{source:'p1a-e2e-continuation-v4',reason:'STRANDED_VERIFYING_JD',contract:'E2E-STRANDED-JD-001'},input);if(!job)throw new Error('DETERMINISTIC:P1A_E2E_JD_ENQUEUE_FAILED');";
if(tick.includes(oldJd)){
  const newJd="if(p1aVerifyingJdNeedsRetrieve_(a)){const qj=p1aQueueWorkerState_(id,JC.W.JD);if(qj.state==='ACTIVE')continue;const url=String(a['Canonical Apply URL']||a['Job URL']||'').trim(),input=hash_(id+'|'+url+'|E2E-STRANDED-JD-001'),opts={source:'p1a-e2e-continuation-v4',reason:'STRANDED_VERIFYING_JD',contract:'E2E-STRANDED-JD-001'},admission=p1aE2EQueueAdmission_(opts);if(!admission.allowed){const deferred={applicationId:id,row:r,status:'JD_ENQUEUE_DEFERRED',reason:admission.reason,contract:'P1-A-E2E-CONTINUATION-4'};upsertWorkerState_('p1a_e2e_continuation_last_result','DEFERRED',JSON.stringify(deferred));return deferred;}const job=enqueue_(id,JC.W.JD,opts,input);if(!job)throw new Error('DETERMINISTIC:P1A_E2E_JD_ENQUEUE_FAILED_AFTER_ADMISSION');";
  tick=tick.replace(oldJd,newJd);
}
put('p1aE2EContinuationTick_',tick);
addBefore('function runP1AE2EContinuationSelfTest','function p1aE2ERuntimeEfficiencySelfTest_(',`function p1aE2ERuntimeEfficiencySelfTest_(){const c=[],trusted={'Decision':'New','Status':'Verifying JD','JD Snapshot Status':'Not Started','JD Completeness %':0,'Source Reliability':'Official ATS','Canonical Apply URL':'https://jobs.example/x'};c.push(JC.W.JD==='JD_RETRIEVE');c.push(p1aE2EQueueAdmission_({recoverySafe:true}).allowed===true);c.push(p1aJdNewQueueEligible_(trusted)===true);c.push(p1aJdNewQueueEligible_(Object.assign({},trusted,{'Source Reliability':'Unverified'}))===false);if(c.some(x=>!x))throw new Error('${BULK} self-test failed '+JSON.stringify(c));return{pass:true,total:c.length,bulk:'${BULK}',admission:'${ADMISSION}',jdNew:'${JD_NEW}',jdWorker:JC.W.JD};}
function runP1AE2ERuntimeEfficiencySelfTest(){const x=p1aE2ERuntimeEfficiencySelfTest_();upsertWorkerState_('p1a_e2e_runtime_efficiency_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));return x;}`);
if(!s.includes(BULK))s+='\n// '+BULK+' active.\n';
if(!s.includes(ADMISSION))s+='\n// '+ADMISSION+' active.\n';
if(!s.includes(JD_NEW))s+='\n// '+JD_NEW+' active.\n';
const check=fn('p1aE2EContinuationTick_');
for(const token of ['p1aE2EBulkRows_(aSheet,rows)','p1aE2EQueueAdmission_(opts)','JD_ENQUEUE_DEFERRED','DETERMINISTIC:P1A_E2E_JD_ENQUEUE_FAILED_AFTER_ADMISSION','p1aQueueWorkerState_(id,JC.W.JD)','enqueue_(id,JC.W.JD'])if(!check.includes(token))throw new Error('E2E runtime efficiency contract missing '+token);
if(check.includes("p1aQueueWorkerState_(id,'JD_RETRIEVE')")||check.includes("enqueue_(id,'JD_RETRIEVE'"))throw new Error('Literal JD worker bypass remains');
if(rangeOf('workNeededFromState_')&&!fn('workNeededFromState_').includes('if(type===JC.W.JD&&p1aJdNewQueueEligible_(a))return true;'))throw new Error(JD_NEW+' not ahead of generic queue state gate');
fs.writeFileSync(file,s);
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,bulk:BULK,admission:ADMISSION,jdNew:JD_NEW,jdWorkerConstant:true,syntax:true},null,2));
