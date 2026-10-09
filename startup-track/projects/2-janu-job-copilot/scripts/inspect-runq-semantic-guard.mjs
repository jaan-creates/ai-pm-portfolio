import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>fs.readFileSync(path.join(root,f),'utf8').includes('function runQ_('));
if(!target)throw new Error('runQ_ target missing');
const s=fs.readFileSync(path.join(root,target),'utf8');
function extract(name){const start=s.indexOf('function '+name+'(');if(start<0)return'';const open=s.indexOf('{',start);let d=0,q=null,e=false;for(let i=open;i<s.length;i++){const c=s[i];if(q){if(e){e=false;continue}if(c==='\\'){e=true;continue}if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return s.slice(start,i+1);}return'';}
const fn=extract('runQ_');
const needles=['workNeeded_','STALE_SEMANTIC_WORK','rendererQuarantineBlocks_','Payload Ref','canary'];
const contexts=[];
for(const n of needles){let pos=0;while((pos=fn.indexOf(n,pos))>=0){contexts.push({needle:n,context:fn.slice(Math.max(0,pos-420),Math.min(fn.length,pos+900)).replace(/[A-Za-z0-9_]{40,}/g,'<redacted-long-token>')});pos+=n.length;}}
console.log(JSON.stringify({status:'PASS',file:target,runQLength:fn.length,contexts},null,2));
