import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>fs.readFileSync(path.join(root,f),'utf8').includes('function enqueue_('));
if(!target)throw new Error('enqueue_ target missing');
const s=fs.readFileSync(path.join(root,target),'utf8');
function extract(name){const start=s.indexOf('function '+name+'(');if(start<0)return'';const open=s.indexOf('{',start);let d=0,q=null,e=false;for(let i=open;i<s.length;i++){const c=s[i];if(q){if(e){e=false;continue}if(c==='\\'){e=true;continue}if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return s.slice(start,i+1);}return'';}
for(const name of ['enqueue_','queueJobFresh_','workNeeded_']){const fn=extract(name);if(!fn)continue;console.log(JSON.stringify({name,length:fn.length,body:fn.replace(/[A-Za-z0-9_]{48,}/g,'<redacted-long-token>').replace(/https?:\/\/[^'\"\s)]+/g,'<redacted-url>')},null,2));}
