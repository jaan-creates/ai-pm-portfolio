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
  const headers=['Application ID','Worker Type','Input Hash','Status','Error Detail'];
  const rows=[headers,['A',worker,'input-1',state,detail]];
  const ctx=vm.createContext({rows,writes:[],JC:{S:{Q:'queue'}},SH_:()=>({getDataRange:()=>({getValues:()=>rows})})});
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
  const c=scenario('JD_RETRIEVE','TIMEOUT');assert.equal(c.enqueue_('A','JD_RETRIEVE',{},'input-1'),'Q');
});
