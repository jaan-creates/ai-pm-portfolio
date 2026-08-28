import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='JD-SCORE-ADMISSION-001';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function workNeededFromState_(')&&t.includes('function workerJD_(')&&t.includes('const P12');});
if(!target)throw new Error('Scoring admission source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;

function rangeOf(name){const sig='function '+name+'(';const start=s.indexOf(sig);if(start<0)return null;const open=s.indexOf('{',start);let d=0,q=null,e=false,line=false,block=false;for(let i=open;i<s.length;i++){const c=s[i],n=s[i+1]||'';if(line){if(c==='\n')line=false;continue;}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0)return{start,end:i+1};}throw new Error('Unterminated '+name);}
function replaceFn(name,code){const r=rangeOf(name);if(!r)throw new Error(name+' missing');s=s.slice(0,r.start)+code+s.slice(r.end);}

replaceFn('workNeededFromState_',`function workNeededFromState_(a,type){a=a||{};const decision=String(a['Decision']||''),status=String(a['Status']||'');if(['Closed','On Hold','Submitted','Rejected','Offer','Resume Review','Ready to Submit'].includes(status))return false;if(a['Blocker Category']||a['Exact Input Needed'])return false;const c=Number(a['JD Completeness %']||0),js=String(a['JD Snapshot Status']||''),res=!!a['Resume Version ID']&&!!a['Tailored Resume Link'],qa=String(a['ATS QA Status']||'');if(type===JC.W.JD){if(!['New','Apply'].includes(decision))return false;if(decision==='New'&&status!=='Verifying JD')return false;return c<70||!/Full JD|Partial JD/.test(js);}if(type===JC.W.SCORE){/* ${CONTRACT}: scoring determines Apply/Skip, so Decision=New must be admissible after JD persistence. */return ['New','Apply'].includes(decision)&&status==='Scoring'&&c>=70&&/Full JD|Partial JD/.test(js);}if(decision!=='Apply')return false;if(type===JC.W.RES)return !res;if(type===JC.W.MIG)return res&&qa!=='Passed';if(type===JC.W.QA)return res&&qa!=='Passed';return true;}`);

if(!s.includes('function jdScoreAdmissionSelfTest_(')){
  const anchor='function workNeeded_(';
  const i=s.indexOf(anchor);if(i<0)throw new Error('workNeeded_ anchor missing');
  const test=`function jdScoreAdmissionSelfTest_(){const c=[];c.push(workNeededFromState_({'Decision':'New','Status':'Scoring','JD Completeness %':90,'JD Snapshot Status':'Verified Full JD'},JC.W.SCORE)===true);c.push(workNeededFromState_({'Decision':'New','Status':'Verifying JD','JD Completeness %':90,'JD Snapshot Status':'Verified Full JD'},JC.W.SCORE)===false);c.push(workNeededFromState_({'Decision':'New','Status':'Scoring','JD Completeness %':40,'JD Snapshot Status':'Partial JD'},JC.W.SCORE)===false);c.push(workNeededFromState_({'Decision':'New','Status':'Scoring','JD Completeness %':90,'JD Snapshot Status':'Verified Full JD'},JC.W.RES)===false);if(c.some(x=>!x))throw new Error('${CONTRACT} self-test failed '+JSON.stringify(c));return{pass:true,total:c.length,contract:'${CONTRACT}'};}\nfunction runJdScoreAdmissionSelfTest(){const x=jdScoreAdmissionSelfTest_();upsertWorkerState_('jd_score_admission_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));upsertWorkerState_('jd_score_admission_contract_version','${CONTRACT}','New + Scoring + persisted JD may enqueue SCORE; downstream resume still requires Apply');return x;}\n`;
  s=s.slice(0,i)+test+s.slice(i);
}

for(const token of [CONTRACT,'function jdScoreAdmissionSelfTest_(','function runJdScoreAdmissionSelfTest()','jd_score_admission_self_test'])if(!s.includes(token))throw new Error('Scoring admission contract missing '+token);
if(!s.includes("status==='Scoring'&&c>=70"))throw new Error('Scoring admission state guard missing');
if(!s.includes("if(decision!=='Apply')return false"))throw new Error('Downstream Apply gate must remain intact');
fs.writeFileSync(file,s);
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:CONTRACT,newDecisionScoreAdmission:true,resumeStillApplyGated:true,syntax:true},null,2));
