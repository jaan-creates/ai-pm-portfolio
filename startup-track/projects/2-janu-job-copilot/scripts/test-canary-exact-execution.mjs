import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const project=process.argv[2]||path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const patch=path.join(project,'scripts','patch-canary-exact-execution.mjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-canary-exact-'));
const file=path.join(dir,'TrackerWorkflow.js');
fs.writeFileSync(file,`
const P12={VERSION:'1.3.8'}; const JC={S:{Q:'Q',A:'A'}};
function circuitOpen_(){return false;} function nextQ_(){return 2;}
function rendererCanaryStateDecision_(x){x=x||{};const p=x.payload||{},pre=p.preconditions||{};return !!(x.configuredCanary&&p.canary===true&&String(p.rendererPolicy||'')==='RENDER-CAREERBREAK-V3'&&String(pre.runtime||'')==='FL-080-CLOSED'&&String(pre.trace||'')==='FL-059-CLOSED');}
function rendererCanaryPreconditionsMet_(appId,payload){return rendererCanaryStateDecision_({configuredCanary:String(appId)==='2026-08-04-002',payload:payload});}
function rendererWorkerStateValue_(){return '2026-08-04-002';}
function SH_(){} function hm_(){} function find_(){} function obj_(){} function workNeeded_(){return true;} function hash_(){return 'h';} function enqueue_(){return 'Q-CANARY';} function upsertWorkerState_(){} function LockService(){}
function runQ_(r){const qid='Q-CANARY',started=new Date();if(false){return 0;}if(false){return;}try{closeCircuit_('Worker Runtime','Job '+qid+' completed in '+(now_()-started)+'ms');}catch(e){throw e;}finally{}}
function processQ_(){if(circuitOpen_('Worker Runtime'))return 0;const r=nextQ_(null);if(!r)return 0;runQ_(r);return 1;}
function closeCircuit_(){} function now_(){return new Date();}
// Simulated previously deployed FL-084 helper generation: exact-ID mechanics exist,
// but the later FL-086 safety-payload contract does not.
function rendererCanaryQueueReadback_(qid){return{found:true,queueJobId:qid,applicationId:'2026-08-04-002',workerType:'RESUME_GENERATE',status:'queued',attempts:0,errorCode:'',canary:true,rendererPolicy:'RENDER-CAREERBREAK-V3',resumeVersionId:'',tailoredResumeLink:''};}
function rendererFreshCanaryEnqueue_(){const payload={canary:true,rendererPolicy:'RENDER-CAREERBREAK-V3',source:'FL-060-live-canary-v2',contract:'CANARY-QUEUE-ID-BINDING-001'};return{queueJobId:'Q-CANARY',payload};}
function rendererExactCanaryExecute_(qid){return{pass:true,queueJobId:qid,contract:'CANARY-EXACT-EXECUTION-001'};}
function runRendererAuthorizedCanary(){return rendererExactCanaryExecute_(rendererFreshCanaryEnqueue_().queueJobId);}
function runRendererCanaryReadback(qid){return rendererCanaryQueueReadback_(qid);}
// CANARY-QUEUE-ID-BINDING-001 / CANARY-TERMINAL-SUCCESS-001 / CANARY-ARTIFACT-READBACK-001 / CANARY-EXACT-EXECUTION-001
function verifyReleaseIdentity(){}
`);
function run(){const r=spawnSync(process.execPath,[patch,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);return r.stdout;}
const before=fs.readFileSync(file,'utf8');
if(!before.includes('CANARY-EXACT-EXECUTION-001')||before.includes('CANARY-PAYLOAD-CONTRACT-001'))throw new Error('N-1 fixture invalid');
const first=run(),after1=fs.readFileSync(file,'utf8'),second=run(),after2=fs.readFileSync(file,'utf8');
if(after1!==after2)throw new Error('Patch is not idempotent after N-1 upgrade');
for(const token of ['return Number(runQ_(r)||0)','return 1;/* QUEUE-RUNQ-SUCCESS-001 */','CANARY-QUEUE-ID-BINDING-001','CANARY-TERMINAL-SUCCESS-001','CANARY-ARTIFACT-READBACK-001','CANARY-PAYLOAD-CONTRACT-001','CANARY-PATCH-UPGRADE-001','FL-080-CLOSED','FL-059-CLOSED','function rendererCanaryPayload_()','function runRendererAuthorizedCanary()'])if(!after1.includes(token))throw new Error('Missing '+token);
if(/runQ_\(r\);return 1/.test(after1))throw new Error('Legacy false processed-count path survived');
if((after1.match(/function rendererCanaryQueueReadback_\(/g)||[]).length!==1)throw new Error('Upgrade duplicated canary readback helper');
if((after1.match(/function runRendererAuthorizedCanary\(/g)||[]).length!==1)throw new Error('Upgrade duplicated canary entrypoint');
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);

function extract(name){const sig='function '+name+'(';const start=after1.indexOf(sig);if(start<0)throw new Error('Missing function '+name);const open=after1.indexOf('{',start);let depth=0,quote=null,esc=false;for(let i=open;i<after1.length;i++){const c=after1[i];if(quote){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===quote)quote=null;continue;}if(c==='"'||c==="'"||c==='`'){quote=c;continue;}if(c==='{')depth++;else if(c==='}'&&--depth===0)return after1.slice(start,i+1);}throw new Error('Unterminated '+name);}
const sandbox={};vm.createContext(sandbox);vm.runInContext(extract('rendererCanaryStateDecision_')+'\n'+extract('rendererCanaryPayload_'),sandbox);
const payload=sandbox.rendererCanaryPayload_();
if(sandbox.rendererCanaryStateDecision_({configuredCanary:true,payload})!==true)throw new Error('Generated canary payload rejected by known-good decision');
if(payload.preconditions?.runtime!=='FL-080-CLOSED'||payload.preconditions?.trace!=='FL-059-CLOSED')throw new Error('Generated safety attestations incomplete');
const missingRuntime=JSON.parse(JSON.stringify(payload));delete missingRuntime.preconditions.runtime;
if(sandbox.rendererCanaryStateDecision_({configuredCanary:true,payload:missingRuntime})!==false)throw new Error('Missing runtime attestation did not fail closed');
const wrongTrace=JSON.parse(JSON.stringify(payload));wrongTrace.preconditions.trace='OPEN';
if(sandbox.rendererCanaryStateDecision_({configuredCanary:true,payload:wrongTrace})!==false)throw new Error('Wrong trace attestation did not fail closed');

console.log(JSON.stringify({status:'PASS',contract:'CANARY-EXACT-EXECUTION-001',payloadContract:'CANARY-PAYLOAD-CONTRACT-001',upgradeContract:'CANARY-PATCH-UPGRADE-001',nMinusOneUpgrade:true,idempotent:true,staleCountGuard:true,successCountGuard:true,exactQueueBinding:true,knownGoodPayloadAccepted:true,missingRuntimeRejected:true,wrongTraceRejected:true,first:JSON.parse(first),second:JSON.parse(second)},null,2));
