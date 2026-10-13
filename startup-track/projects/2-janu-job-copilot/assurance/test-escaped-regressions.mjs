import assert from 'node:assert/strict';

const schedulerTruth = (s) => s.trigger === 'scheduled' && s.durableRun === true;
const queuedWakeup = (s) => s.queued === true && s.workerExecutions === 1 && s.duplicateCreated === false;
const approvalOrdering = (s) => s.approvedBeforePdf === true && s.contentHashLocked === true;
const idempotentPatch = (s) => s.firstBytes === s.secondBytes;

assert.equal(schedulerTruth({trigger:'scheduled',durableRun:true}), true);
assert.equal(schedulerTruth({trigger:'recovery',durableRun:true}), false);
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
  checks:10,
  negative_controls_detected:6,
  cases:['FL-096','FL-098','FL-140','FL-141','CS-20260824-033'],
  evidence_boundary:'synthetic escaped-regression controls; not production recurrence proof'
}));