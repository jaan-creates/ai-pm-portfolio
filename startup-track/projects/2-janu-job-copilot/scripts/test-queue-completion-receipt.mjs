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
  const properties = new Map();
  let workerCalls = 0, failSuccessWrite = false, failReceiptWrite = false, lockHeld = false, budgetFailure = false, budgetErrorMessage = 'transient budget precheck', workerThrows = false, workerErrorKind = 'TRANSIENT', workerErrorMessage = 'worker failed after side effect', circuitOpened = false, queueFresh = true, clockMs = 100000;
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
    JC: {S: {Q: 'Queue'}, W: {PDF: 'PDF_CAPTURE', CT: 'CONTACT_ENRICH'}, RETRIES: 3}, P12: {MAX_JOB_RUNTIME_MS: 100000},
    SH_: () => sheet, hm_: () => Object.fromEntries(headers.map((h, i) => [h, i + 1])),
    now_: () => new Date(clockMs), hash_: value => 'hash:' + String(value),
    P_: () => ({getProperty: key => properties.get(key) || '', setProperty: (key, value) => properties.set(key, value)}),
    circuitOpen_: () => circuitOpened, rendererCanarySemanticFreshOverride_: () => false,
    queueJobFresh_: () => queueFresh, rendererQuarantineBlocks_: () => false,
    parseDateish_: value => new Date(value),
    workerPDF_: () => {workerCalls++; if (workerThrows) throw Error(workerErrorMessage); return {fileId: 'F-1'};},
    workerJD_: () => {}, workerScore_: () => {}, workerCompany_: () => {}, workerContacts_: () => {},
    workerResume_: () => {}, workerArtifactMigrate_: () => {}, workerQA_: () => {},
    budgetGuard_: () => {if (budgetFailure) throw Error(budgetErrorMessage);},
    backoffAt_: () => new Date(clockMs + 100000), find_: () => null,
    upsertWorkerState_: (key, value) => {if (failReceiptWrite && key.startsWith('p04_queue_completion_')) {failReceiptWrite = false; throw Error('worker state outage');} receipts.set(key, value);},
    rendererWorkerStateValue_: key => receipts.get(key) || '',
    p04CompanyWitnessMatches_: () => false,
    p04JdExistingWitnessMatches_: () => false,
    p04JdRecoveredWitnessMatches_: () => false,
    p04JdClosedWitnessMatches_: () => false,
    p04ScoreWitnessMatches_: () => false,
    closeCircuit_: () => {circuitOpened = false;}, openCircuit_: () => {circuitOpened = true;}, classifyError_: () => ({kind: workerErrorKind, code: workerErrorKind + '_WRITE'}),
    p04TrackedScriptLock_: () => lock,
  });
  for (const name of ['p04RunQCore_', 'p04CompletionReceiptMatches_', 'p04RecordContactWitness_', 'p04ContactWitnessMatches_', 'inspectRecoveryHeldQueueJob', 'reconcileRecoveryHeldQueueJob', 'workerContacts_', 'staleLeaseDecision_', 'recoverStaleQueueLeases_']) vm.runInContext(functionText(name), context);
  return {context, rows, receipts, properties, get calls() {return workerCalls;}, get circuitOpen() {return circuitOpened;}, restoreDependency() {circuitOpened = false;}, openDependencyCircuit() {circuitOpened = true;}, setFresh(value) {queueFresh = value;}, failNextSuccessWrite() {failSuccessWrite = true;}, failNextReceiptWrite() {failReceiptWrite = true;}, failBudgetPrecheck(message = 'transient budget precheck') {budgetFailure = true; budgetErrorMessage = message;}, failWorkerAs(kind, message = 'worker failed after side effect') {workerThrows = true; workerErrorKind = kind; workerErrorMessage = message;}, useRealClassifier() {vm.runInContext(functionText('classifyError_'), context);}, advanceClock(ms) {clockMs += ms;}, holdLock() {lockHeld = true;}, releaseLock() {lockHeld = false;}};
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

test('user-classified exception after worker entry holds without a receipt or replay', () => {
  const h = harness();
  h.failWorkerAs('USER');
  assert.throws(() => h.context.p04RunQCore_(2), /worker failed after side effect/);
  assert.equal(h.rows[1][3], 'recovery_hold');
  assert.equal(h.rows[1][11], 'WORKER_OUTCOME_UNKNOWN');
  assert.equal(h.receipts.size, 0);
  assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof, 'NO_MATCHING_COMPLETION_RECEIPT');
  assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-1').status, 'recovery_hold');
  assert.equal(h.context.p04RunQCore_(2), 0);
  assert.equal(h.calls, 1);
});

test('dependency outage after worker entry opens circuit and recovery never replays an unproved hold', () => {
  const h = harness();
  h.failWorkerAs('GLOBAL');
  assert.throws(() => h.context.p04RunQCore_(2), /worker failed after side effect/);
  assert.equal(h.circuitOpen, true);
  assert.equal(h.rows[1][3], 'recovery_hold');
  assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof, 'NO_MATCHING_COMPLETION_RECEIPT');
  h.restoreDependency();
  assert.equal(h.context.p04RunQCore_(2), 0);
  assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-1').status, 'recovery_hold');
  assert.equal(h.calls, 1);
});

test('disabled contact output witness closes a lost-receipt hold without replay', () => {
  const h = harness();
  h.rows[1][2] = 'CONTACT_ENRICH';
  h.failNextReceiptWrite();
  assert.throws(() => h.context.p04RunQCore_(2), /worker state outage/);
  assert.equal(h.rows[1][3], 'recovery_hold');
  assert.equal(h.properties.get('DONE_CT_APP-1'), '1');
  assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof, 'MATCHED_CONTACT_DISABLED');
  const result = h.context.reconcileRecoveryHeldQueueJob('Q-1');
  assert.equal(result.status, 'succeeded');
  assert.equal(result.proof, 'MATCHED_CONTACT_DISABLED');
  assert.equal(result.replayed, false);
  assert.equal(h.rows[1][11], 'RECOVERED_FROM_CONTACT_WITNESS');
});

test('contact witness rejects changed attempt, input and completion flag', () => {
  const h = harness();
  h.rows[1][2] = 'CONTACT_ENRICH';
  h.failNextReceiptWrite();
  assert.throws(() => h.context.p04RunQCore_(2), /worker state outage/);
  const key = 'p04_contact_witness_Q-1';
  const saved = h.receipts.get(key);
  h.receipts.set(key, JSON.stringify({...JSON.parse(saved), attempt: 99}));
  assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof, 'NO_MATCHING_COMPLETION_RECEIPT');
  h.receipts.set(key, saved); h.rows[1][4] = 'other-input';
  assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof, 'NO_MATCHING_COMPLETION_RECEIPT');
  h.rows[1][4] = 'input-hash'; h.properties.delete('DONE_CT_APP-1');
  assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof, 'NO_MATCHING_COMPLETION_RECEIPT');
  h.properties.set('DONE_CT_APP-1', '1'); h.properties.set('ENABLE_CONTACT_ENRICH', '1');
  assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof, 'NO_MATCHING_COMPLETION_RECEIPT');
  assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-1').status, 'recovery_hold');
});

test('enabled contact path has no disabled-output witness', () => {
  const h = harness();
  h.rows[1][2] = 'CONTACT_ENRICH';
  h.properties.set('ENABLE_CONTACT_ENRICH', '1');
  assert.throws(() => h.context.p04RunQCore_(2), /CONTACT_PROVIDER_NOT_CONFIGURED/);
  assert.equal(h.rows[1][3], 'recovery_hold');
  assert.equal(h.receipts.has('p04_contact_witness_Q-1'), false);
  assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof, 'NO_MATCHING_COMPLETION_RECEIPT');
});

test('contact output changed after inspection cannot be reconciled', () => {
  const h = harness();
  h.rows[1][2] = 'CONTACT_ENRICH';
  h.failNextReceiptWrite();
  assert.throws(() => h.context.p04RunQCore_(2), /worker state outage/);
  const inspect = h.context.inspectRecoveryHeldQueueJob;
  h.context.inspectRecoveryHeldQueueJob = id => {
    const result = inspect(id);
    h.properties.delete('DONE_CT_APP-1');
    return result;
  };
  assert.throws(() => h.context.reconcileRecoveryHeldQueueJob('Q-1'), /WITNESS_CHANGED_DURING_RECONCILIATION/);
  assert.equal(h.rows[1][3], 'recovery_hold');
});

test('pre-worker transient failure retries only when due and stops at maximum attempts', () => {
  const h = harness();
  h.rows[1][2] = 'JD_PARSE_SCORE_MAP'; h.failBudgetPrecheck();
  assert.throws(() => h.context.p04RunQCore_(2), /transient budget precheck/);
  assert.equal(h.rows[1][3], 'queued'); assert.equal(h.rows[1][6], 1);
  assert.equal(h.context.p04RunQCore_(2), 0);
  h.advanceClock(100000);
  assert.throws(() => h.context.p04RunQCore_(2), /transient budget precheck/);
  assert.equal(h.rows[1][6], 2);
  h.advanceClock(100000);
  assert.throws(() => h.context.p04RunQCore_(2), /transient budget precheck/);
  assert.equal(h.rows[1][6], 3); assert.equal(h.rows[1][3], 'failed');
  assert.equal(h.calls, 0); assert.equal(h.receipts.size, 0);
});

test('post-worker timeout, rate limit, quota and deterministic faults remain held after dependency restoration', () => {
  for (const [message, expectedCode, opensCircuit] of [
    ['provider timed out after write', 'TRANSIENT_PROVIDER', false],
    ['OpenAI 429: rate limit', 'TRANSIENT_PROVIDER', false],
    ['OpenAI 429: insufficient_quota', 'PROVIDER_ACCOUNT', true],
    ['DETERMINISTIC:bad output schema', 'CODE_OR_SCHEMA', false],
  ]) {
    const h = harness();
    h.useRealClassifier();
    h.failWorkerAs('unused', message);
    assert.throws(() => h.context.p04RunQCore_(2), /./, message);
    assert.equal(h.rows[1][3], 'recovery_hold', message);
    assert.equal(h.rows[1][11], 'WORKER_OUTCOME_UNKNOWN', message);
    assert.match(String(h.rows[1][12]), new RegExp(expectedCode), message);
    assert.equal(h.circuitOpen, opensCircuit, message);
    h.restoreDependency();
    h.advanceClock(600000);
    assert.equal(h.context.p04RunQCore_(2), 0, message);
    assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-1').status, 'recovery_hold', message);
    assert.equal(h.calls, 1, message);
  }
});

test('pre-worker rate limit backs off, while global outage stops admission and opens circuit', () => {
  const rate = harness();
  rate.useRealClassifier();
  rate.rows[1][2] = 'JD_PARSE_SCORE_MAP';
  rate.failBudgetPrecheck('OpenAI 429: rate limit');
  assert.throws(() => rate.context.p04RunQCore_(2), /rate limit/);
  assert.equal(rate.rows[1][3], 'queued');
  assert.equal(rate.rows[1][6], 1);
  assert.equal(rate.context.p04RunQCore_(2), 0);
  assert.equal(rate.calls, 0);
  rate.advanceClock(100000);
  assert.throws(() => rate.context.p04RunQCore_(2), /rate limit/);
  assert.equal(rate.rows[1][6], 2);

  const quota = harness();
  quota.useRealClassifier();
  quota.rows[1][2] = 'JD_PARSE_SCORE_MAP';
  quota.failBudgetPrecheck('OpenAI 429: insufficient_quota');
  assert.throws(() => quota.context.p04RunQCore_(2), /insufficient_quota/);
  assert.equal(quota.rows[1][3], 'failed');
  assert.equal(quota.circuitOpen, true);
  assert.equal(quota.calls, 0);
  quota.rows[1][3] = 'queued';
  assert.throws(() => quota.context.p04RunQCore_(2), /WORKER_RUNTIME_CIRCUIT_OPEN/);
  assert.equal(quota.rows[1][6], 1);
  assert.equal(quota.calls, 0);
});

test('completion receipt requires exact attempt and job identity before closing an outage hold', () => {
  const h = harness();
  h.failNextSuccessWrite();
  assert.throws(() => h.context.p04RunQCore_(2), /completion status write lost/);
  const key = 'p04_queue_completion_Q-1';
  const receipt = JSON.parse(h.receipts.get(key));
  for (const changed of [{attempt: receipt.attempt + 1}, {idempotencyKey: 'other-key'}, {resultHash: ''}]) {
    h.receipts.set(key, JSON.stringify({...receipt, ...changed}));
    assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof, 'NO_MATCHING_COMPLETION_RECEIPT');
    assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-1').status, 'recovery_hold');
    assert.equal(h.calls, 1);
  }
  h.receipts.set(key, JSON.stringify(receipt));
  assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-1').status, 'succeeded');
  assert.equal(h.calls, 1);
});

test('expired running lease stays held at retry limit or when current work became stale', () => {
  for (const [attempt, fresh] of [[3, true], [1, false]]) {
    const h = harness();
    h.rows[1][3] = 'running';
    h.rows[1][6] = attempt;
    h.rows[1][9] = new Date(0);
    h.setFresh(fresh);
    h.advanceClock(1000000);
    const result = h.context.recoverStaleQueueLeases_();
    assert.equal(result.held, 1);
    assert.equal(result.cancelled, 0);
    assert.equal(h.rows[1][3], 'recovery_hold');
    assert.equal(h.rows[1][11], 'STALE_LEASE_OUTCOME_UNKNOWN');
    assert.equal(h.context.p04RunQCore_(2), 0);
    assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-1').status, 'recovery_hold');
    assert.equal(h.calls, 0);
  }
});
