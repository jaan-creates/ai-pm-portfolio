function traceUpsertSpans_(sheet, spans) {
  const lock = LockService.getScriptLock();
  const acquiredHere = !lock.hasLock();
  if (acquiredHere && !lock.tryLock(1000)) throw new Error('Trace projection busy');
  try {
    const [headers, ...rows] = sheet.getDataRange().getValues();
    const owned = ['Trace ID','Group ID','Span ID','Parent Span ID','Stage','Type','Status','Started At','Ended At',
      'Duration ms','Attempt','Provider / Model','Input Ref','Output Ref','Error Class','Error Code','Cost USD',
      'Release','Git Commit','Verified Ref'];
    if (owned.some((name,i)=>headers[i]!==name)) throw new Error('Trace projection schema mismatch');
    const key = ids => JSON.stringify(ids);
    const locations = new Map();
    for (let i=0;i<rows.length;i++) {
      const ids=rows[i].slice(0,3);
      if (ids.every(Boolean)) {
        const k=key(ids);
        locations.set(k,locations.has(k) ? -1 : i+2);
      }
    }
    const pending=new Set();
    const changes=spans.map(span=>{
      const ids=owned.slice(0,3).map(k=>span[k]);
      const k=key(ids);
      if (!ids.every(Boolean) || pending.has(k) || locations.get(k)===-1) throw new Error('Ambiguous trace span identity');
      pending.add(k);
      return {row:locations.get(k),values:owned.map(name=>span[name] ?? '')};
    });
    let next=sheet.getLastRow()+1;
    for (const change of changes) sheet.getRange(change.row || next++,1,1,owned.length).setValues([change.values]);
    SpreadsheetApp.flush();
  } finally {
    if (acquiredHere) lock.releaseLock();
  }
}
