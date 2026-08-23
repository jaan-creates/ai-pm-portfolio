import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const projectDir=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patcher=path.join(projectDir,'scripts','patch-trace-golden-v0.mjs');
if(!fs.existsSync(patcher))throw new Error('patch-trace-golden-v0.mjs missing');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'janu-trace-golden-'));
const target=path.join(tmp,'TrackerWorkflow.js');
fs.writeFileSync(target,`
const P12=Object.freeze({VERSION:'1.3.8',SUITE:'p0-regression-v19'});
const JC={S:{A:'Applications'},W:{}};
function verifyReleaseIdentity(){return true;}
function enqueue_(){return 'Q-1';}
function upsertWorkerState_(){}
function hash_(x){return String(x);}
function SH_(){return {getLastRow(){return 1;},getLastColumn(){return 41;},getRange(){return {getDisplayValues(){return [[]];},getDisplayValue(){return'';},getValue(){return'';},setValues(){}};},appendRow(){}};}
function hm_(){return {'Application ID':1,'Job URL':5,'Canonical Apply URL':26};}
function obj_(){return {};}
function set_(){}
function find_(){return 0;}
function now_(){return new Date();}
function iso_(){return new Date().toISOString();}
function p1aQueueWorkerState_(){return {state:'NONE'};}
function phase1HealthTick(){return true;}
`);
function run(){const r=spawnSync(process.execPath,[patcher,tmp],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);return r.stdout;}
run();const once=fs.readFileSync(target,'utf8');
run();const twice=fs.readFileSync(target,'utf8');
if(once!==twice)throw new Error('trace patch is not idempotent');
const syntax=spawnSync(process.execPath,['--check',target],{encoding:'utf8'});
if(syntax.status!==0){
  const numbered=twice.split('\n').slice(0,20).map((line,i)=>String(i+1).padStart(3,'0')+': '+line).join('\n');
  throw new Error('patched source syntax invalid:\n'+syntax.stderr+'\n--- transformed source head ---\n'+numbered);
}
for(const token of ['function traceGoldenTick_(','function traceRefreshGolden_(','function traceGoldenCompleteness_(','function runTraceGoldenSelfTest()','Trace Explorer','TRACE-GOLDEN-V0-1'])if(!twice.includes(token))throw new Error('missing '+token);
if(!twice.includes("'Decision':'New'"))throw new Error('fresh system intake must begin Decision=New');
if(/UrlFetchApp\.fetch|OpenAI|TAVILY_API_KEY|SERPAPI_API_KEY/.test(twice.slice(twice.indexOf('function traceStateValue_('),twice.indexOf('function verifyReleaseIdentity()'))))throw new Error('trace layer must not introduce its own paid/network retrieval path');
const occurrences=(twice.match(/function traceGoldenTick_\(/g)||[]).length;if(occurrences!==1)throw new Error('traceGoldenTick_ duplicated');
console.log(JSON.stringify({status:'PASS',contract:'TRACE-GOLDEN-V0-1',idempotent:true,syntax:true,decisionStartsNew:true,noOwnPaidRetrieval:true},null,2));
