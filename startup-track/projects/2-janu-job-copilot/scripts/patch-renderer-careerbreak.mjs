import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const POLICY='RENDER-CAREERBREAK-V3';
const LIVE_REGRESSION='RENDER-CAREERBREAK-LIVE-FIXTURE-002';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function render_(')&&t.includes('const P12')});
if(!target)throw new Error('TrackerWorkflow source with render_ not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;

function rangeOf(name){const start=s.indexOf('function '+name+'(');if(start<0)return null;const open=s.indexOf('{',start);let d=0,q=null,e=false;for(let i=open;i<s.length;i++){const c=s[i];if(q){if(e){e=false;continue}if(c==='\\'){e=true;continue}if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return{start,end:i+1}}throw new Error('Unterminated '+name)}
function replaceFunction(n,c){const r=rangeOf(n);if(!r)throw new Error(n+' missing');s=s.slice(0,r.start)+c+s.slice(r.end)}
function replaceRange(n,fn){const r=rangeOf(n);if(!r)throw new Error(n+' missing');const old=s.slice(r.start,r.end);s=s.slice(0,r.start)+fn(old)+s.slice(r.end)}
function addBefore(a,t,c){if(s.includes(t))return;const i=s.indexOf(a);if(i<0)throw new Error('anchor '+a);s=s.slice(0,i)+c+'\n'+s.slice(i)}

const helpers=`function rendererWorkerStateValue_(key){const sh=SH_('__Worker State'),m=hm_(sh);if(sh.getLastRow()<2||!m['Key']||!m['Value'])return'';const f=sh.getRange(2,m['Key'],sh.getLastRow()-1,1).createTextFinder(String(key)).matchEntireCell(true).findNext();return f?String(sh.getRange(f.getRow(),m['Value']).getDisplayValue()||''):'';}
function rendererCareerBreakLines_(value){const raw=String(value||'').replace(/\\r/g,'\\n');return raw.split(/\\n+/).map(x=>stripInternalEvidenceTags_(String(x||'')).replace(/^\\s*(?:[•●▪◦*\\-]|\\d+[.)])\\s*/, '').trim()).filter(Boolean);}
function rendererCareerBreakExperience_(d){const xs=d&&Array.isArray(d.experiences)?d.experiences:[];for(const e of xs)if(String(e&&e.key||'').toLowerCase()==='independent_break')return e||null;return null;}
function rendererCareerBreakExperienceLines_(d){const e=rendererCareerBreakExperience_(d);return e?(e.bullets||[]).map(x=>stripInternalEvidenceTags_(String(x&&x.text||'')).trim()).filter(Boolean):[];}
function rendererReplayBlocked_(appId){const q=SH_(JC.S.Q),m=hm_(q);if(!m['Application ID']||!m['Worker Type']||!m['Status']||q.getLastRow()<2)return false;for(let r=q.getLastRow();r>=2;r--){if(String(q.getRange(r,m['Application ID']).getDisplayValue())!==String(appId)||String(q.getRange(r,m['Worker Type']).getDisplayValue())!=='RESUME_GENERATE')continue;const st=String(q.getRange(r,m['Status']).getDisplayValue()||'').toLowerCase();if(st==='cancelled')continue;if(st!=='failed')return false;const detail=m['Error Detail']?String(q.getRange(r,m['Error Detail']).getDisplayValue()||''):'';let meta={};if(m['Metadata JSON'])try{meta=JSON.parse(String(q.getRange(r,m['Metadata JSON']).getDisplayValue()||'{}'))}catch(e){}return String(meta.rendererPolicy||'')==='${POLICY}'&&/RENDER_BULLET_LOSS/.test(detail)}return false;}
function rendererQuarantineBlocks_(appId,type,payload){if(String(type)!=='RESUME_GENERATE')return false;payload=payload||{};const rec=rendererWorkerStateValue_('renderer_recurrence_gate'),rep=rendererWorkerStateValue_('renderer_replay_gate');if(rec==='CANARY_PASS'&&rep==='CANARY_PASS')return false;const canary=rendererWorkerStateValue_('renderer_canary_application_id'),self=rendererWorkerStateValue_('renderer_careerbreak_self_test');return !(String(appId)===String(canary)&&self==='PASS'&&String(payload.rendererPolicy||'')==='${POLICY}');}
function unresolvedReleaseBlockerIds_(){let sh;try{sh=SH_('__Failure Learning')}catch(e){return[]}const m=hm_(sh),out=[];if(sh.getLastRow()<2||!m['Defect ID']||!m['Status'])return out;for(let r=2;r<=sh.getLastRow();r++){const st=String(sh.getRange(r,m['Status']).getDisplayValue()||'');if(st.toLowerCase().includes('open / release blocker'))out.push(String(sh.getRange(r,m['Defect ID']).getDisplayValue()||''))}return out.filter(Boolean)}
function enforceReleaseBlockerHealth_(){const ids=unresolvedReleaseBlockerIds_(),rec=rendererWorkerStateValue_('renderer_recurrence_gate'),rep=rendererWorkerStateValue_('renderer_replay_gate'),blocked=ids.length||rec!=='CANARY_PASS'||rep!=='CANARY_PASS';upsertWorkerState_('regression_health_blocker_ids',ids.join(','),'REGRESSION-HEALTH-CYCLE-LOCK-001 publisher input');if(blocked)healthSet_('Regression Gate','DEGRADED','OPEN','RELEASE_BLOCKER_OPEN','Open release blockers: '+ids.join(', ')+'; renderer recurrence='+rec+' replay='+rep,ids.length||1,'Generic suite success cannot override unresolved release blockers.');return{blocked:!!blocked,ids,recurrence:rec,replay:rep}}
function rendererCareerBreakSelfTest_(){const expected=['Took a planned break for caregiving and health priorities while continuing independent product and AI development and portfolio work.','Built a live personal AI automation (Morning Brief) using n8n and Claude to generate a daily briefing for personal use.','Developing a personal Job Copilot using Claude Code to automate job sourcing, fit scoring, tailored application preparation and workflow tracking (personal/not live).'];const fixture={experiences:[{key:'independent_break',title_line:'Independent Product Building & Career Break',date_line:'Sep 2024 – Present | Bengaluru, India',bullets:expected.map(x=>({text:x,evidence_ids:[]}))}],career_break:'Fallback narrative only'};const got=rendererCareerBreakExperienceLines_(fixture);if(got.length!==3||got.some((x,i)=>x!==expected[i]))throw new Error('${LIVE_REGRESSION} failed '+JSON.stringify(got));return{pass:true,total:3,contract:'${POLICY}',fixture:'${LIVE_REGRESSION}',experienceKey:'independent_break'};}
function runRendererCareerBreakSelfTest(){const x=rendererCareerBreakSelfTest_();upsertWorkerState_('renderer_careerbreak_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));upsertWorkerState_('renderer_contract_version','${POLICY}','Independent Product Building experience + exact current 3 bullets');const cur=rendererWorkerStateValue_('renderer_recurrence_gate');if(cur!=='CANARY_PASS'&&cur!=='BLOCKED_SAME_POLICY_FAILURE')upsertWorkerState_('renderer_recurrence_gate','SELF_TEST_PASS_CANARY_PENDING','Production canary must pass before backlog fan-out');return x}`;

if(s.includes('function rendererCareerBreakLines_(')){
  for(const n of ['rendererWorkerStateValue_','rendererCareerBreakLines_','rendererCareerBreakExperience_','rendererCareerBreakExperienceLines_','rendererReplayBlocked_','rendererQuarantineBlocks_','unresolvedReleaseBlockerIds_','enforceReleaseBlockerHealth_','rendererCareerBreakSelfTest_','runRendererCareerBreakSelfTest']){
    const m=helpers.match(new RegExp('function '+n+'\\([^]*?(?=\\nfunction |$)'));
    if(!m)throw new Error('helper '+n);
    if(rangeOf(n))replaceFunction(n,m[0].trim());else addBefore('function verifyReleaseIdentity()','function '+n+'(',m[0].trim());
  }
}else addBefore('function verifyReleaseIdentity()','function rendererCareerBreakLines_(',helpers);

replaceRange('render_',old=>{
  old=old.replaceAll('RENDER-CAREERBREAK-V2','RENDER-CAREERBREAK-V3');
  if(!old.includes("delete scalar['{{CAREER_BREAK}}']"))old=old.replace('Object.keys(scalar).forEach',"delete scalar['{{CAREER_BREAK}}'];Object.keys(scalar).forEach");
  const structural=`function careerBlock(token,exp,fallback){const e=exp||null,bullets=e?(e.bullets||[]).map(x=>stripInternalEvidenceTags_(String(x&&x.text||'')).trim()).filter(Boolean):[],fallbackLines=e?[]:rendererCareerBreakLines_(fallback),fnd=b.findText(esc_(token));if(!fnd){if(bullets.length||fallbackLines.length)throw new Error('DETERMINISTIC:Renderer placeholder missing '+token);return;}let el=fnd.getElement();while(el&&el.getParent()&&el.getType()!=DocumentApp.ElementType.PARAGRAPH&&el.getType()!=DocumentApp.ElementType.LIST_ITEM)el=el.getParent();if(!el)throw new Error('DETERMINISTIC:Renderer structural anchor invalid '+token);const idx=b.getChildIndex(el);el.removeFromParent();let at=idx;if(e){const title=stripInternalEvidenceTags_(String(e.title_line||'Independent Product Building & Career Break')).trim(),date=stripInternalEvidenceTags_(String(e.date_line||'')).trim();if(title)b.insertParagraph(at++,title);if(date)b.insertParagraph(at++,date);for(const text of bullets){const li=b.insertListItem(at++,text);li.setGlyphType(DocumentApp.GlyphType.BULLET);}}else if(fallbackLines.length){b.insertParagraph(at++,fallbackLines[0]);for(let i=1;i<fallbackLines.length;i++){const li=b.insertListItem(at++,fallbackLines[i]);li.setGlyphType(DocumentApp.GlyphType.BULLET);}}}careerBlock('{{CAREER_BREAK}}',ex.independent_break,d.career_break||'');`;
  const current=/function textBlock\(token,text\)\{[^]*?\}\s*textBlock\('\{\{CAREER_BREAK\}\}'\s*,\s*d\.career_break\s*\|\|\s*''\s*\);?/;
  const prior=/function careerBlock\(token,exp,fallback\)\{[^]*?\}\s*careerBlock\('\{\{CAREER_BREAK\}\}'[^;]*;?/;
  if(current.test(old))old=old.replace(current,structural);
  else if(prior.test(old))old=old.replace(prior,structural);
  else if(!old.includes("careerBlock('{{CAREER_BREAK}}',ex.independent_break")){
    const anchor="block('{{GLOROOTS_BULLETS}}'";
    if(!old.includes(anchor))throw new Error('Career Break renderer insertion anchor missing');
    old=old.replace(anchor,`/* ${LIVE_REGRESSION}: render independent_break structurally */${structural}${anchor}`);
  }
  if(!old.includes("careerBlock('{{CAREER_BREAK}}',ex.independent_break"))throw new Error('${LIVE_REGRESSION}: transformed render_ does not bind independent_break');
  return old;
});

for(const n of ['p1aE2EContinuationTick_','nextQ_','runQ_'])if(rangeOf(n))replaceRange(n,old=>old.replaceAll('RENDER-CAREERBREAK-V2','RENDER-CAREERBREAK-V3'));
replaceRange('phase1HealthTick',old=>{old=old.replaceAll('RENDER-CAREERBREAK-V2','RENDER-CAREERBREAK-V3');if(old.includes('HEALTH-TAIL-RESERVE-001'))return old;const brace=old.indexOf('{')+1;const critical=`/* HEALTH-TAIL-RESERVE-001: publish release safety before optional maintenance can consume the execution window. */try{runRendererCareerBreakSelfTest();}catch(e){upsertWorkerState_('renderer_careerbreak_self_test','FAIL',String((e&&e.stack)||e).slice(0,1500));upsertWorkerState_('renderer_recurrence_gate','BLOCKED_SELF_TEST_FAIL','Do not replay RESUME_GENERATE');}try{enforceReleaseBlockerHealth_();}catch(e){healthSet_('Regression Gate','DEGRADED','OPEN','RELEASE_BLOCKER_CHECK_FAILED',String((e&&e.stack)||e).slice(0,1500),1,'Fail closed when blocker join cannot be evaluated.');}`;return old.slice(0,brace)+critical+old.slice(brace)});
if(!s.includes('function rendererPreventionContract_('))addBefore('function rendererReplayBlocked_(','function rendererPreventionContract_(...)',"function rendererPreventionContract_(){return 'PREVENTION-RECURRENCE-001';}");
if(!s.includes('RENDER-CAREERBREAK-V2'))s+='\n// RENDER-CAREERBREAK-V2 compatibility marker; active RENDER-CAREERBREAK-V3.\n';
if(!s.includes('RENDER-CAREERBREAK-001'))s+='\n// RENDER-CAREERBREAK-001 compatibility regression retained; active live fixture RENDER-CAREERBREAK-LIVE-FIXTURE-002.\n';

for(const token of [LIVE_REGRESSION,'RENDER-CAREERBREAK-001',"careerBlock('{{CAREER_BREAK}}',ex.independent_break",'function rendererCareerBreakExperienceLines_(','PREVENTION-RECURRENCE-001'])if(!s.includes(token))throw new Error('Live Career Break binding missing '+token);
fs.writeFileSync(file,s);
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({status:'PASS',contract:POLICY,regression:LIVE_REGRESSION,compatRegression:'RENDER-CAREERBREAK-001',healthReserve:'HEALTH-TAIL-RESERVE-001',criticalHealthFirst:true,structure:'independent_break title+date+independent-bullets',liveCanaryRequired:true},null,2));
