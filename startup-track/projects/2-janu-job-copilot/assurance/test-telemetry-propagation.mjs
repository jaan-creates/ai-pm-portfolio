import assert from 'node:assert/strict';

const required = [
  'telemetry_schema_version','event_id','event_type','trace_id','span_id',
  'group_id','release_version','occurred_at','recorded_at','evidence_ref'
];
const valid = (events) => {
  if (!events.length) return false;
  const trace = events[0].trace_id, group = events[0].group_id, release = events[0].release_version;
  return events.every((e) =>
    required.every((k) => e[k]) &&
    e.trace_id === trace &&
    e.group_id === group &&
    e.release_version === release &&
    !Number.isNaN(Date.parse(e.occurred_at)) &&
    !Number.isNaN(Date.parse(e.recorded_at))
  );
};
const events = [
  {telemetry_schema_version:'1',event_id:'e1',event_type:'orchestration.started',trace_id:'t1',span_id:'s1',group_id:'g1',release_version:'r1',occurred_at:'2026-10-13T04:00:00Z',recorded_at:'2026-10-13T04:00:01Z',evidence_ref:'queue:q1'},
  {telemetry_schema_version:'1',event_id:'e2',event_type:'persisted',trace_id:'t1',span_id:'s2',group_id:'g1',release_version:'r1',occurred_at:'2026-10-13T04:00:02Z',recorded_at:'2026-10-13T04:00:03Z',evidence_ref:'sheet:row-1'}
];
assert.equal(valid(events), true);
assert.equal(valid(events.map((e,i)=>i ? {...e,trace_id:'other'} : e)), false);
assert.equal(valid(events.map((e,i)=>i ? {...e,recorded_at:''} : e)), false);
assert.equal(valid(events.map((e,i)=>i ? {...e,release_version:'old'} : e)), false);
console.log(JSON.stringify({
  status:'PASS',
  contract:'JANU-TELEMETRY-CROSS-BOUNDARY-1',
  checks:4,
  negative_controls_detected:3,
  evidence_boundary:'synthetic event propagation contract; no live worker/storage propagation'
}));