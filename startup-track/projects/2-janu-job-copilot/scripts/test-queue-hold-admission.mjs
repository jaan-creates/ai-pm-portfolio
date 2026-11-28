import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const directory = process.argv[2];
if (!directory) throw new Error('Assembled private source directory required');
const source = fs.readFileSync(`${directory}/TrackerWorkflow.js`, 'utf8');
function sourceFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing ${name}`);
  const end = source.indexOf('\n', start);
  return source.slice(start, end < 0 ? undefined : end);
}

test('recovery hold blocks continuation and owned admission with original job ID', () => {
  const headers = ['Queue Job ID', 'Application ID', 'Worker Type', 'Status', 'Input Hash'];
  const rows = [headers, ['Q-held', 'APP-1', 'RESUME_GENERATE', 'recovery_hold', 'input-1']];
  const sheet = {
    getLastRow: () => rows.length,
    getDataRange: () => ({getValues: () => rows}),
    getRange: (row, col) => ({getDisplayValue: () => String(rows[row - 1]?.[col - 1] ?? '')}),
  };
  let admissions = 0;
  const context = vm.createContext({
    JC: {S: {Q: 'Queue'}}, SH_: () => sheet,
    hm_: () => Object.fromEntries(headers.map((header, index) => [header, index + 1])),
    enqueue_: () => { admissions++; return 'Q-duplicate'; },
  });
  for (const name of ['p1aQueueWorkerState_', 'ownedFindQueueAdmission_', 'ownedEnsureQueueAdmission_']) {
    vm.runInContext(sourceFunction(name), context);
  }
  const state = context.p1aQueueWorkerState_('APP-1', 'RESUME_GENERATE');
  assert.equal(state.state, 'ACTIVE');
  assert.equal(state.status, 'recovery_hold');
  assert.equal(state.jobId, 'Q-held');
  assert.equal(context.ownedFindQueueAdmission_('APP-1', 'RESUME_GENERATE', 'input-1').queueJobId, 'Q-held');
  assert.equal(context.ownedFindQueueAdmission_('APP-2', 'RESUME_GENERATE', 'input-1'), null);
  const owned = context.ownedEnsureQueueAdmission_('APP-1', 'RESUME_GENERATE', {}, 'input-1', {});
  assert.equal(owned.reused, true);
  assert.equal(owned.queueJobId, 'Q-held');
  assert.equal(admissions, 0);
  rows[1][3] = 'queued';
  assert.equal(context.p1aQueueWorkerState_('APP-1', 'RESUME_GENERATE').state, 'ACTIVE');
  rows[1][3] = 'succeeded';
  assert.equal(context.p1aQueueWorkerState_('APP-1', 'RESUME_GENERATE').state, 'SUCCEEDED');
  rows[1][3] = 'recovery_hold';
});

test('JD score recovery treats a held attempt as active', () => {
  const context = vm.createContext({
    JC: {S: {A: 'Applications', MAP: 'Map', SCORE: 'JD_PARSE_SCORE_MAP'}},
    rendererWorkerStateValue_: () => 'APP-1', find_: () => 2, SH_: () => ({}),
    obj_: () => ({'Application ID': 'APP-1'}), has_: () => false,
    jdScoreLatestQueueAttempt_: () => ({status: 'recovery_hold', queueJobId: 'Q-held'}),
    upsertWorkerState_: () => {},
  });
  vm.runInContext(sourceFunction('jdScoreAdmissionRecoveryTick_'), context);
  const result = context.jdScoreAdmissionRecoveryTick_();
  assert.equal(result.status, 'ACTIVE');
  assert.equal(result.queueJobId, 'Q-held');
});
