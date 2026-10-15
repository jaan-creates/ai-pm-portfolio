import assert from 'node:assert/strict';

const recurringTaskIsSafe = (task) =>
  task.enabled === true &&
  task.repeat === true &&
  task.endRepeat === 'never' &&
  task.autoDisabledAfterCompletion !== true &&
  typeof task.nextEligibleSlot === 'string' &&
  !Number.isNaN(Date.parse(task.nextEligibleSlot));

const active = {
  enabled: true,
  repeat: true,
  endRepeat: 'never',
  autoDisabledAfterCompletion: false,
  nextEligibleSlot: '2026-10-16T08:57:00+05:30'
};

assert.equal(recurringTaskIsSafe(active), true);
assert.equal(recurringTaskIsSafe({...active, enabled: false}), false);
assert.equal(recurringTaskIsSafe({...active, autoDisabledAfterCompletion: true}), false);
assert.equal(recurringTaskIsSafe({...active, endRepeat: '2026-12-31'}), false);
assert.equal(recurringTaskIsSafe({...active, nextEligibleSlot: ''}), false);

console.log(JSON.stringify({
  status: 'PASS',
  contract: 'JANU-SOURCING-TASK-CONTINUITY-1',
  checks: 5,
  negative_controls_detected: 4,
  evidence_boundary: 'synthetic task-state contract; live automation state and scheduled recurrence remain unverified'
}));