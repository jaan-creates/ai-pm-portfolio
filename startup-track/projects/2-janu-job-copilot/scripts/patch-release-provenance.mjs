import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || '.janu-live';
const files = fs.readdirSync(root).filter(f => f.endsWith('.gs') || f.endsWith('.js'));
const target = files.find(f => {
  const text = fs.readFileSync(path.join(root, f), 'utf8');
  return text.includes('function verifyReleaseIdentity()') && text.includes('const P12') && text.includes('function upsertWorkerState_(');
});

if (!target) throw new Error('TrackerWorkflow source with release/state anchors not found');

const file = path.join(root, target);
let source = fs.readFileSync(file, 'utf8');
const before = source;
const anchor = 'function verifyReleaseIdentity()';

const block = `function releaseProvenanceValidate_(commitSha,runId,runAttempt,sourceHash,version,suite){
  const commit=String(commitSha||'').trim().toLowerCase();
  const run=String(runId||'').trim();
  const attempt=String(runAttempt||'').trim();
  const hash=String(sourceHash||'').trim().toLowerCase();
  const v=String(version||'').trim();
  const s=String(suite||'').trim();
  if(!/^[a-f0-9]{40}$/.test(commit))throw new Error('RELEASE_PROVENANCE_INVALID_COMMIT');
  if(!/^\\d+$/.test(run))throw new Error('RELEASE_PROVENANCE_INVALID_RUN_ID');
  if(!/^\\d+$/.test(attempt))throw new Error('RELEASE_PROVENANCE_INVALID_RUN_ATTEMPT');
  if(!/^[a-f0-9]{64}$/.test(hash))throw new Error('RELEASE_PROVENANCE_INVALID_SOURCE_HASH');
  if(v!==String(P12.VERSION))throw new Error('RELEASE_PROVENANCE_VERSION_MISMATCH');
  if(s!==String(P12.SUITE))throw new Error('RELEASE_PROVENANCE_SUITE_MISMATCH');
  return{commitSha:commit,runId:run,runAttempt:attempt,sourceHash:hash,version:v,suite:s};
}
function releaseProvenanceContractSelfTest_(){
  const ok=releaseProvenanceValidate_('0123456789abcdef0123456789abcdef01234567','123','1','0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',String(P12.VERSION),String(P12.SUITE));
  let badCommit=false,badHash=false,badVersion=false;
  try{releaseProvenanceValidate_('bad','123','1',ok.sourceHash,ok.version,ok.suite);}catch(e){badCommit=String(e&&e.message||e)==='RELEASE_PROVENANCE_INVALID_COMMIT';}
  try{releaseProvenanceValidate_(ok.commitSha,'123','1','bad',ok.version,ok.suite);}catch(e){badHash=String(e&&e.message||e)==='RELEASE_PROVENANCE_INVALID_SOURCE_HASH';}
  try{releaseProvenanceValidate_(ok.commitSha,'123','1',ok.sourceHash,'0.0.0',ok.suite);}catch(e){badVersion=String(e&&e.message||e)==='RELEASE_PROVENANCE_VERSION_MISMATCH';}
  const checks=[ok.commitSha.length===40,ok.sourceHash.length===64,badCommit,badHash,badVersion];
  if(checks.some(x=>!x))throw new Error('RELEASE_PROVENANCE_CONTRACT_FAILED '+JSON.stringify(checks));
  return{pass:true,total:checks.length,contract:'REL-PROV-1'};
}
function recordDeploymentProvenance(commitSha,runId,runAttempt,sourceHash,version,suite){
  const x=releaseProvenanceValidate_(commitSha,runId,runAttempt,sourceHash,version,suite);
  const verifiedAt=iso_();
  const evidence={outcome:'PASS',commitSha:x.commitSha,runId:x.runId,runAttempt:x.runAttempt,sourceHash:x.sourceHash,version:x.version,suite:x.suite,verifiedAt:verifiedAt};
  upsertWorkerState_('deployment_provenance_status','PASS',JSON.stringify(evidence));
  upsertWorkerState_('deployment_git_commit',x.commitSha,'Verified production deployment commit');
  upsertWorkerState_('deployment_github_run_id',x.runId,'GitHub Actions workflow run ID');
  upsertWorkerState_('deployment_github_run_attempt',x.runAttempt,'GitHub Actions workflow run attempt');
  upsertWorkerState_('deployment_source_sha256',x.sourceHash,'Post-push transformed source SHA-256');
  upsertWorkerState_('deployment_runtime_identity',x.version+' / '+x.suite,'Embedded runtime version / regression suite');
  upsertWorkerState_('deployment_verified_at',verifiedAt,'Release provenance persisted after post-push source-hash verification');
  return evidence;
}
function runReleaseProvenanceContractSelfTest(){
  const x=releaseProvenanceContractSelfTest_();
  upsertWorkerState_('release_provenance_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));
  upsertWorkerState_('release_provenance_contract_version','REL-PROV-1','Privacy-safe deployment identity writeback contract');
  return x;
}`;

if (!source.includes('function recordDeploymentProvenance(')) {
  const index = source.indexOf(anchor);
  if (index < 0) throw new Error('release identity anchor missing');
  source = source.slice(0, index) + block + '\n' + source.slice(index);
}

for (const token of [
  'function releaseProvenanceValidate_(',
  'function releaseProvenanceContractSelfTest_(',
  'function recordDeploymentProvenance(',
  'function runReleaseProvenanceContractSelfTest(',
  "'deployment_provenance_status'",
  "'deployment_git_commit'",
  "'deployment_source_sha256'",
  "'REL-PROV-1'"
]) {
  if (!source.includes(token)) throw new Error('release provenance patch missing ' + token);
}

if (source !== before) fs.writeFileSync(file, source);

console.log(JSON.stringify({
  status: 'PASS',
  file: target,
  changed: source !== before,
  contract: 'REL-PROV-1',
  writesSensitiveContent: false
}, null, 2));
