import assert from 'node:assert/strict';
import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'janu-receipt-'));
const file=path.join(directory,'Tracker.js');
fs.writeFileSync(file,[
  "const P12={VERSION:'1.3.8',SUITE:'v19'};",
  'function verifyReleaseIdentity(){}',
  'function upsertWorkerState_(key,value){write(key,value);}',
].join('\n'));
execFileSync(process.execPath,[fileURLToPath(new URL('patch-release-provenance.mjs',import.meta.url)),directory]);
const source=fs.readFileSync(file,'utf8');
const args=['a'.repeat(40),'123','1','b'.repeat(64),'1.3.8','v19'];
const stamp='2026-11-17T10:00:00.000Z';
function fixture(fail) {
  const state=new Map();
  const rows=()=>[['Key','Value'],...state];
  const ctx=vm.createContext({iso_:()=>stamp,write:(key,value)=>{if(key===fail)throw new Error('write failed');state.set(key,value);},
    SH_:(name)=>name==='__Worker State'?{getDataRange:()=>({getValues:rows})}:null});
  vm.runInContext(source,ctx);return {ctx,state};
}
test('partial write leaves a pending receipt and blocks independent verification',()=>{
  const f=fixture('deployment_git_commit');assert.throws(()=>f.ctx.recordDeploymentProvenance(...args));
  assert.equal(f.state.get('deployment_provenance_status'),'PENDING');assert.throws(()=>f.ctx.readJanuDeploymentProvenance(),/Incomplete/);
});
test('reader observes a later change in the independent backing store',()=>{
  const f=fixture();const written=f.ctx.recordDeploymentProvenance(...args);
  assert.deepEqual({...f.ctx.readJanuDeploymentProvenance()},{...written});
  f.state.set('deployment_source_sha256','other');assert.equal(f.ctx.readJanuDeploymentProvenance().sourceHash,'other');
});
