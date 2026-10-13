import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='HEALTH-OWNER-VALIDATION-STARVATION-001';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function phase1HealthTick(')&&t.includes('fl101OwnerValidationTick_');});
if(!target) throw new Error('phase1HealthTick with FL101 owner validation not found');
const file=path.join(root,target);
let s=fs.readFileSync(file,'utf8');

function rangeOf(name){
  const start=s.indexOf('function '+name+'(');if(start<0)return null;
  const open=s.indexOf('{',start);let d=0,q=null,e=false,line=false,block=false;
  for(let i=open;i<s.length;i++){const c=s[i],n=s[i+1]||'';
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}
    if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='"'||c==="'"||c==='`'){q=c;continue;}
    if(c==='{')d++;else if(c==='}'&&--d===0)return{start,end:i+1};
  }
  throw new Error('unterminated '+name);
}

const r=rangeOf('phase1HealthTick');if(!r)throw new Error('phase1HealthTick missing');
let fn=s.slice(r.start,r.end);
if(!fn.includes(CONTRACT)){
  const re=/(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*fl101OwnerValidationTick_\(\)\s*;\s*if\s*\(\s*\2(?:\s*&&\s*\2\.handled)?\s*\)\s*return\s+\2\s*;/;
  const m=fn.match(re);
  if(!m)throw new Error('Unsupported FL101 health-return shape; refuse unsafe rewrite');
  const decl=m[1],v=m[2];
  const replacement=decl+' '+v+'=fl101OwnerValidationTick_();/* '+CONTRACT+': terminal owner-validation results must not starve health/runtime reconciliation. */if('+v+'&&'+v+'.handled&&!['+"'FAILED','PASS','SUCCEEDED','COMPLETE'"+'].includes(String('+v+'.status||\'\').toUpperCase()))return '+v+';';
  fn=fn.replace(re,replacement);
  s=s.slice(0,r.start)+fn+s.slice(r.end);
}
const rr=rangeOf('phase1HealthTick');const out=s.slice(rr.start,rr.end);
for(const token of [CONTRACT,'fl101OwnerValidationTick_','reconcileWorkerRuntimeCircuitAfterHealth_'])if(!out.includes(token))throw new Error('health starvation contract missing '+token);
fs.writeFileSync(file,s);
const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr||'syntax failure');
console.log(JSON.stringify({status:'PASS',contract:CONTRACT,file:target},null,2));
