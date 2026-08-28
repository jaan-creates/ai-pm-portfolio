import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='CANARY-PRECONDITION-002';
const COMPAT='CANARY-PRECONDITION-001';
const EVIDENCE='CANONICAL-EVIDENCE-DRIVE-EXPORT-001';
const POLICY='RENDER-CAREERBREAK-V3';
const HEALTH_MAX_MS=180000;
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function rendererQuarantineBlocks_(')&&t.includes('const P12');});
if(!target)throw new Error('Renderer quarantine source not found');
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
function replaceFunction(name,code){const r=rangeOf(name);if(!r)throw new Error(name+' missing');s=s.slice(0,r.start)+code+s.slice(r.end);}
function putFunction(name,code,anchor){const r=rangeOf(name);if(r){replaceFunction(name,code);return;}const i=s.indexOf(anchor);if(i<0)throw new Error('Anchor missing '+anchor);s=s.slice(0,i)+code+'\n'+s.slice(i);}

const evidenceFn=`function canonicalEvidenceText_(id){id=String(id||'').trim();if(!id)return'';const url='https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'/export?mimeType=text%2Fplain';const res=UrlFetchApp.fetch(url,{method:'get',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true});const code=Number(res.getResponseCode());if(code<200||code>=300)throw new Error('DETERMINISTIC:CANONICAL_EVIDENCE_EXPORT_HTTP_'+code);return String(res.getContentText()||'');}`;
const docFn=`function docText_(id){return canonicalEvidenceText_(id);}`;
const healthFn=`function rendererHealthSnapshot_(component){const sh=SH_('__System Health'),m=hm_(sh);if(sh.getLastRow()<2||!m['Component'])return{status:'',circuit:'',errorCode:''};const f=sh.getRange(2,m['Component'],sh.getLastRow()-1,1).createTextFinder(String(component)).matchEntireCell(true).findNext();if(!f)return{status:'',circuit:'',errorCode:''};const r=f.getRow();return{status:m['Status']?String(sh.getRange(r,m['Status']).getDisplayValue()||''):'',circuit:m['Circuit State']?String(sh.getRange(r,m['Circuit State']).getDisplayValue()||''):'',errorCode:m['Error Code']?String(sh.getRange(r,m['Error Code']).getDisplayValue()||''):''};}`;
const notesFn=`function rendererWorkerStateNotes_(key){let sh;try{sh=SH_('__Worker State')}catch(e){return''}const m=hm_(sh);if(sh.getLastRow()<2||!m['Key']||!m['Notes'])return'';const f=sh.getRange(2,m['Key'],sh.getLastRow()-1,1).createTextFinder(String(key)).matchEntireCell(true).findNext();return f?String(sh.getRange(f.getRow(),m['Notes']).getDisplayValue()||''):'';}`;
const preRenderFn=`function rendererGoldenTracePreRendererReady_(){const appId=rendererWorkerStateValue_('golden_trace_application_id');if(!appId)return false;let sh;try{sh=SH_('__Processing Queue')}catch(e){return false}const m=hm_(sh);if(sh.getLastRow()<2||!m['Application ID']||!m['Worker Type']||!m['Status'])return false;const seen={};for(let r=2;r<=sh.getLastRow();r++){if(String(sh.getRange(r,m['Application ID']).getDisplayValue()||'')!==String(appId))continue;if(String(sh.getRange(r,m['Status']).getDisplayValue()||'').toLowerCase()!=='succeeded')continue;seen[String(sh.getRange(r,m['Worker Type']).getDisplayValue()||'')]=true;}const durable=/ATOMIC_APPEND_VERIFY_RETIRE/.test(rendererWorkerStateNotes_('golden_trace_last_refresh'));return !!(seen.JD_RETRIEVE&&seen.JD_PARSE_SCORE_MAP&&durable&&rendererWorkerStateValue_('deployment_git_commit')&&rendererWorkerStateValue_('deployment_source_sha256'));}`;
const decisionFn=`function rendererCanaryStateDecision_(x){x=x||{};const p=x.payload||{},pre=p.preconditions||{};return !!(x.configuredCanary&&p.canary===true&&String(p.rendererPolicy||'')==='${POLICY}'&&x.selfTest==='PASS'&&x.recurrence==='SELF_TEST_PASS_CANARY_PENDING'&&String(pre.runtime||'')==='FL-080-CLOSED'&&String(pre.trace||'')==='FL-059-CLOSED'&&x.runtimeStatus==='HEALTHY'&&x.runtimeCircuit==='CLOSED'&&x.regressionErrorCode!=='WORKER_RUNTIME_OPEN'&&x.regressionErrorCode!=='HEALTH_STATE_INCONSISTENT'&&Number(x.healthElapsedMs)>0&&Number(x.healthElapsedMs)<=${HEALTH_MAX_MS}&&x.traceSelfTest==='PASS'&&x.goldenTracePreRendererReady===true);}`;
const preFn=`function rendererCanaryPreconditionsMet_(appId,payload){const canary=rendererWorkerStateValue_('renderer_canary_application_id'),rt=rendererHealthSnapshot_('Worker Runtime'),rg=rendererHealthSnapshot_('Regression Gate');return rendererCanaryStateDecision_({configuredCanary:String(appId)===String(canary)&&!!canary,payload:payload||{},selfTest:rendererWorkerStateValue_('renderer_careerbreak_self_test'),recurrence:rendererWorkerStateValue_('renderer_recurrence_gate'),runtimeStatus:rt.status,runtimeCircuit:rt.circuit,regressionErrorCode:rg.errorCode,healthElapsedMs:Number(rendererWorkerStateValue_('health_tick_elapsed_ms')||0),traceSelfTest:rendererWorkerStateValue_('trace_golden_self_test'),goldenTracePreRendererReady:rendererGoldenTracePreRendererReady_()});}`;
const contractFn=`function rendererCanaryPreconditionContract_(){return{pass:true,contract:'${CONTRACT}',compat:'${COMPAT}',canonicalEvidence:'${EVIDENCE}',policy:'${POLICY}',healthMaxMs:${HEALTH_MAX_MS},requiresExplicitCanary:true,requiresRuntimeMargin:true,requiresTracePreRendererProof:true,requiresAtomicTraceReadback:true,requiresHealthConsistency:true,fullGoldenTracePassRequiredBeforeCanary:false};}`;
const guardFn=`function rendererQuarantineBlocks_(appId,type,payload){if(String(type)!=='RESUME_GENERATE')return false;payload=payload||{};const rec=rendererWorkerStateValue_('renderer_recurrence_gate'),rep=rendererWorkerStateValue_('renderer_replay_gate');if(rec==='CANARY_PASS'&&rep==='CANARY_PASS')return false;return !rendererCanaryPreconditionsMet_(appId,payload);}`;

putFunction('canonicalEvidenceText_',evidenceFn,'function rendererQuarantineBlocks_(');
if(rangeOf('docText_'))replaceFunction('docText_',docFn);
putFunction('rendererHealthSnapshot_',healthFn,'function rendererQuarantineBlocks_(');
putFunction('rendererWorkerStateNotes_',notesFn,'function rendererQuarantineBlocks_(');
putFunction('rendererGoldenTracePreRendererReady_',preRenderFn,'function rendererQuarantineBlocks_(');
putFunction('rendererCanaryStateDecision_',decisionFn,'function rendererQuarantineBlocks_(');
putFunction('rendererCanaryPreconditionsMet_',preFn,'function rendererQuarantineBlocks_(');
putFunction('rendererCanaryPreconditionContract_',contractFn,'function rendererQuarantineBlocks_(');
replaceFunction('rendererQuarantineBlocks_',guardFn);

for(const token of [CONTRACT,COMPAT,EVIDENCE,POLICY,'rendererCanaryPreconditionsMet_','rendererGoldenTracePreRendererReady_','ATOMIC_APPEND_VERIFY_RETIRE','FL-080-CLOSED','FL-059-CLOSED',String(HEALTH_MAX_MS),'HEALTH_STATE_INCONSISTENT'])if(!s.includes(token))throw new Error('Canary precondition marker missing '+token);
if(rangeOf('docText_')){const d=rangeOf('docText_'),body=s.slice(d.start,d.end);if(body.includes('DocumentApp'))throw new Error('DocumentApp dependency survived canonical evidence patch');if(!body.includes('canonicalEvidenceText_'))throw new Error('docText_ does not use canonical evidence Drive export');}
const q=rangeOf('rendererQuarantineBlocks_'),body=s.slice(q.start,q.end);if(!body.includes('rendererCanaryPreconditionsMet_'))throw new Error('Claim/enqueue quarantine does not consume canary preconditions');
fs.writeFileSync(file,s);
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error('Canary-precondition transformed source invalid: '+syntax.stderr);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:CONTRACT,compat:COMPAT,canonicalEvidence:EVIDENCE,policy:POLICY,healthMaxMs:HEALTH_MAX_MS,explicitCanaryRequired:true,runtimeMarginRequired:true,tracePreRendererProofRequired:true,atomicTraceReadbackRequired:true,healthConsistencyRequired:true,fullGoldenTracePassRequiredBeforeCanary:false,documentAppRemoved:!!rangeOf('docText_'),verifiedArtifact:file},null,2));
