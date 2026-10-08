import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>fs.readFileSync(path.join(root,f),'utf8').includes('function phase1HealthTick('));
if(!target)throw new Error('phase1HealthTick target missing');
const s=fs.readFileSync(path.join(root,target),'utf8');
const start=s.indexOf('function phase1HealthTick(');
const open=s.indexOf('{',start);let d=0,q=null,e=false,end=-1;
for(let i=open;i<s.length;i++){const c=s[i];if(q){if(e){e=false;continue}if(c==='\\'){e=true;continue}if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0){end=i+1;break}}
if(end<0)throw new Error('unterminated phase1HealthTick');
const fn=s.slice(start,end);
const out=[];let pos=0;
while((pos=fn.indexOf('budgetGuard_(',pos))>=0){
  const a=Math.max(0,pos-260),b=Math.min(fn.length,pos+420);
  out.push(fn.slice(a,b).replace(/[A-Za-z0-9_]{24,}/g,'<redacted-long-token>').replace(/https?:\/\/[^'\"\s)]+/g,'<redacted-url>'));
  pos+=12;
}
console.log(JSON.stringify({status:'PASS',file:target,phase1HealthTickLength:fn.length,budgetGuardOccurrences:out.length,contexts:out},null,2));
