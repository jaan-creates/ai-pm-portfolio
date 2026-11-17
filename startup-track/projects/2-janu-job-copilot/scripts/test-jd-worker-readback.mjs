import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-jd-worker-'));
const file=path.join(dir,'TrackerWorkflow.js');
fs.writeFileSync(file,[
  'const P12={}; const JC={S:{A:"Applications"},W:{SCORE:"JD_PARSE_SCORE_MAP"}};',
  'function verifyReleaseIdentity(){}','function phase1HealthTick(){}','function workerJD_(){}',
  'function retrievalGatewayFetch_(){}','function parseSaveJD_(...args){fixture.save(...args);}',
  'function loadJDArtifact_(){return fixture.artifact;}','function enqueue_(...args){return fixture.enqueue(...args);}',
  'function atsHostKind_(){}','function upsertWorkerState_(k,v){fixture.states.push(v);}'
].join('\n'));
execFileSync(process.execPath,[fileURLToPath(new URL('patch-p1a-jd-worker.mjs',import.meta.url)),dir]);
const assembled=fs.readFileSync(file,'utf8');
function run({existing=false, coverage=.95, persists=true, admit=true}={}) {
  const fixture={artifact:existing?{version:'fixture'}:null,states:[],writes:[],jobs:[],queueReads:0,
    save(){this.artifact=persists?{version:'fixture'}:null;},
    enqueue(app,worker){this.jobs.push([app,worker]);return admit?'Q-1':null;}};
  const context=vm.createContext({fixture,find_:()=>2,SH_:()=>({}),obj_:()=>({'JD Completeness %':coverage}),
    hash_:String,resolve_:()=>{},set_:(s,r,o)=>fixture.writes.push(o),now_:()=>new Date(0)});
  vm.runInContext(assembled,context);
  context.p1aJdRetrieveForApp_=()=>({ok:true,content:'fixture',provider:'fixture'});
  context.p1aJdTextFromRetrieval_=()=> 'fixture';
  context.p1aRecordJdRetrieval_=()=>{};
  return {fixture,invoke:()=>context.workerJD_('APP-1',{})};
}
for(const coverage of [.95,95,'95%']) test('persisted JD completeness '+coverage,()=>{
  const h=run({coverage});assert.equal(h.invoke().status,'RECOVERED');assert.equal(h.fixture.jobs.length,1);
});
test('existing artifact follows the same percentage contract',()=>assert.equal(run({existing:true}).invoke().status,'EXISTING_ARTIFACT'));
for(const opts of [{persists:false},{coverage:0.5},{coverage:'bad'},{coverage:105}]) test('reject incomplete readback '+JSON.stringify(opts),()=>{
  const h=run(opts);assert.throws(h.invoke,/PERSISTENCE_OR_COMPLETENESS/);assert.equal(h.fixture.jobs.length,0);
});
for(const existing of [true,false]) test('reject empty score admission; existing='+existing,()=>{
  const h=run({admit:false,existing,coverage:95});assert.throws(h.invoke,/SCORE_ADMISSION/);
  assert.ok(!h.fixture.states.includes('PASS'));assert.equal(h.fixture.writes.length,0);
});
