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
execFileSync(process.execPath,[fileURLToPath(new URL('../scripts/patch-p1a-jd-worker.mjs',import.meta.url)),dir]);
const assembled=fs.readFileSync(file,'utf8');
export function createJdWorker({applicationId="APP-1",existing=false, coverage=.95, persists=true, admit=true}={}) {
  const fixture={artifact:existing?{version:'fixture'}:null,states:[],writes:[],jobs:[],queueReads:0,
    save(){this.artifact=persists?{version:'fixture'}:null;},
    enqueue(app,worker){this.jobs.push([app,worker]);return admit?'Q-1':null;}};
  const context=vm.createContext({fixture,find_:()=>2,SH_:()=>({}),obj_:()=>({'JD Completeness %':coverage}),
    hash_:String,resolve_:()=>{},set_:(s,r,o)=>fixture.writes.push(o),now_:()=>new Date(0)});
  vm.runInContext(assembled,context);
  context.p1aJdRetrieveForApp_=()=>({ok:true,content:'fixture',provider:'fixture'});
  context.p1aJdTextFromRetrieval_=()=> 'fixture';
  context.p1aRecordJdRetrieval_=()=>{};
  return {fixture,invoke:()=>context.workerJD_(applicationId,{})};
}
