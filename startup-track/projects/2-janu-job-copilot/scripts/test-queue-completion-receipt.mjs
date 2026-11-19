import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const directory = process.argv[2];
if (!directory) throw new Error('Assembled private source directory required');
const source = fs.readFileSync(`${directory}/TrackerWorkflow.js`, 'utf8');
function functionText(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing ${name}`);
  const end = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, end < 0 ? undefined : end);
}
function harness() {
  const headers = ['Queue Job ID', 'Application ID', 'Worker Type', 'Status', 'Input Hash', 'Idempotency Key', 'Attempts', 'Max Attempts', 'Next Run At', 'Started At', 'Finished At', 'Error Code', 'Error Detail', 'Payload Ref', 'Created At', 'Updated At'];
  const rows = [headers, ['Q-1', 'APP-1', 'PDF_CAPTURE', 'queued', 'input-hash', 'idem-1', 0, 3, new Date(0), '', '', '', '', JSON.stringify({fileId: 'F-1'}), new Date(0), new Date(0)]];
  const receipts = new Map();
  let workerCalls = 0, failSuccessWrite = false, failReceiptWrite = false, lockHeld = false;
  const sheet = {
    getLastRow: () => rows.length,
    getRange: (row, col) => ({
      getValues: () => [rows[row - 1].slice(col - 1, col === 1 ? 16 : col)],
      getValue: () => rows[row - 1][col - 1],
      getDisplayValue: () => String(rows[row - 1][col - 1] ?? ''),
      setValue: value => {if (col === 4 && value === 'succeeded' && failSuccessWrite) {failSuccessWrite = false; throw Error('completion status write lost');} rows[row - 1][col - 1] = value;},
      clearContent: () => {rows[row - 1][col - 1] = ''; rows[row - 1][col] = '';},
      createTextFinder: id => ({matchEntireCell: () => ({findNext: () => rows.findIndex((x, index) => index > 0 && x[col - 1] === id) > 0 ? {getRow: () => 2} : null})}),
    }),
  };
  const lock = {tryLock: () => {if (lockHeld) return false; lockHeld = true; return true;}, releaseLock: () => {lockHeld = false;}};
  const context = vm.createContext({
    JC: {S: {Q: 'Queue'}, W: {PDF: 'PDF_CAPTURE'}, RETRIES: 3}, P12: {MAX_JOB_RUNTIME_MS: 100000},
    SH_: () => sheet, hm_: () => Object.fromEntries(headers.map((h, i) => [h, i + 1])),
    now_: () => new Date(100000), hash_: () => 'result-hash',
    circuitOpen_: () => false, rendererCanarySemanticFreshOverride_: () => false,
    queueJobFresh_: () => true, rendererQuarantineBlocks_: () => false,
    workerPDF_: () => {workerCalls++; return {fileId: 'F-1'};},
    workerJD_: () => {}, workerScore_: () => {}, workerCompany_: () => {}, workerContacts_: () => {},
    workerResume_: () => {}, workerArtifactMigrate_: () => {}, workerQA_: () => {},
    upsertWorkerState_: (key, value) => {if (failReceiptWrite) {failReceiptWrite = false; throw Error('worker state outage');} receipts.set(key, value);},
    rendererWorkerStateValue_: key => receipts.get(key) || '',
    closeCircuit_: () => {}, classifyError_: () => ({kind: 'TRANSIENT', code: 'TRANSIENT_WRITE'}),
    p04TrackedScriptLock_: () => lock,
  });
  for (const name of ['p04RunQCore_', 'p04CompletionReceiptMatches_', 'inspectRecoveryHeldQueueJob', 'reconcileRecoveryHeldQueueJob']) vm.runInContext(functionText(name), context);
  return {context, rows, receipts, get calls() {return workerCalls;}, failNextSuccessWrite() {failSuccessWrite = true;}, failNextReceiptWrite() {failReceiptWrite = true;}, holdLock() {lockHeld = true;}, releaseLock() {lockHeld = false;}};
}

test('post-worker completion-write failure closes only from matching durable receipt', () => {
  const h = harness();
  h.failNextSuccessWrite();
  assert.throws(() => h.context.p04RunQCore_(2), /completion status write lost/);
  assert.equal(h.rows[1][3], 'recovery_hold');
  assert.equal(h.calls, 1);
  assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof, 'MATCHED_WORKER_RETURN');
  const result = h.context.reconcileRecoveryHeldQueueJob('Q-1');
  assert.equal(result.status, 'succeeded');
  assert.equal(result.replayed, false);
  assert.equal(h.calls, 1);
  assert.equal(h.rows[1][11], 'RECOVERED_FROM_COMPLETION_RECEIPT');
});

test('no receipt, changed identity and competing lock leave held work untouched', () => {
  const h = harness();
  h.rows[1][3] = 'recovery_hold'; h.rows[1][6] = 1; h.rows[1][9] = new Date(100000);
  assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-1').proof, 'NO_MATCHING_COMPLETION_RECEIPT');
  assert.equal(h.rows[1][3], 'recovery_hold');
  h.receipts.set('p04_queue_completion_Q-1', JSON.stringify({contract: 'P04-QUEUE-COMPLETION-RECEIPT-001', queueJobId: 'Q-1', applicationId: 'OTHER', workerType: 'PDF_CAPTURE', inputHash: 'input-hash', idempotencyKey: 'idem-1', attempt: 1, startedAt: new Date(100000).toISOString(), resultHash: 'hash'}));
  assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-1').proof, 'NO_MATCHING_COMPLETION_RECEIPT');
  h.holdLock(); assert.throws(() => h.context.reconcileRecoveryHeldQueueJob('Q-1'), /recovery lock/); h.releaseLock();
  assert.equal(h.calls, 0);
  assert.equal(h.rows[1][3], 'recovery_hold');
});

test('receipt-store outage holds completed worker without replay or false success', () => {
  const h = harness();
  h.failNextReceiptWrite();
  assert.throws(() => h.context.p04RunQCore_(2), /worker state outage/);
  assert.equal(h.rows[1][3], 'recovery_hold');
  assert.equal(h.calls, 1);
  assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-1').proof, 'NO_MATCHING_COMPLETION_RECEIPT');
  assert.equal(h.rows[1][3], 'recovery_hold');
  assert.equal(h.calls, 1);
});
