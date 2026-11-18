import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createJdWorker as run} from '../assurance/jd-worker-fixture.mjs';

for(const coverage of [.95,95,'95%']) test('persisted JD completeness '+coverage,()=>{
  const h=run({coverage});assert.equal(h.invoke().status,'RECOVERED');assert.equal(h.fixture.jobs.length,1);
  assert.equal(h.fixture.artifact.completeness,95);assert.equal(h.fixture.application['JD Completeness %'],95);
  assert.equal(h.fixture.snapshot['Completeness %'],95);
  assert.equal(h.invoke().status,'EXISTING_ARTIFACT');assert.equal(h.fixture.jobs.length,1);
});
test('existing artifact follows the same percentage contract',()=>assert.equal(run({existing:true}).invoke().status,'EXISTING_ARTIFACT'));
for(const opts of [{persists:false},{coverage:0.5},{coverage:'bad'},{coverage:105}]) test('reject incomplete readback '+JSON.stringify(opts),()=>{
  const h=run(opts);assert.throws(h.invoke,/PERSISTENCE_OR_COMPLETENESS/);assert.equal(h.fixture.jobs.length,0);
});
for(const existing of [true,false]) test('reject empty score admission; existing='+existing,()=>{
  const h=run({admit:false,existing,coverage:95});assert.throws(h.invoke,/SCORE_ADMISSION/);
  assert.ok(!h.fixture.states.includes('PASS'));assert.equal(h.fixture.jobs.length,0);
});
for(const coverage of [null,true,[],{},'', '%','bad',-1,101,'101%','Infinity','0x5f'])test('invalid value rejected before saving '+String(coverage),()=>{
  const h=run({coverage});assert.throws(h.invoke,/PERSISTENCE_OR_COMPLETENESS/);
  assert.equal(h.fixture.artifact,null);assert.equal(h.fixture.jobs.length,0);assert.ok(!h.fixture.states.includes('PASS'));
});
for(const dropSheet of ['Applications','Snapshots'])test('lost '+dropSheet+' write blocks success',()=>{
  const h=run({dropSheet});assert.throws(h.invoke,/PERSISTENCE_OR_COMPLETENESS/);assert.equal(h.fixture.jobs.length,0);assert.ok(!h.fixture.states.includes('PASS'));
});
for(const coverage of [.95,95,'95%'])test('old artifact recovers Scoring and canonical percentage '+coverage,()=>{
  const h=run({existing:true,coverage});assert.equal(h.invoke().status,'EXISTING_ARTIFACT');
  assert.equal(h.fixture.application.Status,'Scoring');assert.equal(h.fixture.application['JD Completeness %'],95);
  assert.equal(h.invoke().queueJobId,'Q-1');assert.equal(h.fixture.jobs.length,1);
});
for(const status of ['Closed','Submitted','On Hold','Resume Review','Ready to Submit'])test('old artifact cannot revive '+status,()=>{
  const h=run({existing:true,status});assert.throws(h.invoke,/SCORE_ADMISSION/);assert.equal(h.fixture.writes.length,0);
});
test('inconsistent artifact rejected',()=>{const h=run({existing:true});h.fixture.artifact.completeness=80;assert.throws(h.invoke,/PERSISTENCE_OR_COMPLETENESS/);assert.equal(h.fixture.jobs.length,0);});
test('other parser callers also save a canonical percentage',()=>{const h=run({coverage:'95%'});h.context.parseSaveJD_('APP-1',{},'','');assert.equal(h.fixture.artifact.completeness,95);assert.equal(h.fixture.application.Status,'Scoring');});
for(const coverage of [70,.7,'70%'])test('inclusive scoring threshold '+coverage,()=>assert.equal(run({coverage}).invoke().completeness,70));
for(const coverage of [0,'1%',69.9,.699])test('below scoring threshold '+coverage,()=>{const h=run({coverage});assert.throws(h.invoke,/PERSISTENCE_OR_COMPLETENESS/);assert.equal(h.fixture.jobs.length,0);});
for(const dropSheet of ['Applications','Snapshots'])test('old-record normalization must survive readback '+dropSheet,()=>{
  const h=run({existing:true,dropSheet});assert.throws(h.invoke,/PERSISTENCE_OR_COMPLETENESS/);assert.equal(h.fixture.jobs.length,0);assert.ok(!h.fixture.states.includes('PASS'));
});
test('missing completeness is invalid',()=>assert.ok(Number.isNaN(run().context.jdCompletenessPercent_(undefined))));
