import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const projectDir=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patcher=path.join(projectDir,'scripts','patch-trace-golden-v0-runtime.mjs');
if(!fs.existsSync(patcher))throw new Error('patch-trace-golden-v0-runtime.mjs missing');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'janu-trace-golden-'));
const target=path.join(tmp,'TrackerWorkflow.js');
fs.writeFileSync(target,`
const P12=Object.freeze({VERSION:'1.3.8',SUITE:'p0-regression-v19'});
// Worker names must be present so the real continuation patch can resolve its contracts.
const JC={S:{A:'Applications'},W:{RESUME_GENERATE:true,QA_FINALIZE:true}};
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
// Provider guard fixture mirrors the exact pre-patch bounded-paid-fallback seam.
function fixtureProviderGuard_(q,cfg,ctx){if(q&&cfg.tavilyKey)return true;return false;}
// Real lifecycle patch inserts a closed-vacancy guard at this existing harness seam.
function orchestrateOne_(id,a){if(!id||a['Decision']!=='Apply')return 0;return 1;}
function phase1HealthTick(){return true;}
`);
// The TRACE runtime patch composes the *real* E2E continuation patch. Its CLOSED
// vacancy dependency must be installed through the real vacancy worker ->
// lifecycle -> E2E composition chain, not mocked or omitted.
const lifecyclePatcher=path.join(projectDir,'scripts','patch-p1a-vacancy-worker.mjs');
const lifecycle=spawnSync(process.execPath,[lifecyclePatcher,tmp],{encoding:'utf8'});
if(lifecycle.status!==0)throw new Error('lifecycle fixture composition failed: '+(lifecycle.stderr||lifecycle.stdout));
if(!fs.readFileSync(target,'utf8').includes('function p1aWriteVacancyEvidence_(')||!fs.readFileSync(target,'utf8').includes('function p1aPropagateClosedVacancy_('))throw new Error('real vacancy writer/lifecycle dependencies not installed');
function run(){const r=spawnSync(process.execPath,[patcher,tmp],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);return r.stdout;}
run();const once=fs.readFileSync(target,'utf8');
run();const twice=fs.readFileSync(target,'utf8');
if(once!==twice)throw new Error('trace patch is not idempotent');
const syntax=spawnSync(process.execPath,['--check',target],{encoding:'utf8'});
if(syntax.status!==0){
  const numbered=twice.split('\n').slice(0,40).map((line,i)=>String(i+1).padStart(3,'0')+': '+line).join('\n');
  throw new Error('patched source syntax invalid:\n'+syntax.stderr+'\n--- transformed source head ---\n'+numbered);
}
for(const token of ['function traceGoldenTick_(','function traceRefreshGolden_(','function traceGoldenCompleteness_(','function runTraceGoldenSelfTest()','Trace Explorer','TRACE-GOLDEN-V0-2','function traceUrlIdentityMatch_(','function traceNextAppIdFromValues_(','function traceFindAppByUrlDetail_(','golden_trace_duplicate_evidence','DETERMINISTIC:TRACE_GOLDEN_ID_COLLISION'])if(!twice.includes(token))throw new Error('missing '+token);
if(!twice.includes("'Decision':'New'"))throw new Error('fresh system intake must begin Decision=New');
if(!twice.includes(".replace(/[/]$/,'')"))throw new Error('safe generated slash matcher missing');
if(twice.includes(".replace(//$/,'')"))throw new Error('malformed generated slash matcher survived');
if(/UrlFetchApp\.fetch|OpenAI|TAVILY_API_KEY|SERPAPI_API_KEY/.test(twice.slice(twice.indexOf('function traceStateValue_('),twice.indexOf('function verifyReleaseIdentity()'))))throw new Error('trace layer must not introduce its own paid/network retrieval path');
const refreshStart=twice.indexOf('function traceRefreshGolden_(');
const refresh=twice.slice(refreshStart,twice.indexOf('\nfunction ',refreshStart+1));
if (refresh.includes('clearContent()') || !refresh.includes('traceUpsertSpans_(ex,rows)')) throw new Error('Destructive TRACE refresh');
const occurrences=(twice.match(/function traceGoldenTick_\(/g)||[]).length;if(occurrences!==1)throw new Error('traceGoldenTick_ duplicated');
const neg="traceUrlIdentityMatch_('https://jobs.ashbyhq.com/tekion/e0956a72-ce85-4e10-a34d-f5c4d630d8e0','https://job-boards.greenhouse.io/easyship/jobs/4706111006?gh_jid=4706111006')===false";
if(!twice.includes(neg))throw new Error('TRACE-DEDUPE-001 Tekion/Easyship negative fixture missing');
if(!twice.includes("traceNextAppIdFromValues_('2026-08-23',['2026-08-23-001'])==='2026-08-23-002'"))throw new Error('TRACE-ID-001 collision fixture missing');
if(!twice.includes("if(!raw)continue"))throw new Error('empty existing URLs must never dedupe');
if(!twice.includes("if(!requested||last<2)"))throw new Error('empty requested URL must never dedupe');
// Execute actual generated helper functions, not a simplified model of their logic.
// No remote requests, model calls, spreadsheet writes or Apps Script invocations.
const sandbox=vm.createContext({URL,Date,console});
vm.runInContext(twice,sandbox,{timeout:5000});
const runtimeChecks=[
  ['same canonical URL',vm.runInContext("traceUrlIdentityMatch_('https://jobs.ashbyhq.com/example/role/?utm_source=one','https://jobs.ashbyhq.com/example/role')",sandbox)],
  ['distinct canonical URLs',!vm.runInContext("traceUrlIdentityMatch_('https://jobs.ashbyhq.com/example/role','https://jobs.ashbyhq.com/other/role')",sandbox)],
  ['empty URL does not dedupe',!vm.runInContext("traceUrlIdentityMatch_('','')",sandbox)],
  ['collision-proof next ID',vm.runInContext("traceNextAppIdFromValues_('2026-08-23',['2026-08-23-001','2026-08-23-009'])",sandbox)==='2026-08-23-010'],
  ['closed-vacancy lifecycle self-test',vm.runInContext('p1aVacancyLifecycleSelfTest_().pass',sandbox)],
  ['recoverable QA failure',vm.runInContext("p1aQaNeedsRepair_({state:'FAILED',errorCode:'CODE_OR_SCHEMA'})",sandbox)]
];
for(const [name,pass] of runtimeChecks)if(!pass)throw new Error('generated runtime helper execution failed: '+name);

// Model the installed append/verify/retire writer with synthetic trace rows.
// The generated source and service adapters below contain no private project data.
const appendHeader=`const ex=traceEnsureExplorer_(),headers=ex.getRange(1,1,1,ex.getLastColumn()).getDisplayValues()[0],oldLast=ex.getLastRow(),ann={};
if(oldLast>1){const old=ex.getRange(2,1,oldLast-1,ex.getLastColumn()).getDisplayValues();for(const r of old)if(r[0]===traceId&&r[2])ann[r[2]]={eval:r[20],note:r[21]};}`;
const appendWriter=`if(!rows.length)throw new Error('DETERMINISTIC:TRACE_REFRESH_EMPTY_CANDIDATE');
for(const o of rows){const a=ann[o['Span ID']]||{};o['Human Eval']=a.eval||'';o['Human Note']=a.note||'';}
const candidate=rows.map(o=>headers.map(k=>o[k]===undefined?'':o[k])),start=oldLast+1;
ex.getRange(start,1,candidate.length,headers.length).setValues(candidate);
SpreadsheetApp.flush();
const rb=ex.getRange(start,1,candidate.length,2).getDisplayValues();
if(rb.length!==candidate.length||rb.some(r=>String(r[0])!==traceId||String(r[1])!==String(appId)))throw new Error('DETERMINISTIC:TRACE_CANDIDATE_READBACK_FAILED');
if(oldLast>1)ex.deleteRows(2,oldLast-1);
SpreadsheetApp.flush();
const finalRows=ex.getLastRow()-1,final=finalRows>0?ex.getRange(2,1,finalRows,2).getDisplayValues():[];
const count=final.filter(r=>String(r[0])===traceId&&String(r[1])===String(appId)).length;
if(count!==rows.length)throw new Error('DETERMINISTIC:TRACE_FINAL_READBACK_MISMATCH');
`;
const legacyRefresh=refresh.replace('const ex=traceEnsureExplorer_();',appendHeader)
  .replace('traceUpsertSpans_(ex,rows);',appendWriter);
assert.notEqual(legacyRefresh,refresh);
const legacySource=twice.replace(refresh,legacyRefresh);

function refreshHarness(source) {
  const headers=['Trace ID','Group ID','Span ID','Parent Span ID','Stage','Type','Status','Started At','Ended At','Duration ms','Attempt','Provider / Model','Input Ref','Output Ref','Error Class','Error Code','Cost USD','Release','Git Commit','Verified Ref','Human Eval','Human Note'];
  const other=['other','other-app','other-span',...Array(17).fill(''),'Approved','Preserve unrelated note'];
  const current=['fixture-trace','fixture-app','intake:fixture-app',...Array(17).fill(''),'Reviewed','Preserve current note'];
  const rows=[headers,other.slice(),current.slice()];
  const receipts=[];
  const lock={held:false,hasLock(){return this.held;},tryLock(){this.held=true;return true;},releaseLock(){this.held=false;}};
  const sheet={
    dropWrites:false,getLastRow:()=>rows.length,getLastColumn:()=>headers.length,
    getDataRange:()=>sheet.getRange(1,1,rows.length,headers.length),
    deleteRows(start,count){rows.splice(start-1,count);},
    getRange(row,column,height=1,width=1){
      const values=()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row+i-1]?.[column+j-1]??''));
      return {
        getValues:values,getDisplayValues:()=>values().map(r=>r.map(String)),
        setValues(incoming){
          if(sheet.dropWrites)return;
          for(let i=0;i<height;i++){
            rows[row+i-1]??=[];
            for(let j=0;j<width;j++)rows[row+i-1][column+j-1]=incoming[i][j];
          }
        }
      };
    }
  };
  const context=vm.createContext({
    SpreadsheetApp:{getActive:()=>({getSheetByName:()=>null}),flush(){}},
    LockService:{getScriptLock:()=>lock}
  });
  vm.runInContext(source,context,{timeout:5000});
  context.traceEnsureExplorer_=()=>sheet;
  context.traceStateValue_=()=> 'fixture-release';
  context.upsertWorkerState_=(...args)=>receipts.push(args);
  return {rows,other,sheet,receipts,lock,run:()=>context.traceRefreshGolden_('fixture-app','fixture-trace')};
}
const before=refreshHarness(legacySource);
before.run();
assert.equal(before.rows.some(row=>row[0]==='other'),false,'The legacy fixture must reproduce history loss');
fs.writeFileSync(target,legacySource);
run();
const upgraded=fs.readFileSync(target,'utf8');
run();
assert.equal(fs.readFileSync(target,'utf8'),upgraded,'Installed-writer upgrade must be idempotent');
for(const source of [twice,upgraded]){
  const fixture=refreshHarness(source);
  fixture.run();
  fixture.run();
  assert.deepEqual(fixture.rows[1],fixture.other);
  assert.deepEqual(fixture.rows[2].slice(20),['Reviewed','Preserve current note']);
  assert.equal(fixture.rows.length,3,'Repeated refresh must reuse the same span');
  assert.equal(fixture.receipts.length,2);
  assert.equal(fixture.lock.held,false);
  const broken=refreshHarness(source);
  broken.sheet.dropWrites=true;
  assert.throws(broken.run,/Trace projection readback mismatch/);
  assert.equal(broken.receipts.length,0,'A lost write must not publish a successful refresh receipt');
  assert.equal(broken.lock.held,false);
}
const unknown=legacySource.replace('TRACE_FINAL_READBACK_MISMATCH','UNRECOGNIZED_WRITER');
fs.writeFileSync(target,unknown);
const rejected=spawnSync(process.execPath,[patcher,tmp],{encoding:'utf8'});
assert.notEqual(rejected.status,0,'An unrecognized installed writer must stop the patch');
assert.match(rejected.stderr,/Unrecognized trace refresh writer/);
assert.equal(fs.readFileSync(target,'utf8'),unknown,'Rejected source must remain intact');
console.log(JSON.stringify({installedWriterUpgrade:'PASS',legacyHistoryLossReproduced:true,supportedWriterForms:2,idempotentUpgrade:true,historyAndNotesPreserved:true,lostWritesBlockReceipt:true,unknownWriterRejected:true}));
console.log(JSON.stringify({status:'PASS',contract:'TRACE-GOLDEN-V0-2',idempotent:true,syntax:true,decisionStartsNew:true,noOwnPaidRetrieval:true,generatedEscapeSafe:true,dedupeNegativeFixture:true,uniqueIdFixture:true,duplicateEvidence:true,generatedRuntimeHelperChecks:runtimeChecks.length},null,2));
