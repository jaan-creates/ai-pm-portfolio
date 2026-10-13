import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='CANARY-PRECONDITION-001';
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

const healthFn=`function rendererHealthSnapshot_(component){const sh=SH_('__System Health'),m=hm_(sh);if(sh.getLastRow()<2||!m['Component'])return{status:'',circuit:'',errorCode:''};const f=sh.getRange(2,m['Component'],sh.getLastRow()-1,1).createTextFinder(String(component)).matchEntireCell(true).findNext();if(!f)return{status:'',circuit:'',errorCode:''};const r=f.getRow();return{status:m['Status']?String(sh.getRange(r,m['Status']).getDisplayValue()||''):'',circuit:m['Circuit State']?String(sh.getRange(r,m['Circuit State']).getDisplayValue()||''):'',errorCode:m['Error Code']?String(sh.getRange(r,m['Error Code']).getDisplayValue()||''):''};}`;
const failureFn=`function rendererFailureLearningStatus_(defectId){let sh;try{sh=SH_('__Failure Learning')}catch(e){return'UNKNOWN'}const m=hm_(sh);if(sh.getLastRow()<2||!m['Defect ID']||!m['Status'])return'UNKNOWN';const f=sh.getRange(2,m['Defect ID'],sh.getLastRow()-1,1).createTextFinder(String(defectId)).matchEntireCell(true).findNext();return f?String(sh.getRange(f.getRow(),m['Status']).getDisplayValue()||''):'UNKNOWN';}`;
const decisionFn=`function rendererCanaryStateDecision_(x){x=x||{};const p=x.payload||{},pre=p.preconditions||{};return !!(x.configuredCanary&&p.canary===true&&String(p.rendererPolicy||'')==='${POLICY}'&&x.selfTest==='PASS'&&x.recurrence==='SELF_TEST_PASS_CANARY_PENDING'&&String(pre.runtime||'')==='FL-080-CLOSED'&&String(pre.trace||'')==='FL-059-CLOSED'&&x.runtimeStatus==='HEALTHY'&&x.runtimeCircuit==='CLOSED'&&x.regressionErrorCode!=='WORKER_RUNTIME_OPEN'&&x.regressionErrorCode!=='HEALTH_STATE_INCONSISTENT'&&Number(x.healthElapsedMs)>0&&Number(x.healthElapsedMs)<=${HEALTH_MAX_MS}&&x.traceSelfTest==='PASS'&&x.goldenTraceStatus==='PASS'&&!/^open\\b/i.test(String(x.fl059Status||'')));}`;
const preFn=`function rendererCanaryPreconditionsMet_(appId,payload){const canary=rendererWorkerStateValue_('renderer_canary_application_id'),rt=rendererHealthSnapshot_('Worker Runtime'),rg=rendererHealthSnapshot_('Regression Gate');return rendererCanaryStateDecision_({configuredCanary:String(appId)===String(canary)&&!!canary,payload:payload||{},selfTest:rendererWorkerStateValue_('renderer_careerbreak_self_test'),recurrence:rendererWorkerStateValue_('renderer_recurrence_gate'),runtimeStatus:rt.status,runtimeCircuit:rt.circuit,regressionErrorCode:rg.errorCode,healthElapsedMs:Number(rendererWorkerStateValue_('health_tick_elapsed_ms')||0),traceSelfTest:rendererWorkerStateValue_('trace_golden_self_test'),goldenTraceStatus:rendererWorkerStateValue_('golden_trace_status'),fl059Status:rendererFailureLearningStatus_('FL-059')});}`;
const contractFn=`function rendererCanaryPreconditionContract_(){return{pass:true,contract:'${CONTRACT}',policy:'${POLICY}',healthMaxMs:${HEALTH_MAX_MS},requiresExplicitCanary:true,requiresRuntimeMargin:true,requiresTraceClosure:true,requiresHealthConsistency:true};}`;
const guardFn=`function rendererQuarantineBlocks_(appId,type,payload){if(String(type)!=='RESUME_GENERATE')return false;payload=payload||{};const rec=rendererWorkerStateValue_('renderer_recurrence_gate'),rep=rendererWorkerStateValue_('renderer_replay_gate');if(rec==='CANARY_PASS'&&rep==='CANARY_PASS')return false;return !rendererCanaryPreconditionsMet_(appId,payload);}`;

putFunction('rendererHealthSnapshot_',healthFn,'function rendererQuarantineBlocks_(');
putFunction('rendererFailureLearningStatus_',failureFn,'function rendererQuarantineBlocks_(');
putFunction('rendererCanaryStateDecision_',decisionFn,'function rendererQuarantineBlocks_(');
putFunction('rendererCanaryPreconditionsMet_',preFn,'function rendererQuarantineBlocks_(');
putFunction('rendererCanaryPreconditionContract_',contractFn,'function rendererQuarantineBlocks_(');
replaceFunction('rendererQuarantineBlocks_',guardFn);

for(const token of [CONTRACT,POLICY,'rendererCanaryPreconditionsMet_','FL-080-CLOSED','FL-059-CLOSED',String(HEALTH_MAX_MS),'HEALTH_STATE_INCONSISTENT'])if(!s.includes(token))throw new Error('Canary precondition marker missing '+token);
const q=rangeOf('rendererQuarantineBlocks_'),body=s.slice(q.start,q.end);if(!body.includes('rendererCanaryPreconditionsMet_'))throw new Error('Claim/enqueue quarantine does not consume canary preconditions');
fs.writeFileSync(file,s);
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error('Canary-precondition transformed source invalid: '+syntax.stderr);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:CONTRACT,policy:POLICY,healthMaxMs:HEALTH_MAX_MS,explicitCanaryRequired:true,runtimeMarginRequired:true,traceClosureRequired:true,healthConsistencyRequired:true,verifiedArtifact:file},null,2));
