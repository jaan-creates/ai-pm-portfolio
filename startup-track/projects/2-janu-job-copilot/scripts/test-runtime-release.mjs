import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyRelease } from './verify-runtime-release.mjs';

const identity = {commitSha:'a'.repeat(40),runId:'12',runAttempt:'1',sourceHash:'b'.repeat(64),version:'1.3.8',suite:'p0-regression-v19'};
const contracts = {
  runReleaseProvenanceContractSelfTest:'REL-PROV-1',
  runP1AOwnedApplyAdmissionSelfTest:'P1-A-OWNED-APPLY-ADMISSION-1',
  runP1AContractSelfTest:'P1-A-1',runP1BContractSelfTest:'P1-B-1',runP1CContractSelfTest:'P1-C-1'
};
function harness(change = () => undefined) {
  const calls = [];
  function invoke(name, params, pinned) {
    calls.push({name, pinned});
    const answer = contracts[name] ? {contract:contracts[name], pass:true} :
      name === 'readJanuReleaseBuild' ? {commitSha:identity.commitSha,runId:'12',runAttempt:'1'} :
      {...identity,outcome:'PASS',verifiedAt:'2026-10-15T10:00:00.000Z'};
    return change(name, answer, pinned) ?? {status:0,stdout:JSON.stringify({response:answer})};
  }
  return {run:()=>verifyRelease(identity,invoke),calls};
}
test('self-tests precede write and persisted identity is read independently', () => {
  const h=harness(); h.run();
  const names=h.calls.map(c=>c.name);
  assert.equal(names.at(-2),'recordDeploymentProvenance');
  assert.equal(names.at(-1),'readJanuDeploymentProvenance');
  assert.deepEqual(names.filter(n=>n in contracts).sort(),Object.keys(contracts).sort());
  assert.ok(h.calls.some(c=>c.name==='readJanuReleaseBuild' && c.pinned));
});
for (const [name,result] of [
  ['reported permission error with exit zero',{status:0,stdout:'Unable to run script function.'}],
  ['missing function',{status:1,stdout:''}],
  ['revoked grant',{status:0,stdout:'{"error":{"code":401}}'}],
  ['malformed response',{status:0,stdout:'{"response":'}],
  ['skipped mandatory check',{status:0,stdout:'{"response":{"status":"SKIPPED"}}'}],
  ['false test result',{status:0,stdout:'{"response":{"pass":false,"contract":"P1-B-1"}}'}],
  ['different contract',{status:0,stdout:'{"response":{"pass":true,"contract":"P1-A-1"}}'}]
]) test(name,()=>{
  const h=harness(n=>n==='runP1BContractSelfTest'?result:undefined);
  assert.throws(h.run); assert.ok(!h.calls.some(c=>c.name==='recordDeploymentProvenance'));
});
for(const field of Object.keys(identity)) test('persisted mismatch '+field,()=>{
  const h=harness((n,v)=>n==='readJanuDeploymentProvenance'?{status:0,stdout:JSON.stringify({response:{...v,[field]:'wrong'}})}:undefined);
  assert.throws(h.run);
});
test('missing pinned identity fails before acceptance',()=>{
  const h=harness((n,v,p)=>n==='readJanuReleaseBuild' && p?{status:0,stdout:JSON.stringify({response:{...v,commitSha:'other'}})}:undefined);
  assert.throws(h.run);assert.ok(!h.calls.some(c=>c.name==='recordDeploymentProvenance'));
});
