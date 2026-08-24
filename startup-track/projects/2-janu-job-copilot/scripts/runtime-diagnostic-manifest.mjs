import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function phase1OneJobTickCore_(')&&t.includes('function processQ_(');});
if(!target) throw new Error('TrackerWorkflow source not found');
const s=fs.readFileSync(path.join(root,target),'utf8');
const names=['nextQ_','queueJobFresh_','queueSelectPure_','processQ_','runQ_','phase1OneJobTickCore_','runtimeBudgetOk_','ensureP12Sheets_','maintenanceStage_'];

function functionBody(name){
  const sig='function '+name+'(';
  const start=s.indexOf(sig); if(start<0)return null;
  const argsStart=start+sig.length, argsEnd=s.indexOf(')',argsStart), open=s.indexOf('{',argsEnd);
  if(argsEnd<0||open<0)return null;
  let depth=0,quote=null,esc=false,line=false,block=false,end=-1;
  for(let i=open;i<s.length;i++){
    const c=s[i],n=s[i+1]||'';
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(quote){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===quote)quote=null;continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='{')depth++;else if(c==='}'&&--depth===0){end=i+1;break;}
  }
  if(end<0)return null;
  const body=s.slice(open+1,end-1);
  const calls=[...body.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]);
  const callSet=[...new Set(calls)].filter(x=>!['if','for','while','switch','catch','function'].includes(x));
  const safeLiterals=[...body.matchAll(/['"]([^'"\n]{1,80})['"]/g)].map(m=>m[1]).filter(x=>/(Worker Runtime|queue|queued|running|retry|pending|cancel|succeed|fail|stale|fresh|budget|runtime|maintenance|pre-|post-|CIRCUIT|JOB_)/i.test(x)).slice(0,30);
  const count=(re)=>(body.match(re)||[]).length;
  return {
    name,
    args:s.slice(argsStart,argsEnd).split(',').map(x=>x.trim()).filter(Boolean),
    calls:callSet,
    safeLiterals,
    metrics:{
      bodyLength:body.length,
      bodySha256:crypto.createHash('sha256').update(body).digest('hex'),
      forLoops:count(/\bfor\s*\(/g),
      whileLoops:count(/\bwhile\s*\(/g),
      getRangeCalls:count(/\.getRange\s*\(/g),
      getValuesCalls:count(/\.getValues\s*\(/g),
      getDisplayValuesCalls:count(/\.getDisplayValues\s*\(/g),
      getValueCalls:count(/\.getValue\s*\(/g),
      getDisplayValueCalls:count(/\.getDisplayValue\s*\(/g),
      setValueCalls:count(/\.setValue\s*\(/g),
      queueFreshCalls:count(/\bqueueJobFresh_\s*\(/g),
      findCalls:count(/\bfind_\s*\(/g),
      objectReads:count(/\bobj_\s*\(/g)
    }
  };
}

const functions=names.map(functionBody).filter(Boolean);
console.log(JSON.stringify({status:'PASS',mode:'READ_ONLY_PRIVACY_SAFE_STRUCTURE',target,functions},null,2));
