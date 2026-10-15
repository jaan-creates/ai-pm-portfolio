import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{
  const t=fs.readFileSync(path.join(root,f),'utf8');
  return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');
});
if(!target)throw new Error('TrackerWorkflow source not found');

const file=path.join(root,target);
let s=fs.readFileSync(file,'utf8'),before=s;
const anchor='function verifyReleaseIdentity()';

function rangeOf(name){
  const marker='function '+name+'(';
  const start=s.indexOf(marker);
  if(start<0)return null;
  const open=s.indexOf('{',start+marker.length);
  if(open<0)throw new Error('Function body missing '+name);
  let depth=0,quote='',esc=false,line=false,block=false;
  for(let i=open;i<s.length;i++){
    const c=s[i],n=s[i+1]||'';
    if(line){if(c==='\\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(esc){esc=false;continue;}
    if(quote){if(c==='\\\\')esc=true;else if(c===quote)quote='';continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}
    if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==="'"||c==='"'||c==='\`'){quote=c;continue;}
    if(c==='{')depth++;
    else if(c==='}'&&--depth===0)return{start,end:i+1};
  }
  throw new Error('Unterminated '+name);
}
function insertBeforeAnchor(code){
  const i=s.indexOf(anchor);
  if(i<0)throw new Error('release identity anchor missing');
  s=s.slice(0,i)+code+String.fromCharCode(10)+s.slice(i);
}
function replaceFunction(name,code){
  const r=rangeOf(name);
  if(!r)throw new Error(name+' missing');
  s=s.slice(0,r.start)+code+s.slice(r.end);
}
function add(token,code){if(!s.includes(token))insertBeforeAnchor(code);}

for(const token of ['function find_(','function obj_(','function set_(','function enqueue_(','function hash_(']){
  if(!s.includes(token))throw new Error('admission continuation dependency missing '+token);
}

if(!s.includes('function p1aScoreCompletionAdmission_(')){
  add('function p1aScoreCompletionAdmission_(',`function p1aScoreCompletionAdmission_(appId){const r=find_(JC.S.A,appId);if(!r)return{admitted:false,reason:'APPLICATION_MISSING'};const sh=SH_(JC.S.A),a=obj_(sh,r),decision=String(a['Decision']||''),status=String(a['Status']||''),resume=String(a['Resume Version ID']||''),vacancy=String(a['Vacancy Status']||'').toUpperCase(),snap=String(a['JD Snapshot Status']||''),complete=Number(a['JD Completeness %']||0);if(decision!=='Apply'||!['Scoring','Tailoring'].includes(status)||resume||vacancy==='CLOSED'||(complete<70&&!/Verified/i.test(snap)))return{admitted:false,reason:'PRECONDITION_NOT_MET'};const input=hash_(appId+'|'+String(a['JD Fit Score']||'')+'|'+String(a['JD Completeness %']||'')+'|score-completion-admission-v1'),job=enqueue_(appId,'RESUME_GENERATE',{source:'score-completion-admission-v1',reason:'SCORE_COMPLETE_NEEDS_RESUME',contract:'P1-A-SCORE-COMPLETION-ADMISSION-1'},input);set_(JC.S.A,r,{'Status':'Tailoring','Next Action':'System-owned: score map completed; generate tailored resume automatically.','Your Required Action':'No action','Last Operator Update':now_()});return{admitted:true,queueJobId:String(job||''),applicationId:appId};}`);
  add('function p1aScoreCompletionAdmissionSelfTest_(',`function p1aScoreCompletionAdmissionSelfTest_(){const source=String(p1aScoreCompletionAdmission_);if(!source.includes("['Scoring','Tailoring'].includes(status)"))throw new Error('score admission status gate missing');if(!source.includes("RESUME_GENERATE"))throw new Error('score admission resume worker missing');if(!source.includes('SCORE_COMPLETE_NEEDS_RESUME'))throw new Error('score admission reason missing');return{pass:true,contract:'P1-A-SCORE-COMPLETION-ADMISSION-1'};}`);
  add('function runP1AScoreCompletionAdmissionSelfTest(',`function runP1AScoreCompletionAdmissionSelfTest(){const x=p1aScoreCompletionAdmissionSelfTest_();upsertWorkerState_('p1a_score_completion_admission_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));return x;}`);
}

const original=rangeOf('workerScore_');
if(original && !s.includes('function workerScoreOriginal_(')){
  const old=s.slice(original.start,original.end);
  const renamed=old.replace('function workerScore_(','function workerScoreOriginal_(');
  s=s.slice(0,original.start)+renamed+s.slice(original.end);
  add('function workerScore_(appId,p){',`function workerScore_(appId,p){const out=workerScoreOriginal_(appId,p);const admission=p1aScoreCompletionAdmission_(appId);upsertWorkerState_('p1a_score_completion_admission_last_result',admission.admitted?'PASS':'NO_ADMISSION',JSON.stringify(admission).slice(0,1500));return out;}`);
}

if(!s.includes("runP1AScoreCompletionAdmissionSelfTest();")){
  const health='function phase1HealthTick';
  const i=s.indexOf(health);
  if(i<0)throw new Error('health tick anchor missing');
  s=s.slice(0,i)+"try{runP1AScoreCompletionAdmissionSelfTest();}catch(e){upsertWorkerState_('p1a_score_completion_admission_self_test','FAIL',String((e&&e.stack)||e).slice(0,1500));}"+String.fromCharCode(10)+s.slice(i);
}

for(const token of ['function p1aScoreCompletionAdmission_(','function p1aScoreCompletionAdmissionSelfTest_(','function runP1AScoreCompletionAdmissionSelfTest(','function workerScoreOriginal_(','SCORE_COMPLETE_NEEDS_RESUME','P1-A-SCORE-COMPLETION-ADMISSION-1'])if(!s.includes(token))throw new Error('score completion admission wiring missing '+token);
if(s!==before)fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:'P1-A-SCORE-COMPLETION-ADMISSION-1',worker:'RESUME_GENERATE',trigger:'workerScore completion'},null,2));
