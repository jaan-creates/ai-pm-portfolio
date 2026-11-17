import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createJdWorker as run} from '../assurance/jd-worker-fixture.mjs';

for(const coverage of [.95,95,'95%']) test('persisted JD completeness '+coverage,()=>{
  const h=run({coverage});assert.equal(h.invoke().status,'RECOVERED');assert.equal(h.fixture.jobs.length,1);
});
test('existing artifact follows the same percentage contract',()=>assert.equal(run({existing:true}).invoke().status,'EXISTING_ARTIFACT'));
for(const opts of [{persists:false},{coverage:0.5},{coverage:'bad'},{coverage:105}]) test('reject incomplete readback '+JSON.stringify(opts),()=>{
  const h=run(opts);assert.throws(h.invoke,/PERSISTENCE_OR_COMPLETENESS/);assert.equal(h.fixture.jobs.length,0);
});
for(const existing of [true,false]) test('reject empty score admission; existing='+existing,()=>{
  const h=run({admit:false,existing,coverage:95});assert.throws(h.invoke,/SCORE_ADMISSION/);
  assert.ok(!h.fixture.states.includes('PASS'));assert.equal(h.fixture.writes.length,0);
});
