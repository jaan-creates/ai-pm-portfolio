import assert from 'node:assert/strict';

const eligibleForResume = (a) =>
  a.Decision === 'Apply' &&
  a.Status === 'Tailoring' &&
  !a['Resume Version ID'] &&
  String(a['Vacancy Status']).toUpperCase() !== 'CLOSED' &&
  (Number(a['JD Completeness %'] || 0) >= 70 || String(a['JD Snapshot Status'] || '').includes('Verified'));

const shouldEnqueue = (a, existing) =>
  eligibleForResume(a) &&
  !existing.some((q) =>
    q.applicationId === a['Application ID'] &&
    q.workerType === 'RESUME_GENERATE' &&
    ['queued','running','succeeded','retry_wait','pending'].includes(q.status)
  );

const eltropy = {
  'Application ID':'2026-08-19-002',
  Decision:'Apply',
  Status:'Tailoring',
  'Resume Version ID':'',
  'Vacancy Status':'UNKNOWN',
  'JD Snapshot Status':'Partial JD',
  'JD Completeness %':85,
  'Preparation Completeness':0.5,
  'Your Required Action':'No action'
};

assert.equal(eligibleForResume(eltropy), true);
assert.equal(shouldEnqueue(eltropy, []), true);
assert.equal(shouldEnqueue(eltropy, [{
  applicationId:'2026-08-19-002',
  workerType:'RESUME_GENERATE',
  status:'queued'
}]), false);
assert.equal(shouldEnqueue({...eltropy, 'JD Completeness %':50}, []), false);
assert.equal(shouldEnqueue({...eltropy, Status:'Resume Review'}, []), false);
assert.equal(shouldEnqueue({...eltropy, Decision:'Hold'}, []), false);
assert.equal(shouldEnqueue({...eltropy, 'Vacancy Status':'CLOSED'}, []), false);

console.log(JSON.stringify({
  status:'PASS',
  contract:'E2E-CONTINUATION-LIVE-ELTROPY-001',
  checks:7,
  evidence_boundary:'source-level deterministic admission regression; live worker/queue/artifact readback still required'
}));
