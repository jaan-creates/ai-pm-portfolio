import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='JD-PREDECISION-ADMISSION-001';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>fs.readFileSync(path.join(root,f),'utf8').includes('function workNeededFromState_('));
if(!target)throw new Error('workNeededFromState_ source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;

function rangeOf(name){const start=s.indexOf('function '+name+'(');if(start<0)return null;const open=s.indexOf('{',start);if(open<0)throw new Error('Malformed '+name);let d=0,q=null,e=false,line=false,block=false;for(let i=open;i<s.length;i++){const c=s[i],n=s[i+1]||'';if(line){if(c==='\n')line=false;continue;}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0)return{start,end:i+1};}throw new Error('Unterminated '+name);}
function replaceFn(name,code){const r=rangeOf(name);if(!r)throw new Error(name+' missing');s=s.slice(0,r.start)+code+s.slice(r.end);}

replaceFn('workNeededFromState_',`function workNeededFromState_(a,type){a=a||{};const decision=String(a['Decision']||''),status=String(a['Status']||'');if(['Closed','On Hold','Submitted','Rejected','Offer','Resume Review','Ready to Submit'].includes(status))return false;if(a['Blocker Category']||a['Exact Input Needed'])return false;const c=Number(a['JD Completeness %']||0),js=String(a['JD Snapshot Status']||''),res=!!a['Resume Version ID']&&!!a['Tailored Resume Link'],qa=String(a['ATS QA Status']||'');if(type===JC.W.JD){if(!['New','Apply'].includes(decision))return false;if(decision==='New'&&status!=='Verifying JD')return false;return c<70||!/Full JD|Partial JD/.test(js);}if(decision!=='Apply')return false;if(type===JC.W.RES)return !res;if(type===JC.W.MIG)return res&&qa!=='Passed';if(type===JC.W.QA)return res&&qa!=='Passed';return true;}`);
if(!s.includes(CONTRACT))s+='\n// '+CONTRACT+' permits JD_RETRIEVE for New + Verifying JD while preserving Apply-only admission for downstream workers.\n';
for(const token of [CONTRACT,"decision==='New'&&status!=='Verifying JD'","if(type===JC.W.JD)","if(decision!=='Apply')return false"])if(!s.includes(token))throw new Error(CONTRACT+' missing '+token);
fs.writeFileSync(file,s);
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:CONTRACT,newVerifyingJd:true,downstreamApplyOnly:true,terminalAndBlockerGuards:true,syntax:true},null,2));
