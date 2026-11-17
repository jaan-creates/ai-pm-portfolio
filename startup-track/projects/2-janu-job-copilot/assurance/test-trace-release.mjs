import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateTrace, scheduledCycleSummary, scheduledTriggerMatches} from './contract.mjs';
const root={telemetry_schema_version:'janu-trace-v1',event_id:'0',event_type:'started',trace_id:'t',span_id:'s',
  span_type:'orchestration',group_id:'g',workflow_name:'review',occurred_at:'2026-10-01T00:00:00Z',recorded_at:'2026-10-01T00:00:01Z',
  status:'success',release_version:'r1',evidence_ref:'ref:0'};
const child=(i,type)=>({...root,event_id:i,span_id:i,parent_span_id:'s',span_type:type,evidence_ref:'ref:'+i});
const events=[root,child('a','persistence'),child('b','verification')];
test('dated run labels match the configured schedule',()=>{
  const label='Daily PM Sourcing Worker — scheduled 08:45 cycle';
  assert.equal(scheduledTriggerMatches(label,'08:45'),true);
  assert.equal(scheduledTriggerMatches(label,'08:57'),false);
  assert.equal(scheduledTriggerMatches(label+' recovery','08:45'),false);
});
test('cross-release child cannot complete another build',()=>{
  assert.equal(validateTrace(events).status,'STRUCTURALLY_COMPLETE');
  assert.equal(validateTrace([root,events[1],{...events[2],release_version:'r2'}]).status,'INCOMPLETE');
});
test('exactly one scheduled execution may satisfy a slot',()=>{
  const slots=[{id:'slot',enabled:true}];
  const run={slot_id:'slot',trigger_type:'scheduled',status:'SUCCEEDED',verified_outcome_ref:'r1'};
  assert.equal(scheduledCycleSummary(slots,[run]).numerator,1);
  assert.equal(scheduledCycleSummary(slots,[run,{...run,verified_outcome_ref:'r2'}]).numerator,0);
  assert.equal(scheduledCycleSummary(slots,[{...run,trigger_type:'recovery'}]).numerator,0);
});
