function assertRetryEligible_(application, worker, input) {
  if (!['JD_RETRIEVE', 'RESUME_GENERATE'].includes(String(worker))) return;
  if (!input) return; // The base runtime derives an input key for legacy callers.
  const sheet = SH_(JC.S.Q);
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const fields = ['Application ID', 'Worker Type', 'Input Hash', 'Status', 'Error Detail'];
  const columns = fields.map(name => headers.indexOf(name));
  if (columns.includes(-1)) throw new Error('QUEUE_QUARANTINE_SCHEMA_INCOMPLETE');
  const [appCol, workerCol, hashCol, stateCol, detailCol] = columns;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (String(row[appCol]) !== String(application) || String(row[workerCol]) !== String(worker) ||
        String(row[hashCol]) !== String(input)) continue;
    const state = String(row[stateCol]).toLowerCase();
    if (state === 'succeeded') return;
    if (state === 'failed' && /DETERMINISTIC:(?:P1A_JD_PERSISTENCE_OR_COMPLETENESS_FAILED|RENDER_CAREERBREAK_(?:CANONICAL_MISSING|EXACT3))\b/.test(String(row[detailCol]))) {
      throw new Error('DETERMINISTIC:UNCHANGED_INPUT_QUARANTINED');
    }
  }
}
