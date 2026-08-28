import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='JD-SCORE-ADMISSION-001';
const RECOVERY='JD-SCORE-RECOVERY-001';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function workNeededFromState_(')&&t.includes('function workerJD_(')&&t.includes('const P12');});
if(!target)throw new Error('Scoring admission source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;

function rangeOf(name){const sig='function '+name+'(';const start=s.indexOf(sig);if(start<0)return null;const open=s.indexOf('{',start);let d=0,q=null,e=false,line=false,block=false;for(let i=open;i<s.length;i++){const c=s[i],n=s[i+1]||'';if(line){if(c==='\n')line=false;continue;}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0)return{start,open,end:i+1};}throw new Error('Unterminated '+name);}
function replaceFn(name,code){const r=rangeOf(name);if(!r)throw new Error(name+' missing');s=s.slice(0,r.start)+code+s.slice(r.end);}
function insertBefore(name,code){const r=rangeOf(name);if(!r)throw new Error(name+' missing');s=s.slice(0,r.start)+code+'\n'+s.slice(r.start);}
function appendToFn(name,marker,code){if(s.includes(marker))return;const r=rangeOf(name);if(!r)throw new Error(name+' missing');const close=r.end-1;s=s.slice(0,close)+code+s.slice(close);}

replaceFn('workNeededFromState_',`function workNeededFromState_(a,type){a=a||{};const decision=String(a['Decision']||''),status=String(a['Status']||'');if(['Closed','On Hold','Submitted','Rejected','Offer','Resume Review','Ready to Submit'].includes(status))return false;if(a['Blocker Category']||a['Exact Input Needed'])return false;const c=Number(a['JD Completeness %']||0),js=String(a['JD Snapshot Status']||''),res=!!a['Resume Version ID']&&!!a['Tailored Resume Link'],qa=String(a['ATS QA Status']||'');if(type===JC.W.JD){if(!['New','Apply'].includes(decision))return false;if(decision==='New'&&status!=='Verifying JD')return false;return c<70||!/Full JD|Partial JD/.test(js);}if(type===JC.W.SCORE){/* ${CONTRACT}: scoring determines Apply/Skip, so Decision=New must be admissible after JD persistence. */return ['New','Apply'].includes(decision)&&status==='Scoring'&&c>=70&&/Full JD|Partial JD/.test(js);}if(decision!=='Apply')return false;if(type===JC.W.RES)return !res;if(type===JC.W.MIG)return res&&qa!=='Passed';if(type===JC.W.QA)return res&&qa!=='Passed';return true;}`);

if(!s.includes('function jdScoreAdmissionSelfTest_(')){
  const anchor='function workNeeded_(';
  const i=s.indexOf(anchor);if(i<0)throw new Error('workNeeded_ anchor missing');
  const test=`function jdScoreAdmissionSelfTest_(){const c=[];c.push(workNeededFromState_({'Decision':'New','Status':'Scoring','JD Completeness %':90,'JD Snapshot Status':'Verified Full JD'},JC.W.SCORE)===true);c.push(workNeededFromState_({'Decision':'New','Status':'Verifying JD','JD Completeness %':90,'JD Snapshot Status':'Verified Full JD'},JC.W.SCORE)===false);c.push(workNeededFromState_({'Decision':'New','Status':'Scoring','JD Completeness %':40,'JD Snapshot Status':'Partial JD'},JC.W.SCORE)===false);c.push(workNeededFromState_({'Decision':'New','Status':'Scoring','JD Completeness %':90,'JD Snapshot Status':'Verified Full JD'},JC.W.RES)===false);if(c.some(x=>!x))throw new Error('${CONTRACT} self-test failed '+JSON.stringify(c));return{pass:true,total:c.length,contract:'${CONTRACT}'};}\nfunction runJdScoreAdmissionSelfTest(){const x=jdScoreAdmissionSelfTest_();upsertWorkerState_('jd_score_admission_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));upsertWorkerState_('jd_score_admission_contract_version','${CONTRACT}','New + Scoring + persisted JD may enqueue SCORE; downstream resume still requires Apply');return x;}\n`;
  s=s.slice(0,i)+test+s.slice(i);
}

if(!s.includes('function jdScoreAdmissionRecoveryTick_(')){
  if(!s.includes('function rendererWorkerStateValue_('))throw new Error('Golden-trace Worker State reader missing; refuse broad recovery scan');
  insertBefore('workNeeded_',`function jdScoreAdmissionRecoveryTick_(){const appId=String(rendererWorkerStateValue_('golden_trace_application_id')||'');if(!appId)return{status:'NO_GOLDEN_TRACE_APP',contract:'${RECOVERY}'};const r=find_(JC.S.A,appId);if(!r)return{status:'APP_NOT_FOUND',applicationId:appId,contract:'${RECOVERY}'};const a=obj_(SH_(JC.S.A),r);if(!workNeededFromState_(a,JC.W.SCORE)||has_(JC.S.MAP,appId)){const out={status:'NOT_NEEDED',applicationId:appId,contract:'${RECOVERY}'};upsertWorkerState_('jd_score_admission_recovery_last_result',out.status,JSON.stringify(out));return out;}const h=hash_(appId+'|'+String(a['JD Completeness %']||'')+'|${RECOVERY}');const q=enqueue_(appId,JC.W.SCORE,{source:'jd-score-admission-recovery',contract:'${RECOVERY}'},h);const out={status:q?'ENQUEUED':'NOT_ENQUEUED',applicationId:appId,queueJobId:q||null,contract:'${RECOVERY}'};upsertWorkerState_('jd_score_admission_recovery_last_result',out.status,JSON.stringify(out));return out;}\nfunction runJdScoreAdmissionRecovery(){runJdScoreAdmissionSelfTest();return jdScoreAdmissionRecoveryTick_();}`);
}

appendToFn('phase1HealthTick','jd_score_admission_recovery_last_result',`try{runJdScoreAdmissionSelfTest();}catch(e){upsertWorkerState_('jd_score_admission_self_test','FAIL',String((e&&e.stack)||e).slice(0,1500));}try{jdScoreAdmissionRecoveryTick_();}catch(e){upsertWorkerState_('jd_score_admission_recovery_last_result','FAIL',String((e&&e.stack)||e).slice(0,1500));}`);

for(const token of [CONTRACT,RECOVERY,'function jdScoreAdmissionSelfTest_(','function runJdScoreAdmissionSelfTest()','function jdScoreAdmissionRecoveryTick_(','function runJdScoreAdmissionRecovery()','jd_score_admission_self_test','jd_score_admission_recovery_last_result'])if(!s.includes(token))throw new Error('Scoring admission contract missing '+token);
if(!s.includes("status==='Scoring'&&c>=70"))throw new Error('Scoring admission state guard missing');
if(!s.includes("if(decision!=='Apply')return false"))throw new Error('Downstream Apply gate must remain intact');
if(!s.includes("rendererWorkerStateValue_('golden_trace_application_id')"))throw new Error('Recovery must stay bounded to the golden trace application');
if(!s.includes("source:'jd-score-admission-recovery'"))throw new Error('Recovery enqueue provenance missing');
fs.writeFileSync(file,s);
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:CONTRACT,recovery:RECOVERY,newDecisionScoreAdmission:true,resumeStillApplyGated:true,recoveryScope:'golden_trace_application_id',maxRecoveryAppsPerHealthTick:1,circuitBypass:false,publicRecoveryEntrypoint:'runJdScoreAdmissionRecovery',syntax:true},null,2));
