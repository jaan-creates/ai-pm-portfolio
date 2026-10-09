import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const projectDir=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patch=path.join(projectDir,'scripts','patch-renderer-canary-preconditions.mjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'janu-canary-preconditions-'));
const target=path.join(tmp,'TrackerWorkflow.js');
const source=`const P12={};
function docText_(id){return DocumentApp.openById(id).getBody().getText();}
function rendererWorkerStateValue_(){return '';}
function rendererQuarantineBlocks_(appId,type,payload){if(String(type)!=='RESUME_GENERATE')return false;payload=payload||{};const rec=rendererWorkerStateValue_('renderer_recurrence_gate'),rep=rendererWorkerStateValue_('renderer_replay_gate');if(rec==='CANARY_PASS'&&rep==='CANARY_PASS')return false;const canary=rendererWorkerStateValue_('renderer_canary_application_id'),self=rendererWorkerStateValue_('renderer_careerbreak_self_test');return !(String(appId)===String(canary)&&self==='PASS'&&String(payload.rendererPolicy||'')==='RENDER-CAREERBREAK-V3');}
function SH_(){return {getLastRow(){return 1;},getRange(){return {createTextFinder(){return {matchEntireCell(){return this;},findNext(){return null;}}},getDisplayValue(){return '';}}}};}
function hm_(){return {};}
`;
fs.writeFileSync(target,source);
function apply(){const r=spawnSync(process.execPath,[patch,tmp],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout||'canary patch failed');return r.stdout;}
apply();const once=fs.readFileSync(target,'utf8');apply();const twice=fs.readFileSync(target,'utf8');
if(once!==twice)throw new Error('CANARY-PRECONDITION-002 patch is not idempotent');
const syntax=spawnSync(process.execPath,['--check',target],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
for(const token of ['CANARY-PRECONDITION-002','CANARY-PRECONDITION-001','CANONICAL-EVIDENCE-DRIVE-EXPORT-001','rendererCanaryStateDecision_','rendererCanaryPreconditionsMet_','rendererGoldenTracePreRendererReady_','canonicalEvidenceText_','ATOMIC_APPEND_VERIFY_RETIRE','FL-080-CLOSED','FL-059-CLOSED','180000','HEALTH_STATE_INCONSISTENT'])if(!twice.includes(token))throw new Error('missing '+token);
if(twice.match(/function docText_\([^)]*\)\{[^}]*DocumentApp/))throw new Error('DocumentApp dependency survived');
if(!twice.match(/function docText_\([^)]*\)\{return canonicalEvidenceText_\(id\);\}/))throw new Error('docText_ was not redirected to Drive export');
let fetchedUrl='';
const sandbox={
  encodeURIComponent,
  UrlFetchApp:{fetch(url,opts){fetchedUrl=url;if(!opts||!opts.headers||opts.headers.Authorization!=='Bearer token')throw new Error('missing oauth bearer');return{getResponseCode(){return 200;},getContentText(){return 'canonical jd text';}};}},
  ScriptApp:{getOAuthToken(){return'token';}}
};
vm.createContext(sandbox);vm.runInContext(twice,sandbox);
if(sandbox.docText_('doc-123')!=='canonical jd text')throw new Error('Drive export evidence text mismatch');
if(!/drive\/v3\/files\/doc-123\/export\?mimeType=text%2Fplain/.test(fetchedUrl))throw new Error('Drive export URL mismatch '+fetchedUrl);
const base={configuredCanary:true,payload:{canary:true,rendererPolicy:'RENDER-CAREERBREAK-V3',preconditions:{runtime:'FL-080-CLOSED',trace:'FL-059-CLOSED'}},selfTest:'PASS',recurrence:'SELF_TEST_PASS_CANARY_PENDING',runtimeStatus:'HEALTHY',runtimeCircuit:'CLOSED',regressionErrorCode:'RELEASE_BLOCKER_OPEN',healthElapsedMs:150000,traceSelfTest:'PASS',goldenTracePreRendererReady:true};
const decide=x=>sandbox.rendererCanaryStateDecision_(Object.assign({},base,x||{}));
if(decide()!==true)throw new Error('known-good canary state must pass');
const negatives=[
  {payload:{canary:false,rendererPolicy:'RENDER-CAREERBREAK-V3',preconditions:{runtime:'FL-080-CLOSED',trace:'FL-059-CLOSED'}}},
  {healthElapsedMs:180001},
  {runtimeCircuit:'OPEN'},
  {regressionErrorCode:'WORKER_RUNTIME_OPEN'},
  {regressionErrorCode:'HEALTH_STATE_INCONSISTENT'},
  {recurrence:'BLOCKED_SELF_TEST_FAIL'},
  {traceSelfTest:'FAIL'},
  {goldenTracePreRendererReady:false},
  {payload:{canary:true,rendererPolicy:'RENDER-CAREERBREAK-V3',preconditions:{runtime:'FL-080-CLOSED',trace:'OPEN'}}}
];
for(const x of negatives)if(decide(x)!==false)throw new Error('unsafe canary state passed '+JSON.stringify(x));
if(decide({goldenTraceStatus:'IN_PROGRESS'})!==true)throw new Error('full golden trace status must not deadlock pre-render canary admission');
if(!twice.match(/function rendererQuarantineBlocks_[\s\S]*rendererCanaryPreconditionsMet_/))throw new Error('quarantine does not consume executable canary gate');
if(!twice.includes('fullGoldenTracePassRequiredBeforeCanary:false'))throw new Error('deadlock-prevention contract marker missing');
console.log(JSON.stringify({status:'PASS',contract:'CANARY-PRECONDITION-002',compat:'CANARY-PRECONDITION-001',canonicalEvidence:'CANONICAL-EVIDENCE-DRIVE-EXPORT-001',idempotent:true,syntax:true,positiveFixture:true,negativeFixtures:negatives.length,healthMaxMs:180000,tracePreRendererProofRequired:true,atomicTraceReadbackRequired:true,fullGoldenTracePassRequiredBeforeCanary:false,documentAppRemoved:true,driveExportFixture:true,healthConsistencyRequired:true},null,2));
