import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

// Synthetic persistence and admission contract. No private runtime source is included.
const source=`
const P12={}; const JC={S:{A:'Applications',JD:'Snapshots'},W:{SCORE:'JD_PARSE_SCORE_MAP'}};
function verifyReleaseIdentity(){} function phase1HealthTick(){} function workerJD_(){}
function retrievalGatewayFetch_(){} function atsHostKind_(){}
function upsertWorkerState_(k,v){fixture.states.push(v);}
function persistJDArtifact_(appId,snapshotId,d){if(fixture.persists)fixture.artifact=JSON.parse(JSON.stringify(d));}
function loadJDArtifact_(){return fixture.artifact;}
function parseSaveJD_(appId,a,used,raw){
  const d={completeness:fixture.coverage};
  const snapshotId='SYNTHETIC';persistJDArtifact_(appId,snapshotId,d);
  set_(JC.S.JD,2,{'Completeness %':d.completeness,'Snapshot Status':d.completeness>=90?'Verified Full JD':'Partial JD'});
  set_(JC.S.A,2,{'JD Completeness %':d.completeness,'JD Snapshot Status':d.completeness>=90?'Verified Full JD':'Partial JD','Status':d.completeness>=70?'Scoring':'Verifying JD'});
}
function enqueue_(id,worker,payload,input){
  const a=fixture.application;
  if(!fixture.admit || !['New','Apply'].includes(a.Decision) || !['New','Scoring'].includes(a.Status) || !(Number(a['JD Completeness %'])>=70) || !/Full JD|Partial JD/.test(a['JD Snapshot Status']) || a['Blocker Category'] || a['Exact Input Needed'])return null;
  const prior=fixture.queueEntries.find(j=>j.input===input);if(prior)return prior.id;
  const job={id:'Q-'+(fixture.jobs.length+1),worker,input};fixture.queueEntries.push(job);fixture.recordJob(id,worker);return job.id;
}`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-jd-worker-'));
const file=path.join(dir,'TrackerWorkflow.js');
const installer=fileURLToPath(new URL('../scripts/patch-p1a-jd-worker.mjs',import.meta.url));
let assembled;
try {
  fs.writeFileSync(file,source);execFileSync(process.execPath,[installer,dir]);
  assembled=fs.readFileSync(file,'utf8');
  execFileSync(process.execPath,[installer,dir]);
  assert.equal(fs.readFileSync(file,'utf8'),assembled,'repeat install must be stable');
  const unknown=source.replace("const snapshotId='SYNTHETIC';", "const changedBoundary='SYNTHETIC';");
  fs.writeFileSync(file,unknown);
  assert.throws(()=>execFileSync(process.execPath,[installer,dir],{stdio:'pipe'}),/Unknown parseSaveJD_/);
  assert.equal(fs.readFileSync(file,'utf8'),unknown,'unknown parser must remain unchanged');
} finally {fs.rmSync(dir,{recursive:true,force:true});}

export function createJdWorker({applicationId='APP-1',existing=false,coverage=.95,persists=true,admit=true,dropSheet='',status='Verifying JD',decision='Apply'}={}) {
  const fixture={coverage,persists,admit,artifact:existing?{completeness:coverage}:null,states:[],writes:[],jobs:[],queueEntries:[],
    recordJob(id,worker){this.jobs.push([id,worker]);},
    application:{Decision:decision,Status:status,'JD Completeness %':existing?coverage:0,'JD Snapshot Status':existing?'Partial JD':''},
    snapshot:existing?{'Completeness %':coverage,'Snapshot Status':'Partial JD'}:{}};
  const context=vm.createContext({fixture,find_:()=>2,SH_:s=>s,obj_:s=>({... (s==='Applications'?fixture.application:fixture.snapshot)}),
    hash_:String,resolve_:()=>{},set_:(s,r,o)=>{fixture.writes.push(o);if(s!==dropSheet)Object.assign(s==='Applications'?fixture.application:fixture.snapshot,o);},now_:()=>new Date(0)});
  vm.runInContext(assembled,context);
  context.p1aJdRetrieveForApp_=()=>({ok:true,content:'fixture',provider:'fixture'});
  context.p1aJdTextFromRetrieval_=()=> 'fixture';context.p1aRecordJdRetrieval_=()=>{};
  return {fixture,context,invoke:()=>context.workerJD_(applicationId,{})};
}
