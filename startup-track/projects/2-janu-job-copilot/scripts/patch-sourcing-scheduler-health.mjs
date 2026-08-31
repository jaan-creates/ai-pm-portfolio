import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function sourceFreshnessHealth_(')&&t.includes('const P12');});
if(!target)throw new Error('Daily Sourcing health target not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');
function rangeOf(name){const start=s.indexOf('function '+name+'(');if(start<0)return null;const open=s.indexOf('{',start);let d=0,q=null,e=false,line=false,block=false;for(let i=open;i<s.length;i++){const c=s[i],n=s[i+1]||'';if(line){if(c==='\n')line=false;continue;}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0)return{start,end:i+1};}throw new Error('Unterminated '+name);}
function replaceFn(name,code){const r=rangeOf(name);if(!r)throw new Error('Missing '+name);s=s.slice(0,r.start)+code+s.slice(r.end);}
const helper=`function sourcingScheduledSuccess_(status,trigger){return String(status||'')==='SUCCEEDED'&&String(trigger||'').trim()==='Daily PM Sourcing Worker';/* SOURCING-HEALTH-BLOCKER-PRECEDENCE-001 / SOURCING-RECOVERY-NOT-LIVENESS-001 */}`;
if(!s.includes('function sourcingScheduledSuccess_(')){const i=s.indexOf('function sourceFreshnessHealth_(');s=s.slice(0,i)+helper+'\n'+s.slice(i);}
replaceFn('sourceFreshnessHealth_',`function sourceFreshnessHealth_(){
  ensureP12Sheets_();const s=SH_(P12.SHEETS.SOURCING);if(s.getLastRow()<2){healthSet_('Daily Sourcing','DEGRADED','OPEN','NO_SOURCING_RUN','No sourcing run records',0,'');return false;}
  const m=hm_(s),v=s.getDataRange().getValues();let lastScheduled=null,lastAny=null;
  for(let i=1;i<v.length;i++){const status=String(v[i][m['Status']-1]||''),trigger=String(v[i][m['Trigger']-1]||''),d=status==='SUCCEEDED'?parseDateish_(v[i][m['Finished At']-1]):null;if(d&&(!lastAny||d>lastAny))lastAny=d;if(d&&sourcingScheduledSuccess_(status,trigger)&&(!lastScheduled||d>lastScheduled))lastScheduled=d;}
  const day=Number(Utilities.formatDate(now_(),'Asia/Kolkata','u')),weekday=day<=5,age=lastScheduled?(now_()-lastScheduled)/3600000:999,ok=!weekday||age<=24;
  if(ok)closeCircuit_('Daily Sourcing','Latest scheduled sourcing age '+age.toFixed(1)+'h');else openCircuit_('Daily Sourcing','SOURCING_SCHEDULER_STALE','No successful scheduled weekday sourcing cycle within 24h; recovery/manual success does not prove scheduler liveness');
  upsertWorkerState_('sourcing_scheduler_health',ok?'PASS':'STALE',JSON.stringify({contract:'SOURCING-HEALTH-BLOCKER-PRECEDENCE-001',latestScheduled:lastScheduled?lastScheduled.toISOString():'',latestAnySuccess:lastAny?lastAny.toISOString():'',weekday:weekday,ageHours:age}).slice(0,1500));return ok;
}`);
for(const token of ['SOURCING-HEALTH-BLOCKER-PRECEDENCE-001','SOURCING-RECOVERY-NOT-LIVENESS-001','SOURCING_SCHEDULER_STALE','function sourcingScheduledSuccess_('])if(!s.includes(token))throw new Error('Sourcing health contract missing '+token);
fs.writeFileSync(file,s);const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr);console.log(JSON.stringify({status:'PASS',contract:'SOURCING-HEALTH-BLOCKER-PRECEDENCE-001',file:target},null,2));