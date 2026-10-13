import assert from 'node:assert/strict';

const schedulerTruth = (s) =>
  s.trigger === 'Daily PM Sourcing Worker — scheduled' &&
  s.durableRun === true &&
  (s.status === 'SUCCEEDED' || s.status === 'NOOP_TARGET_SATISFIED' || s.status === 'NOOP_ALL_DEDUPLICATED');

const queuedWakeup = (s) => s.queued === true && s.workerExecutions === 1 && s.duplicateCreated === false;
const approvalOrdering = (s) => s.approvedBeforePdf === true && s.contentHashLocked === true;
const idempotentPatch = (s) => s.firstBytes === s.secondBytes;

assert.equal(schedulerTruth({
  trigger:'Daily PM Sourcing Worker — scheduled',
  durableRun:true,
  status:'SUCCEEDED'
}), true);
assert.equal(schedulerTruth({trigger:'recovery',durableRun:true,status:'SUCCEEDED'}), false);
assert.equal(schedulerTruth({trigger:'manual',durableRun:true,status:'SUCCEEDED'}), false);
assert.equal(schedulerTruth({
  trigger:'Daily PM Sourcing Worker — scheduled',
  durableRun:false,
  status:'SUCCEEDED'
}), false);
assert.equal(schedulerTruth({
  trigger:'Daily PM Sourcing Worker — scheduled',
  durableRun:true,
  status:'FAILED'
}), false);

assert.equal(queuedWakeup({queued:true,workerExecutions:1,duplicateCreated:false}), true);
assert.equal(queuedWakeup({queued:true,workerExecutions:0,duplicateCreated:false}), false);
assert.equal(queuedWakeup({queued:true,workerExecutions:1,duplicateCreated:true}), false);
assert.equal(approvalOrdering({approvedBeforePdf:true,contentHashLocked:true}), true);
assert.equal(approvalOrdering({approvedBeforePdf:false,contentHashLocked:true}), false);
assert.equal(idempotentPatch({firstBytes:'x',secondBytes:'x'}), true);
assert.equal(idempotentPatch({firstBytes:'x',secondBytes:'xx'}), false);

console.log(JSON.stringify({
  status:'PASS',
  contract:'JANU-ESCAPED-REGRESSIONS-1',
  checks:12,
  negative_controls_detected:8,
  cases:['FL-096','FL-098','FL-140','FL-141','CS-20260824-033'],
  evidence_boundary:'synthetic escaped-regression controls; not production recurrence proof'
}));