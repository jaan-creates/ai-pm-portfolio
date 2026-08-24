import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const projectDir=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patch=path.join(projectDir,'scripts','patch-runtime-queue-quarantine-order.mjs');
const patchText=fs.readFileSync(patch,'utf8');
for(const token of ['QUEUE-NOJOB-QUARANTINE-001','QUEUE-QUARANTINE-CANDIDATE-BOUNDED-001',"if(v[i][3]!=='queued'||(nx&&nx>t))continue;"])if(!patchText.includes(token))throw new Error('FL-080 patch contract missing '+token);

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'janu-queue-order-test-'));
const source=`
const P12=Object.freeze({VERSION:'1.3.8',SUITE:'p0-regression-v19'});
const JC={S:{Q:'__Processing Queue'}};
let TEST_ROWS=[];let QUARANTINE_CALLS=0;
function now_(){return new Date('2026-08-24T18:00:00Z');}
function SH_(){return {getLastRow(){return TEST_ROWS.length+1;},getRange(){return {getValues(){return TEST_ROWS;}};}};}
function qPriority_(){return 1;}
function rendererQuarantineBlocks_(){QUARANTINE_CALLS++;return false;}
function nextQ_(onlyApp){const s=SH_(JC.S.Q);if(s.getLastRow()<2)return null;const v=s.getRange(2,1,s.getLastRow()-1,16).getValues(),t=now_().getTime();let best=null,bp=999;for(let i=0;i<v.length;i++){const app=String(v[i][1]||''),nx=v[i][8]?new Date(v[i][8]).getTime():0;if(onlyApp&&app!==onlyApp)continue;let qp={};try{qp=v[i][13]?JSON.parse(String(v[i][13])):{}}catch(e){qp={};}if(rendererQuarantineBlocks_(app,String(v[i][2]||''),qp))continue;if(v[i][3]==='queued'&&(!nx||nx<=t)){const p=qPriority_(String(v[i][2]||''));if(p<bp){bp=p;best=i+2;}}}return best;}
function runQ_(){return true;}
`;
const file=path.join(tmp,'TrackerWorkflow.js');fs.writeFileSync(file,source);
const run=spawnSync(process.execPath,[patch,tmp],{encoding:'utf8'});if(run.status!==0)throw new Error(run.stderr||run.stdout||'FL-080 patch failed');
const out=fs.readFileSync(file,'utf8');
const guard=out.indexOf("if(v[i][3]!=='queued'||(nx&&nx>t))continue;");
const quarantine=out.indexOf('rendererQuarantineBlocks_(',out.indexOf('function nextQ_('));
if(guard<0||quarantine<0||guard>quarantine)throw new Error('QUEUE-NOJOB-QUARANTINE-001 transformed ordering failed');
const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(check.status!==0)throw new Error(check.stderr);

const ctx={console};vm.createContext(ctx);vm.runInContext(out+'\nthis.__test={setRows:(x)=>{TEST_ROWS=x;QUARANTINE_CALLS=0;},next:()=>nextQ_(),calls:()=>QUARANTINE_CALLS};',ctx);
const mk=(id,status,retry='')=>['Q-'+id,id,'RESUME_GENERATE',status,'h','k',1,4,retry,'','','','','{}','',''];
ctx.__test.setRows([mk('A','succeeded'),mk('B','failed'),mk('C','cancelled')]);
if(ctx.__test.next()!==null)throw new Error('QUEUE-NOJOB-BUDGET-001 expected no runnable row');
if(ctx.__test.calls()!==0)throw new Error('QUEUE-NOJOB-QUARANTINE-001 terminal rows invoked quarantine '+ctx.__test.calls());
ctx.__test.setRows([mk('D','queued','2026-08-25T18:00:00Z')]);
if(ctx.__test.next()!==null)throw new Error('future retry row must not be runnable');
if(ctx.__test.calls()!==0)throw new Error('not-due row invoked quarantine');
ctx.__test.setRows([mk('E','queued')]);
if(ctx.__test.next()!==2)throw new Error('due queued row was not selected');
if(ctx.__test.calls()!==1)throw new Error('QUEUE-QUARANTINE-CANDIDATE-BOUNDED-001 expected one quarantine evaluation, got '+ctx.__test.calls());

console.log(JSON.stringify({status:'PASS',contract:'QUEUE-NOJOB-QUARANTINE-001',candidateGuard:'QUEUE-QUARANTINE-CANDIDATE-BOUNDED-001',terminalRowsQuarantineCalls:0,notDueRowsQuarantineCalls:0,dueCandidateQuarantineCalls:1,transformedArtifactSyntax:true,productionShapedBadOrderingFixture:true},null,2));
