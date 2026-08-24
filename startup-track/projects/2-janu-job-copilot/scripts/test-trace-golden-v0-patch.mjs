import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const projectDir=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patcher=path.join(projectDir,'scripts','patch-trace-golden-v0-runtime.mjs');
if(!fs.existsSync(patcher))throw new Error('patch-trace-golden-v0-runtime.mjs missing');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'janu-trace-golden-'));
const target=path.join(tmp,'TrackerWorkflow.js');
fs.writeFileSync(target,`
const P12=Object.freeze({VERSION:'1.3.8',SUITE:'p0-regression-v19'});
const JC={S:{A:'Applications',Q:'__Processing Queue'},W:{}};
const WORKERS=['RESUME_GENERATE','QA_FINALIZE'];
function stripInternalEvidenceTags_(s){return String(s||'');}
function esc_(s){return String(s||'');}
function verifyReleaseIdentity(){return true;}
function enqueue_(){return 'Q-1';}
function upsertWorkerState_(){}
function hash_(x){return String(x);}
function SH_(){return {getLastRow(){return 1;},getLastColumn(){return 41;},getRange(){return {getDisplayValues(){return [[]];},getDisplayValue(){return'';},getValue(){return'';},setValue(){return this;},setValues(){}};},appendRow(){}};}
function hm_(){return {'Application ID':1,'Job URL':5,'Canonical Apply URL':26};}
function obj_(){return {};}
function set_(){}
function find_(){return 0;}
function now_(){return new Date();}
function iso_(){return new Date().toISOString();}
function p1aPropagateClosedVacancy_(){return {status:'CLOSED_PROPAGATED'};}
function p1aQueueWorkerState_(){return {state:'NONE'};}
function nextQ_(onlyApp){const v=[['Q','A','RESUME_GENERATE','queued','','',0,4,new Date(),'','','','',JSON.stringify({source:'trace-fixture'})]],t=Date.now();let best=null;for(let i=0;i<v.length;i++){const app=String(v[i][1]||''),nx=0;if(onlyApp&&app!==onlyApp)continue;if(v[i][3]==='queued'&&(!nx||nx<=t))best=i+2;}return best;}
function runQ_(r){const s=SH_();const qid='Q',app='A',type='RESUME_GENERATE',payload={},attempt=1,max=4,started=now_();s.getRange(r,4).setValue('running');return 1;}
function render_(v,d){const b={setFontFamily(){}};const scalar={'{{CAREER_BREAK}}':stripInternalEvidenceTags_(d&&d.career_break||'')};Object.keys(scalar).forEach(k=>{});function block(token,items){}block('{{GLOROOTS_BULLETS}}',[]);return b;}
function phase1HealthTick(){return true;}
`);
function run(){const r=spawnSync(process.execPath,[patcher,tmp],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);return r.stdout;}
run();const once=fs.readFileSync(target,'utf8');
run();const twice=fs.readFileSync(target,'utf8');
if(once!==twice){const a=once.split('\n'),b=twice.split('\n'),n=Math.max(a.length,b.length);let i=0;for(;i<n;i++)if(a[i]!==b[i])break;throw new Error('trace patch is not idempotent; firstDiffLine='+(i+1)+'\nonce: '+String(a[i])+'\ntwice: '+String(b[i]));}
const syntax=spawnSync(process.execPath,['--check',target],{encoding:'utf8'});
if(syntax.status!==0){
  const numbered=twice.split('\n').slice(0,60).map((line,i)=>String(i+1).padStart(3,'0')+': '+line).join('\n');
  throw new Error('patched source syntax invalid:\n'+syntax.stderr+'\n--- transformed source head ---\n'+numbered);
}
for(const token of ['function traceGoldenTick_(','function traceRefreshGolden_(','function traceGoldenCompleteness_(','function runTraceGoldenSelfTest()','Trace Explorer','TRACE-GOLDEN-V0-2','function traceUrlIdentityMatch_(','function traceNextAppIdFromValues_(','function traceFindAppByUrlDetail_(','golden_trace_duplicate_evidence','DETERMINISTIC:TRACE_GOLDEN_ID_COLLISION','P1-A-E2E-CONTINUATION-3','RENDER-CAREERBREAK-V2','ATOMIC_APPEND_VERIFY_RETIRE','RENDERER_QUARANTINE_ACTIVE'])if(!twice.includes(token))throw new Error('missing '+token);
if(!twice.includes("'Decision':'New'"))throw new Error('fresh system intake must begin Decision=New');
if(!twice.includes(".replace(/[/]$/,'')"))throw new Error('safe generated slash matcher missing');
if(twice.includes(".replace(//$/,'')"))throw new Error('malformed generated slash matcher survived');
if(/UrlFetchApp\.fetch|OpenAI|TAVILY_API_KEY|SERPAPI_API_KEY/.test(twice.slice(twice.indexOf('function traceStateValue_('),twice.indexOf('function verifyReleaseIdentity()'))))throw new Error('trace layer must not introduce its own paid/network retrieval path');
const occurrences=(twice.match(/function traceGoldenTick_\(/g)||[]).length;if(occurrences!==1)throw new Error('traceGoldenTick_ duplicated');
const neg="traceUrlIdentityMatch_('https://jobs.ashbyhq.com/tekion/e0956a72-ce85-4e10-a34d-f5c4d630d8e0','https://job-boards.greenhouse.io/easyship/jobs/4706111006?gh_jid=4706111006')===false";
if(!twice.includes(neg))throw new Error('TRACE-DEDUPE-001 Tekion/Easyship negative fixture missing');
if(!twice.includes("traceNextAppIdFromValues_('2026-08-23',['2026-08-23-001'])==='2026-08-23-002'"))throw new Error('TRACE-ID-001 collision fixture missing');
if(!twice.includes("if(!raw)continue"))throw new Error('empty existing URLs must never dedupe');
if(!twice.includes("if(!requested||last<2)"))throw new Error('empty requested URL must never dedupe');
console.log(JSON.stringify({status:'PASS',contract:'TRACE-GOLDEN-V0-2',idempotent:true,syntax:true,decisionStartsNew:true,noOwnPaidRetrieval:true,generatedEscapeSafe:true,dedupeNegativeFixture:true,uniqueIdFixture:true,duplicateEvidence:true,continuationV3Integration:true,rendererIntegration:true,rendererClaimQuarantineIntegration:true,traceDurabilityIntegration:true},null,2));
