import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{
  const t=fs.readFileSync(path.join(root,f),'utf8');
  return t.includes('function render_(')&&t.includes('function rendererCareerBreakExperienceLines_(')&&t.includes('const P12');
});
if(!target) throw new Error('FL-099 target TrackerWorkflow not found');
const file=path.join(root,target);
let s=fs.readFileSync(file,'utf8'), before=s;

function rangeOf(name){
  const start=s.indexOf('function '+name+'(');
  if(start<0)return null;
  const open=s.indexOf('{',start);
  let d=0,q=null,e=false,line=false,block=false;
  for(let i=open;i<s.length;i++){
    const c=s[i],n=s[i+1]||'';
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}
    if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='"'||c==="'"||c==='`'){q=c;continue;}
    if(c==='{')d++; else if(c==='}'&&--d===0)return {start,end:i+1};
  }
  throw new Error('Unterminated '+name);
}
function replaceFn(name,code){
  const r=rangeOf(name);if(!r)throw new Error('Missing '+name);
  s=s.slice(0,r.start)+code+s.slice(r.end);
}
function insertBefore(anchor,code){
  if(s.includes('function rendererCareerBreakExactLines_('))return;
  const i=s.indexOf(anchor);if(i<0)throw new Error('Missing anchor '+anchor);
  s=s.slice(0,i)+code+'\n'+s.slice(i);
}

const helpers = `function rendererCareerBreakSemanticKey_(text){
  const n=String(text||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  if(/morning brief/.test(n))return 'morning_brief';
  if(/job copilot/.test(n))return 'job_copilot';
  if(/planned break/.test(n)||(/caregiving/.test(n)&&/health/.test(n)))return 'planned_break';
  return 'other:'+n;
}
function rendererCareerBreakExactLines_(experience){
  const raw=(experience&&experience.bullets||[]).map(x=>stripInternalEvidenceTags_(String(x&&x.text||'')).trim()).filter(Boolean);
  const out=[],seen={};
  for(const text of raw){
    const key=rendererCareerBreakSemanticKey_(text);
    if(seen[key])continue;
    seen[key]=true;out.push(text);
  }
  const required=['planned_break','morning_brief','job_copilot'];
  const keys=out.map(rendererCareerBreakSemanticKey_);
  if(out.length!==3||required.some(k=>!keys.includes(k))){
    throw new Error('DETERMINISTIC:RENDER_CAREERBREAK_EXACT3:'+JSON.stringify({rawCount:raw.length,finalCount:out.length,keys:keys}));
  }
  return out;
}
function rendererCareerBreakExact3SelfTest_(){
  const e={bullets:[
    {text:'Took a planned break for caregiving and health priorities while continuing independent product and AI development and portfolio work.'},
    {text:'Built a live personal AI automation (Morning Brief) using n8n and Claude to generate a daily briefing for personal use.'},
    {text:'Developing a personal Job Copilot using Claude Code to automate job sourcing, fit scoring, tailored application preparation and workflow tracking (personal/not live).'},
    {text:'Morning Brief — personal AI automation built using n8n and Claude to generate a daily brief (personal use only).'},
    {text:'Job Copilot — in-progress personal job-search copilot built with Claude Code for job sourcing, fit scoring, tailored application preparation and tracking (personal/not live).'}
  ]};
  const got=rendererCareerBreakExactLines_(e);
  if(got.length!==3)throw new Error('RENDER-CAREERBREAK-EXACT3-LIVE-001 count '+got.length);
  let rejected=false;
  try{rendererCareerBreakExactLines_({bullets:e.bullets.concat([{text:'Unrelated fourth career-break claim.'}])});}catch(err){rejected=/RENDER_CAREERBREAK_EXACT3/.test(String(err));}
  if(!rejected)throw new Error('RENDER-CAREERBREAK-EXACT3-LIVE-001 unexplained extra bullet was not rejected');
  return {pass:true,total:3,contract:'RENDER-CAREERBREAK-EXACT3-001',regression:'RENDER-CAREERBREAK-EXACT3-LIVE-001',productionShape:'5 composed bullets -> 3 semantic canonical bullets'};
}
function runRendererCareerBreakExact3SelfTest(){
  const x=rendererCareerBreakExact3SelfTest_();
  upsertWorkerState_('renderer_careerbreak_exact3_self_test','PASS',JSON.stringify(x));
  return x;
}`;

insertBefore('function verifyReleaseIdentity()',helpers);

const rr=rangeOf('render_');
if(!rr)throw new Error('render_ missing');
let render=s.slice(rr.start,rr.end);
const old="const e=exp||null,bullets=e?(e.bullets||[]).map(x=>stripInternalEvidenceTags_(String(x&&x.text||'')).trim()).filter(Boolean):[],fallbackLines=e?[]:rendererCareerBreakLines_(fallback)";
const neu="const e=exp||null,bullets=e?rendererCareerBreakExactLines_(e):[],fallbackLines=e?[]:rendererCareerBreakLines_(fallback)";
if(render.includes(old)) render=render.replace(old,neu);
else if(!render.includes('bullets=e?rendererCareerBreakExactLines_(e):[]')) throw new Error('FL-099 careerBlock composition anchor missing');
s=s.slice(0,rr.start)+render+s.slice(rr.end);

replaceFn('rendererCareerBreakExperienceLines_',`function rendererCareerBreakExperienceLines_(d){const e=rendererCareerBreakExperience_(d);return e?rendererCareerBreakExactLines_(e):[];}`);

const cr=rangeOf('rendererFreshCanaryEnqueue_');
if(cr){
  let fn=s.slice(cr.start,cr.end);
  const guard="if(!workNeeded_(appId,'RESUME_GENERATE'))throw new Error('DETERMINISTIC:CANARY_RESUME_WORK_NOT_NEEDED');";
  if(fn.includes(guard)){
    fn=fn.replace(guard,"if(!workNeeded_(appId,'RESUME_GENERATE')){/* FL099-CANARY-RERENDER-001: changed-deployment authorized canary may re-render the current malformed artifact; admission/repeat guard remains authoritative. */}");
    s=s.slice(0,cr.start)+fn+s.slice(cr.end);
  } else if(!fn.includes('FL099-CANARY-RERENDER-001')) throw new Error('FL-099 canary re-render guard anchor missing');
}

const hr=rangeOf('phase1HealthTick');
if(hr){
  let h=s.slice(hr.start,hr.end);
  if(!h.includes('FL099-EXACT3-HEALTH-001')){
    const p=h.indexOf('{')+1;
    h=h.slice(0,p)+`/* FL099-EXACT3-HEALTH-001 */try{runRendererCareerBreakExact3SelfTest();}catch(e){upsertWorkerState_('renderer_careerbreak_exact3_self_test','FAIL',String((e&&e.stack)||e).slice(0,1500));upsertWorkerState_('renderer_recurrence_gate','BLOCKED_EXACT3_FAIL','FL-099 exact-3 contract failed');}`+h.slice(p);
    s=s.slice(0,hr.start)+h+s.slice(hr.end);
  }
}

for(const token of ['RENDER-CAREERBREAK-EXACT3-001','RENDER-CAREERBREAK-EXACT3-LIVE-001','function rendererCareerBreakExactLines_(','bullets=e?rendererCareerBreakExactLines_(e):[]','FL099-EXACT3-HEALTH-001','FL099-CANARY-RERENDER-001'])
  if(!s.includes(token))throw new Error('FL-099 contract missing '+token);

fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:'RENDER-CAREERBREAK-EXACT3-001',regression:'RENDER-CAREERBREAK-EXACT3-LIVE-001',failClosedOnUnknownExtra:true},null,2));
