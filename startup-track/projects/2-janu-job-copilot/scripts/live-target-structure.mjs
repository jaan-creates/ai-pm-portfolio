import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2]||'.janu-live';
const file=path.join(root,'TrackerWorkflow.js');
const s=fs.readFileSync(file,'utf8');
const targets=['workerJD_','parseSaveJD_','loadJD_','promoteSourceIntake_','sourceWritebackProjection_','workerCompany_','workerContacts_','companyFor_','contactsFor_','processQ_','runQ_'];
function bodyFor(name){
  const re=new RegExp('function\\s+'+name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'\\s*\\(([^)]*)\\)\\s*\\{','m');
  const m=re.exec(s); if(!m)return null;
  const start=m.index, open=s.indexOf('{',m.index), args=m[1].split(',').map(x=>x.trim()).filter(Boolean);
  let depth=0,end=-1,inS=false,inD=false,inT=false,esc=false;
  for(let i=open;i<s.length;i++){
    const c=s[i];
    if(esc){esc=false;continue;}
    if(c==='\\\\'){esc=true;continue;}
    if(inS){if(c==="'")inS=false;continue;}
    if(inD){if(c==='"')inD=false;continue;}
    if(inT){if(c==='`')inT=false;continue;}
    if(c==="'"){inS=true;continue;} if(c==='"'){inD=true;continue;} if(c==='`'){inT=true;continue;}
    if(c==='{')depth++; else if(c==='}'&&--depth===0){end=i+1;break;}
  }
  if(end<0)return null;
  const body=s.slice(open+1,end-1);
  const calls=[...body.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)].map(x=>x[1]).filter(x=>x!==name);
  const unique=[...new Set(calls)].filter(x=>/(_$|Q_$|For_$|JD_$|SaveJD_$|Intake_$|Projection_$|Company_$|Contacts_$)/.test(x)).slice(0,40);
  const literals=[...body.matchAll(/['"]([A-Za-z][A-Za-z0-9 _-]{2,40})['"]/g)].map(x=>x[1]).filter(x=>!/[0-9]{4,}/.test(x)).slice(0,20);
  return {name,args,calls:unique,literals};
}
const out=targets.map(bodyFor).filter(Boolean);
console.log(JSON.stringify({status:'PASS',targets:out},null,2));
