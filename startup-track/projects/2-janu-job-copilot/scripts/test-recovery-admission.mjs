import assert from 'node:assert/strict';
import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-admission-'));
const source=path.join(dir,'Tracker.js');
fs.writeFileSync(source,'function verifyReleaseIdentity(){}\nfunction enqueue_(app,type,payload,input,opts){writes.push(input);return "Q";}');
const patch=()=>execFileSync(process.execPath,[fileURLToPath(new URL('patch-recovery-admission.mjs',import.meta.url)), dir]);
patch();const assembled=fs.readFileSync(source,'utf8');patch();assert.equal(fs.readFileSync(source,'utf8'),assembled);
function scenario(worker, detail, state='failed') {
  const headers=['Application ID','Worker Type','Input Hash','Status','Error Code','Error Detail'];
  const rows=[headers,['A',worker,'input-1',state,'CODE_OR_SCHEMA',detail]];
  const ctx=vm.createContext({rows,writes:[],hash_:String,JC:{S:{Q:'queue'}},SH_:()=>({getDataRange:()=>({getValues:()=>rows})})});
  vm.runInContext(assembled,ctx);return ctx;
}
for(const [worker,code] of [['RESUME_GENERATE','RENDER_CAREERBREAK_CANONICAL_MISSING'],['JD_RETRIEVE','P1A_JD_PERSISTENCE_OR_COMPLETENESS_FAILED']])test(worker+' quarantine survives repeated ticks',()=>{
  const c=scenario(worker,'Error: DETERMINISTIC:'+code);
  for(let i=0;i<3;i++)assert.throws(()=>c.enqueue_('A',worker,{},'input-1'),/UNCHANGED_INPUT_QUARANTINED/);
  assert.equal(c.writes.length,0);
  assert.equal(c.enqueue_('B',worker,{},'input-1'),'Q');
  assert.equal(c.enqueue_('A',worker,{},'new-evidence'),'Q');
});
test('transient failures remain eligible for existing retry policy',()=>{
  const c=scenario('JD_RETRIEVE','TIMEOUT');c.rows[1][4]='TRANSIENT_PROVIDER';assert.equal(c.enqueue_('A','JD_RETRIEVE',{},'input-1'),'Q');
});
for(const worker of ['JD_RETRIEVE','RESUME_GENERATE'])test('derived key blocks unchanged '+worker,()=>{
  const c=scenario(worker,'Error: DETERMINISTIC:P1A_JD_PERSISTENCE_OR_COMPLETENESS_FAILED');c.rows[1][2]='{}';
  assert.throws(()=>c.enqueue_('A',worker,{},undefined),/UNCHANGED_INPUT_QUARANTINED/);
  assert.equal(c.enqueue_('A',worker,{changed:true},undefined),'Q');
  assert.equal(c.writes.length,1);
});
test('generic deterministic failure is bounded',()=>{const c=scenario('QA_FINALIZE','Any deterministic error');assert.throws(()=>c.enqueue_('A','QA_FINALIZE',{},'input-1'),/UNCHANGED_INPUT_QUARANTINED/);});
test('completed work and user blockers are distinct',()=>{
  const c=scenario('JD_RETRIEVE','USER_BLOCKER: missing','succeeded');assert.equal(c.enqueue_('A','JD_RETRIEVE',{},'input-1'),'Q');
  c.rows[1][3]='failed';c.rows[1][4]='USER_BLOCKER';assert.equal(c.enqueue_('A','JD_RETRIEVE',{},'input-1'),'Q');
});
