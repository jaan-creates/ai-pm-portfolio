import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const POLICY='RENDER-CAREERBREAK-V2';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function render_(')&&t.includes('const P12');});
if(!target)throw new Error('TrackerWorkflow source with render_ not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;

function rangeOf(name){
  const sig='function '+name+'(';const start=s.indexOf(sig);if(start<0)return null;
  const open=s.indexOf('{',start);if(open<0)throw new Error('Malformed '+name);
  let depth=0,quote=null,esc=false,line=false,block=false;
  for(let i=open;i<s.length;i++){
    const c=s[i],n=s[i+1]||'';
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(quote){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===quote)quote=null;continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}
    if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='{')depth++;else if(c==='}'&&--depth===0)return{start,end:i+1};
  }
  throw new Error('Unterminated '+name);
}
function addBefore(anchor,token,code){if(s.includes(token))return;const i=s.indexOf(anchor);if(i<0)throw new Error('anchor missing '+anchor);s=s.slice(0,i)+code+'\n'+s.slice(i);}
function replaceRange(name,fn){const r=rangeOf(name);if(!r)throw new Error(name+' missing');const old=s.slice(r.start,r.end),neu=fn(old);if(neu===old)throw new Error(name+' patch made no change');s=s.slice(0,r.start)+neu+s.slice(r.end);}
function appendTo(name,marker,code){if(s.includes(marker))return;const r=rangeOf(name);if(!r)throw new Error(name+' missing');s=s.slice(0,r.end-1)+code+s.slice(r.end-1);}

addBefore('function verifyReleaseIdentity()','function rendererCareerBreakLines_(',`function rendererWorkerStateValue_(key){const sh=SH_('__Worker State'),m=hm_(sh);if(sh.getLastRow()<2||!m['Key']||!m['Value'])return'';const f=sh.getRange(2,m['Key'],sh.getLastRow()-1,1).createTextFinder(String(key)).matchEntireCell(true).findNext();return f?String(sh.getRange(f.getRow(),m['Value']).getDisplayValue()||''):'';}
function rendererCareerBreakLines_(value){const raw=stripInternalEvidenceTags_(String(value||'')).replace(/\\r/g,'\\n');return raw.split(/\\n+/).map(x=>String(x||'').replace(/^\\s*(?:[•●▪◦*\\-]|\\d+[.)])\\s*/, '').trim()).filter(Boolean);}
function rendererReplayBlocked_(appId){const q=SH_(JC.S.Q),m=hm_(q);if(!m['Application ID']||!m['Worker Type']||!m['Status']||q.getLastRow()<2)return false;for(let r=q.getLastRow();r>=2;r--){if(String(q.getRange(r,m['Application ID']).getDisplayValue())!==String(appId))continue;if(String(q.getRange(r,m['Worker Type']).getDisplayValue())!=='RESUME_GENERATE')continue;const st=String(q.getRange(r,m['Status']).getDisplayValue()||'').toLowerCase();if(st==='cancelled')continue;if(st!=='failed')return false;const detail=m['Error Detail']?String(q.getRange(r,m['Error Detail']).getDisplayValue()||''):'';let meta={};if(m['Metadata JSON']){try{meta=JSON.parse(String(q.getRange(r,m['Metadata JSON']).getDisplayValue()||'{}'));}catch(e){meta={};}}return String(meta.rendererPolicy||'')==='${POLICY}'&&/RENDER_BULLET_LOSS/.test(detail);}return false;}
function rendererQuarantineBlocks_(appId,type,payload){if(String(type)!=='RESUME_GENERATE')return false;payload=payload||{};const recurrence=rendererWorkerStateValue_('renderer_recurrence_gate'),replay=rendererWorkerStateValue_('renderer_replay_gate');if(recurrence==='CANARY_PASS'&&replay==='CANARY_PASS')return false;const canary=rendererWorkerStateValue_('renderer_canary_application_id'),self=rendererWorkerStateValue_('renderer_careerbreak_self_test');return !(String(appId)===String(canary)&&self==='PASS'&&String(payload.rendererPolicy||'')==='${POLICY}');}
function unresolvedReleaseBlockerIds_(){let sh;try{sh=SH_('__Failure Learning');}catch(e){return[];}const m=hm_(sh),out=[];if(sh.getLastRow()<2||!m['Defect ID']||!m['Status'])return out;for(let r=2;r<=sh.getLastRow();r++){const st=String(sh.getRange(r,m['Status']).getDisplayValue()||'');if(st.toLowerCase().includes('open / release blocker'))out.push(String(sh.getRange(r,m['Defect ID']).getDisplayValue()||''));}return out.filter(Boolean);}
function enforceReleaseBlockerHealth_(){const ids=unresolvedReleaseBlockerIds_(),rec=rendererWorkerStateValue_('renderer_recurrence_gate'),rep=rendererWorkerStateValue_('renderer_replay_gate'),blocked=ids.length||rec!=='CANARY_PASS'||rep!=='CANARY_PASS';upsertWorkerState_('regression_health_blocker_ids',ids.join(','),'REGRESSION-HEALTH-CYCLE-LOCK-001 publisher input');if(blocked)healthSet_('Regression Gate','DEGRADED','OPEN','RELEASE_BLOCKER_OPEN','Open release blockers: '+ids.join(', ')+'; renderer recurrence='+rec+' replay='+rep,ids.length||1,'Generic suite success cannot override unresolved release blockers.');return{blocked:!!blocked,ids:ids,recurrence:rec,replay:rep};}
function rendererCareerBreakSelfTest_(){const fixture='Took a planned break for caregiving and health priorities while continuing independent product and AI exploration and portfolio development.\\n• Built a personal AI automation (Morning Brief) using n8n and Claude to generate a daily briefing for personal productivity.\\n• Developing a personal Job Copilot (not live) using Claude Code to automate job sourcing, JD fit scoring, tailored application preparation and workflow tracking.';const got=rendererCareerBreakLines_(fixture);if(got.length!==3||got[0].indexOf('Took a planned break')!==0||got[1].indexOf('Built a personal AI automation')!==0||got[2].indexOf('Developing a personal Job Copilot')!==0)throw new Error('RENDER-CAREERBREAK-001 failed '+JSON.stringify(got));return{pass:true,total:3,contract:'${POLICY}',fixture:'RENDER-CAREERBREAK-001'};}
function runRendererCareerBreakSelfTest(){const x=rendererCareerBreakSelfTest_();upsertWorkerState_('renderer_careerbreak_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));upsertWorkerState_('renderer_contract_version','${POLICY}','Structural Career Break rendering + claim-time quarantine + same-policy deterministic replay prevention');const cur=rendererWorkerStateValue_('renderer_recurrence_gate');if(cur!=='CANARY_PASS'&&cur!=='BLOCKED_SAME_POLICY_FAILURE')upsertWorkerState_('renderer_recurrence_gate','SELF_TEST_PASS_CANARY_PENDING','Production canary must pass before backlog fan-out');return x;}`);

replaceRange('render_',old=>{
  if(old.includes('RENDER-CAREERBREAK-V2 structural block'))return old;
  if(!old.includes("Object.keys(scalar).forEach"))throw new Error('render_ scalar loop anchor missing');
  if(!old.includes("block('{{GLOROOTS_BULLETS}}'"))throw new Error('render_ structural bullet anchor missing');
  old=old.replace("Object.keys(scalar).forEach","delete scalar['{{CAREER_BREAK}}'];Object.keys(scalar).forEach");
  const helper=`function textBlock(token,text){const lines=rendererCareerBreakLines_(text),fnd=b.findText(esc_(token));if(!fnd){if(lines.length)throw new Error('DETERMINISTIC:Renderer placeholder missing '+token);return;}let el=fnd.getElement();while(el&&el.getParent()&&el.getType()!=DocumentApp.ElementType.PARAGRAPH&&el.getType()!=DocumentApp.ElementType.LIST_ITEM)el=el.getParent();if(!el)throw new Error('DETERMINISTIC:Renderer structural anchor invalid '+token);const idx=b.getChildIndex(el);el.removeFromParent();lines.forEach((x,i)=>{const li=b.insertListItem(idx+i,stripInternalEvidenceTags_(x));li.setGlyphType(DocumentApp.GlyphType.BULLET);});}`;
  old=old.replace("block('{{GLOROOTS_BULLETS}}'",`/* RENDER-CAREERBREAK-V2 structural block */${helper}textBlock('{{CAREER_BREAK}}',d.career_break||'');block('{{GLOROOTS_BULLETS}}'`);
  return old;
});

if(rangeOf('p1aE2EContinuationTick_')){
  replaceRange('p1aE2EContinuationTick_',old=>{
    if(!old.includes("source:'p1a-e2e-continuation-v3'"))throw new Error('continuation v3 metadata anchor missing');
    old=old.replace(/\{source:'p1a-e2e-continuation-v3',reason:'([^']+)'\}/g,"{source:'p1a-e2e-continuation-v3',reason:'$1',rendererPolicy:'"+POLICY+"'}");
    old=old.replace("{source:'p1a-e2e-continuation-v3'}","{source:'p1a-e2e-continuation-v3',rendererPolicy:'"+POLICY+"'}");
    const anchor="if(!id||String(a['Decision']||'')!=='Apply')continue;";
    if(!old.includes(anchor))throw new Error('continuation app-loop anchor missing');
    old=old.replace(anchor,anchor+"if(rendererQuarantineBlocks_(id,'RESUME_GENERATE',{rendererPolicy:'"+POLICY+"'}))continue;if(rendererReplayBlocked_(id)){upsertWorkerState_('renderer_recurrence_gate','BLOCKED_SAME_POLICY_FAILURE',id+' failed RENDER_BULLET_LOSS under "+POLICY+"; deploy a newer renderer policy before replay');continue;}");
    return old;
  });
}

if(rangeOf('nextQ_'))replaceRange('nextQ_',old=>{if(old.includes('rendererQuarantineBlocks_'))return old;const anchor="if(v[i][3]==='queued'";if(!old.includes(anchor))throw new Error('nextQ_ queued anchor missing');return old.replace(anchor,"let qp={};try{qp=v[i][13]?JSON.parse(String(v[i][13])):{}}catch(e){qp={};}if(rendererQuarantineBlocks_(app,String(v[i][2]||''),qp))continue;"+anchor);});
if(rangeOf('runQ_'))replaceRange('runQ_',old=>{if(old.includes('RENDERER_QUARANTINE_ACTIVE'))return old;const anchor="s.getRange(r,4).setValue('running')";if(!old.includes(anchor))throw new Error('runQ_ claim anchor missing');return old.replace(anchor,"if(rendererQuarantineBlocks_(app,type,payload)){s.getRange(r,4).setValue('cancelled');s.getRange(r,11).setValue(now_());s.getRange(r,12).setValue('RENDERER_QUARANTINE_ACTIVE');s.getRange(r,13).setValue('RESUME_GENERATE blocked until exact renderer regression + provenance + authorized canary PASS');s.getRange(r,16).setValue(now_());upsertWorkerState_('renderer_last_blocked_claim',qid,app+' blocked by RENDER-QUARANTINE-001');return;}"+anchor);});

appendTo('phase1HealthTick','runRendererCareerBreakSelfTest();',`try{runRendererCareerBreakSelfTest();}catch(e){upsertWorkerState_('renderer_careerbreak_self_test','FAIL',String((e&&e.stack)||e).slice(0,1500));upsertWorkerState_('renderer_recurrence_gate','BLOCKED_SELF_TEST_FAIL','Do not replay RESUME_GENERATE');}try{enforceReleaseBlockerHealth_();}catch(e){healthSet_('Regression Gate','DEGRADED','OPEN','RELEASE_BLOCKER_CHECK_FAILED',String((e&&e.stack)||e).slice(0,1500),1,'Fail closed when blocker join cannot be evaluated.');}`);

for(const token of ['function rendererCareerBreakLines_(','function rendererReplayBlocked_(','function rendererQuarantineBlocks_(','function enforceReleaseBlockerHealth_(','function runRendererCareerBreakSelfTest()','RENDER-CAREERBREAK-001',POLICY,"delete scalar['{{CAREER_BREAK}}']","textBlock('{{CAREER_BREAK}}'",'rendererPolicy','RENDERER_QUARANTINE_ACTIVE','REGRESSION-HEALTH-CYCLE-LOCK-001',"includes('open / release blocker')"])if(!s.includes(token))throw new Error('renderer recurrence prevention missing '+token);
fs.writeFileSync(file,s);
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error('renderer transformed source invalid: '+syntax.stderr);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:POLICY,regression:'RENDER-CAREERBREAK-001',replayGuard:'PREVENTION-RECURRENCE-001',quarantine:'RENDER-QUARANTINE-001',healthPrecedence:'REGRESSION-HEALTH-CYCLE-LOCK-001',literalStatusMatch:'escape-safe-string-includes',liveCanaryRequired:true,verifiedArtifact:file},null,2));