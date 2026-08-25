import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target)throw new Error('TrackerWorkflow source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;
function rangeOf(name){const sig='function '+name+'(';const start=s.indexOf(sig);if(start<0)return null;const open=s.indexOf('{',start);let depth=0,quote=null,esc=false;for(let i=open;i<s.length;i++){const c=s[i];if(quote){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===quote)quote=null;continue;}if(c==='"'||c==="'"||c==='`'){quote=c;continue;}if(c==='{')depth++;else if(c==='}'&&--depth===0)return{start,end:i+1};}throw new Error('Unterminated '+name);}
function fn(name){const r=rangeOf(name);if(!r)throw new Error(name+' missing');return s.slice(r.start,r.end);}
function put(name,body){const r=rangeOf(name);if(!r)throw new Error(name+' missing');s=s.slice(0,r.start)+body+s.slice(r.end);}
let e=fn('p1aE2EContinuationTick_');
const guard=/if\s*\(\s*(?:p1a)?renderer(?:Resume)?Quarantined_?\([^;{}]*\)\s*\)\s*\{?\s*continue;?\s*\}?/ig;
e=e.replace(guard,'');
const helperNames=['p1aRendererQuarantined_','rendererResumeQuarantined_','rendererQuarantined_'];
const helper=helperNames.find(n=>s.includes('function '+n+'('));
if(!helper)throw new Error('renderer quarantine helper missing');
const call=`${helper}(id)`;
function guardBefore(reason){const needle=`job=enqueue_(id,'RESUME_GENERATE',{source:'p1a-e2e-continuation-v3',reason:'${reason}'}`;const i=e.indexOf(needle);if(i<0)throw new Error('resume enqueue anchor missing '+reason);const stmt=e.lastIndexOf('const input=',i);if(stmt<0)throw new Error('input anchor missing '+reason);if(e.slice(Math.max(0,stmt-220),stmt).includes(call))return;e=e.slice(0,stmt)+`if(${call})continue;`+e.slice(stmt);}
for(const reason of ['STALE_VERIFYING_JD_TO_TAILORING','TAILORING_STALL','QA_REPAIR'])guardBefore(reason);
put('p1aE2EContinuationTick_',e);
const check=fn('p1aE2EContinuationTick_');
const qa=check.indexOf("if(String(a['Status']||'')==='QA'");
const review=check.indexOf("String(a['ATS QA Status']||'')==='Passed'",qa);
if(qa<0||review<0)throw new Error('QA review path missing');
if(check.slice(qa,review).includes(call))throw new Error('E2E-NONRESUME-QUARANTINE-001 failed: quarantine blocks QA review');
const enqueueCount=(check.match(/enqueue_\(id,'RESUME_GENERATE'/g)||[]).length;
const guardCount=(check.match(new RegExp(helper+'\\(id\\)','g'))||[]).length;
if(enqueueCount!==3||guardCount!==3)throw new Error('RENDERER-GUARD-PLACEMENT-001 failed '+JSON.stringify({enqueueCount,guardCount,helper}));
if(s!==before)fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:'RENDERER-GUARD-PLACEMENT-1',helper,resumeGenerateBranches:enqueueCount,guardCalls:guardCount,qaReviewUnblocked:true},null,2));
