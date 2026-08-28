import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

// FL-084 current-head deployment trigger: this fixture is the durable recurrence guard.
const project=process.argv[2]||path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const patch=path.join(project,'scripts','patch-canary-exact-execution.mjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-canary-exact-'));
const file=path.join(dir,'TrackerWorkflow.js');
fs.writeFileSync(file,`
const P12={VERSION:'1.3.8'}; const JC={S:{Q:'Q',A:'A'}};
function circuitOpen_(){return false;} function nextQ_(){return 2;} function verifyReleaseIdentity(){}
function rendererCanaryPreconditionsMet_(){return true;} function rendererWorkerStateValue_(){return '2026-08-04-002';}
function SH_(){} function hm_(){} function find_(){} function obj_(){} function workNeeded_(){return true;} function hash_(){return 'h';} function enqueue_(){return 'Q-CANARY';} function upsertWorkerState_(){} function LockService(){}
function runQ_(r){const qid='Q-CANARY',started=new Date();if(false){return 0;}if(false){return;}try{closeCircuit_('Worker Runtime','Job '+qid+' completed in '+(now_()-started)+'ms');}catch(e){throw e;}finally{}}
function processQ_(){if(circuitOpen_('Worker Runtime'))return 0;const r=nextQ_(null);if(!r)return 0;runQ_(r);return 1;}
function closeCircuit_(){} function now_(){return new Date();}
`);
function run(){const r=spawnSync(process.execPath,[patch,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);return r.stdout;}
const first=run(),after1=fs.readFileSync(file,'utf8'),second=run(),after2=fs.readFileSync(file,'utf8');
if(after1!==after2)throw new Error('Patch is not idempotent');
for(const token of ['return Number(runQ_(r)||0)','return 1;/* QUEUE-RUNQ-SUCCESS-001 */','CANARY-QUEUE-ID-BINDING-001','CANARY-TERMINAL-SUCCESS-001','CANARY-ARTIFACT-READBACK-001','function runRendererAuthorizedCanary()'])if(!after1.includes(token))throw new Error('Missing '+token);
if(/runQ_\(r\);return 1/.test(after1))throw new Error('Legacy false processed-count path survived');
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({status:'PASS',contract:'CANARY-EXACT-EXECUTION-001',idempotent:true,staleCountGuard:true,successCountGuard:true,exactQueueBinding:true,first:JSON.parse(first),second:JSON.parse(second)},null,2));
