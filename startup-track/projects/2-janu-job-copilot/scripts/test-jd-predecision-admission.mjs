import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const projectDir=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patcher=path.join(projectDir,'scripts','patch-jd-predecision-admission.mjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-jd-admission-'));
const file=path.join(dir,'TrackerWorkflow.js');
fs.writeFileSync(file,`const JC={W:{JD:'JD_RETRIEVE',RES:'RESUME_GENERATE',MIG:'MIGRATE',QA:'QA_FINALIZE'}};\nfunction workNeededFromState_(a,type){a=a||{};if(String(a['Decision']||'')!=='Apply')return false;if(['Closed','On Hold','Submitted','Rejected','Offer','Resume Review','Ready to Submit'].includes(String(a['Status']||'')))return false;if(a['Blocker Category']||a['Exact Input Needed'])return false;const c=Number(a['JD Completeness %']||0),js=String(a['JD Snapshot Status']||''),res=!!a['Resume Version ID']&&!!a['Tailored Resume Link'],qa=String(a['ATS QA Status']||'');if(type===JC.W.JD)return c<70||!/Full JD|Partial JD/.test(js);if(type===JC.W.RES)return !res;if(type===JC.W.MIG)return res&&qa!=='Passed';if(type===JC.W.QA)return res&&qa!=='Passed';return true;}\n`);
function patch(){const r=spawnSync(process.execPath,[patcher,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout||'patch failed');}
patch();const once=fs.readFileSync(file,'utf8');patch();const out=fs.readFileSync(file,'utf8');if(out!==once)throw new Error('patch not idempotent');
for(const token of ['JD-PREDECISION-ADMISSION-001',"decision==='New'&&status!=='Verifying JD'","if(decision!=='Apply')return false"])if(!out.includes(token))throw new Error('missing '+token);
const ctx={};vm.createContext(ctx);vm.runInContext(out+'\nthis.workNeededFromState_=workNeededFromState_;this.JC=JC;',ctx);const f=ctx.workNeededFromState_,W=ctx.JC.W;
const base={'Decision':'New','Status':'Verifying JD','JD Completeness %':0,'JD Snapshot Status':'Not Started','Resume Version ID':'','Tailored Resume Link':'','ATS QA Status':'Not Started'};
const checks=[];
checks.push(f({...base},W.JD)===true);
checks.push(f({...base,'Status':'New'},W.JD)===false);
checks.push(f({...base,'Decision':'Hold'},W.JD)===false);
checks.push(f({...base,'Status':'Closed'},W.JD)===false);
checks.push(f({...base,'Blocker Category':'Need input'},W.JD)===false);
checks.push(f({...base},W.RES)===false);
checks.push(f({...base,'Decision':'Apply','Status':'Tailoring'},W.RES)===true);
checks.push(f({...base,'Decision':'Apply','Status':'Verifying JD','JD Completeness %':95,'JD Snapshot Status':'Full JD'},W.JD)===false);
if(checks.some(x=>!x))throw new Error('JD-PREDECISION-ADMISSION-001 behavior failed '+JSON.stringify(checks));
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({status:'PASS',contract:'JD-PREDECISION-ADMISSION-001',checks:checks.length,idempotent:true,newVerifyingJd:true,downstreamApplyOnly:true,terminalAndBlockerGuards:true,syntax:true},null,2));
