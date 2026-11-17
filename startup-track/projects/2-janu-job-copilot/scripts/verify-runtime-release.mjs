import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const checks = [
  ['runReleaseProvenanceContractSelfTest','REL-PROV-1',false],
  ['runP1AOwnedApplyAdmissionSelfTest','P1-A-OWNED-APPLY-ADMISSION-1',true],
  ['runP1AContractSelfTest','P1-A-1',true],
  ['runP1BContractSelfTest','P1-B-1',true],
  ['runP1CContractSelfTest','P1-C-1',true]
];

function invokeClasp(name, params, pinned) {
  const args = ['--json','run',name,'--params',JSON.stringify(params)];
  if (pinned) args.push('--nondev');
  return spawnSync('clasp', args, {encoding:'utf8', timeout:90000});
}

export function verifyRelease(expected, invoke = invokeClasp) {
  const {commitSha,runId,runAttempt,sourceHash,version,suite} = expected;
  if (!/^[0-9a-f]{40}$/.test(commitSha) || !/^[0-9a-f]{64}$/.test(sourceHash) ||
      !/^[1-9]\d*$/.test(runId) || !/^[1-9]\d*$/.test(runAttempt) || !version || !suite) {
    throw new Error('Incomplete release identity');
  }
  function call(name, params = [], pinned = false) {
    const result = invoke(name, params, pinned);
    if (result.status !== 0) throw new Error(name + ' did not execute successfully');
    let envelope;
    try { envelope = JSON.parse(result.stdout); } catch { throw new Error(name + ' returned no structured result'); }
    if (envelope?.error || !envelope?.response || typeof envelope.response !== 'object') {
      throw new Error(name + ' returned no execution evidence');
    }
    return envelope.response;
  }
  function match(actual, wanted) {
    for (const [key,value] of Object.entries(wanted)) {
      if (actual[key] !== value) throw new Error('Release evidence mismatch in ' + key);
    }
  }
  for (const pinned of [false,true]) match(call('readJanuReleaseBuild',[],pinned),{commitSha,runId,runAttempt});
  for (const [name,contract,pinned] of checks) match(call(name,[],pinned),{pass:true,contract});
  const receipt = call('recordDeploymentProvenance',[commitSha,runId,runAttempt,sourceHash,version,suite]);
  match(receipt,{...expected,outcome:'PASS'});
  if (!Number.isFinite(Date.parse(receipt.verifiedAt))) throw new Error('Missing release verification timestamp');
  match(call('readJanuDeploymentProvenance'),{...expected,outcome:'PASS',verifiedAt:receipt.verifiedAt});
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env=process.env;
  verifyRelease({commitSha:env.GITHUB_SHA,runId:env.GITHUB_RUN_ID,runAttempt:env.GITHUB_RUN_ATTEMPT,
    sourceHash:env.DEPLOYED_SOURCE_HASH,version:env.EXPECTED_VERSION,suite:env.EXPECTED_SUITE});
  console.log('Runtime checks and independent Worker State readback passed for ' + env.GITHUB_SHA);
}
