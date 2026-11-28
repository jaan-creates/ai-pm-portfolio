import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../runtime/trace-projection.js',import.meta.url),'utf8');
const header=['Trace ID','Group ID','Span ID','Parent Span ID','Stage','Type','Status','Started At','Ended At','Duration ms','Attempt','Provider / Model','Input Ref','Output Ref','Error Class','Error Code','Cost USD','Release','Git Commit','Verified Ref','Human Eval','Human Note'];
function harness(){
  const rows=[header,['other','g','s','unchanged'],['mine','g','s',...Array(17).fill(''),'approved','keep']];
  const lock={held:false,hasLock(){return this.held;},tryLock(){this.held=true;return true;},releaseLock(){this.held=false;}};
  const sheet={dropWrites:false,getDataRange:()=>({getValues:()=>rows}),getLastRow:()=>rows.length,getRange:(r,c,h,w)=>({
    getValues:()=>[rows[r-1].slice(c-1,c-1+w)],
    setValues([v]){if(!sheet.dropWrites)(rows[r-1]??=[]).splice(0,v.length,...v);}
  })};
  const ctx=vm.createContext({LockService:{getScriptLock:()=>lock},SpreadsheetApp:{flush(){}}});vm.runInContext(code,ctx);
  return {rows,lock,sheet,run:spans=>ctx.traceUpsertSpans_(sheet,spans)};
}
test('preserves other journeys, annotations and existing lock ownership',()=>{
  const h=harness();h.lock.held=true;
  const span={'Trace ID':'mine','Group ID':'g','Span ID':'s','Status':'succeeded'};
  h.run([span,{...span,'Span ID':'s2'}]);h.run([span]);
  assert.deepEqual(h.rows[1],['other','g','s','unchanged']);assert.equal(h.rows.length,4);
  assert.equal(h.rows[2][6],'succeeded');assert.deepEqual(h.rows[2].slice(20),['approved','keep']);assert.equal(h.lock.held,true);
});
test('duplicate identity and competing writer leave the sheet untouched',()=>{
  const h=harness();const before=JSON.stringify(h.rows);
  const s={'Trace ID':'mine','Group ID':'g','Span ID':'s'};assert.throws(()=>h.run([s,s]),/Ambiguous/);assert.equal(JSON.stringify(h.rows),before);
  h.lock.tryLock=()=>false;assert.throws(()=>h.run([s]),/busy/);assert.equal(JSON.stringify(h.rows),before);
});
test('a lost write fails independent row readback and releases the acquired lock',()=>{
  const h=harness();h.sheet.dropWrites=true;
  assert.throws(()=>h.run([{'Trace ID':'mine','Group ID':'g','Span ID':'s','Status':'succeeded'}]),/readback mismatch/);
  assert.equal(h.lock.held,false);
});
