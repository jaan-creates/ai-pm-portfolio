function assertRetryEligible_(application, worker, input) {
  const sheet=SH_(JC.S.Q);
  const [headers,...rows]=sheet.getDataRange().getValues();
  const fields=['Application ID','Worker Type','Input Hash','Status','Error Code','Error Detail'];
  const columns=fields.map(name=>headers.indexOf(name));
  if(columns.includes(-1))throw new Error('QUEUE_QUARANTINE_SCHEMA_INCOMPLETE');
  const [appCol,workerCol,hashCol,stateCol,codeCol,detailCol]=columns;
  for(let i=rows.length-1;i>=0;i--){
    const row=rows[i];
    if(String(row[appCol])!==String(application)||String(row[workerCol])!==String(worker)||String(row[hashCol])!==String(input))continue;
    const state=String(row[stateCol]).toLowerCase();
    if(state==='succeeded')return;
    const code=String(row[codeCol]||''),detail=String(row[detailCol]||'');
    if(state==='failed'&&(code==='CODE_OR_SCHEMA'||/DETERMINISTIC:(?:P1A_JD_PERSISTENCE_OR_COMPLETENESS_FAILED|RENDER_CAREBREAK_(?:CANONICAL_MISSING|EXACT3))\b/.test(detail)))throw new Error('DETERMINISTIC:UNCHANGED_INPUT_QUARANTINED');
  }
}
