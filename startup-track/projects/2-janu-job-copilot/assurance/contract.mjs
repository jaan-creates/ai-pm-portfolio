// JANU-ASSURANCE-1: a privacy-safe, dependency-free evidence contract.
// These functions validate observations; they do not replace runtime workers.
export const ASSURANCE_STATUSES=Object.freeze(['VERIFIED','PARTIALLY OBSERVABLE','NOT INSTRUMENTED','BLOCKED']);
export const EVENT_FIELDS=Object.freeze(['telemetry_schema_version','event_id','event_type','trace_id','span_id','group_id','workflow_name','occurred_at','recorded_at','status','release_version','evidence_ref']);
const forbidden=new Set(['prompt','response_body','resume_text','email_body','api_key','secret','candidate_content']);
const hasText=v=>typeof v==='string'&&v.trim().length>0;
const utc=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(s))return false;const ms=Date.parse(s);return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,19)===s.slice(0,19);};
export function validateEvent(e){
  if(!e||typeof e!=='object'||Array.isArray(e))return ['NOT_AN_OBJECT'];
  const faults=EVENT_FIELDS.filter(k=>!hasText(e[k])).map(k=>'MISSING:'+k);
  if(e.telemetry_schema_version!=='janu-trace-v1')faults.push('UNSUPPORTED_SCHEMA');
  if(!utc(e.occurred_at)||!utc(e.recorded_at))faults.push('INVALID_UTC_TIMESTAMP');
  if(utc(e.occurred_at)&&utc(e.recorded_at)&&Date.parse(e.recorded_at)<Date.parse(e.occurred_at))faults.push('RECORDING_BEFORE_OCCURRENCE');
  if(!hasText(e.span_type))faults.push('MISSING_SPAN_TYPE');
  if(e.span_type!=='orchestration'&&!hasText(e.parent_span_id))faults.push('MISSING_PARENT_SPAN');
  if(e.attempt!==undefined&&(!Number.isInteger(e.attempt)||e.attempt<1))faults.push('INVALID_ATTEMPT');
  for(const key of Object.keys(e))if(forbidden.has(key.toLowerCase()))faults.push('SENSITIVE_FIELD:'+key);
  return [...new Set(faults)];
}
export function validateTrace(events){
  if(!Array.isArray(events)||!events.length)return {status:'INCOMPLETE',assurance:'BLOCKED',errors:['NO_EVENTS']};
  const errors=[],spans=new Set(),eventIds=new Set(),traceIds=new Set(),roots=new Set(),spanParents=new Map(),groups=new Set();
  for(const e of events){
    for(const issue of validateEvent(e))errors.push((e?.event_id||'<missing>')+':'+issue);
    if(e?.event_id){if(eventIds.has(e.event_id))errors.push('DUPLICATE_EVENT_ID:'+e.event_id);eventIds.add(e.event_id);}
    if(e?.span_id){
      spans.add(e.span_id);
      if(e.parent_span_id===null||e.parent_span_id===undefined||e.parent_span_id==='')roots.add(e.span_id);
      const parent=e.parent_span_id||null;
      if(spanParents.has(e.span_id)&&spanParents.get(e.span_id)!==parent)errors.push('SPAN_PARENT_CONFLICT:'+e.span_id);
      spanParents.set(e.span_id,parent);
    }
    if(e?.group_id)groups.add(e.group_id);
    if(e?.trace_id)traceIds.add(e.trace_id);
  }
  if(traceIds.size!==1)errors.push('MULTIPLE_TRACE_IDS');
  if(groups.size!==1)errors.push('MULTIPLE_GROUP_IDS');
  if(roots.size!==1)errors.push('MISSING_OR_MULTIPLE_ROOT_SPANS');
  for(const span of spans){let current=span;const visited=new Set();while(current&&spans.has(current)){if(visited.has(current)){errors.push('CYCLIC_OR_DISCONNECTED_SPAN:'+span);break;}visited.add(current);current=spanParents.get(current)||null;}}
  for(const e of events)if(!e?.parent_span_id&&e?.span_type!=='orchestration')errors.push('ROOT_NOT_ORCHESTRATION:'+e.span_id);
  for(const e of events)if(e?.parent_span_id&&!spans.has(e.parent_span_id))errors.push('ORPHAN_PARENT:'+e.span_id);
  if(!events.some(e=>e.span_type==='verification'&&hasText(e.evidence_ref)))errors.push('MISSING_VERIFIED_OUTCOME');
  if(!events.some(e=>e.span_type==='persistence'&&hasText(e.evidence_ref)))errors.push('MISSING_PERSISTENCE');
  return {status:errors.length?'INCOMPLETE':'STRUCTURALLY_COMPLETE',assurance:'PARTIALLY OBSERVABLE',business_outcome_verified:false,errors:[...new Set(errors)],events:events.length};
}
export function stateConsistencySummary(rows){
  const result={checked:0,ok:0,pending:0,invalid:0,unknown:0};
  for(const row of rows){
    const s=String(row??'').trim();
    if(!s)continue;
    result.checked++;
    if(s==='OK')result.ok++;
    else if(s==='Not Started')result.pending++;
    else if(/^(ERROR|INVALID|FAIL|INCONSISTENT)(?:\b|:|_)/i.test(s))result.invalid++;
    else result.unknown++;
  }
  return {...result,assurance:'PARTIALLY OBSERVABLE',invariant_evidence_verified:false}; // Label classification alone cannot verify state invariants.
}
export function scheduledCycleSummary(expectedSlots,runs){
  if(!Array.isArray(expectedSlots)||!Array.isArray(runs))throw new TypeError('slots and runs required');
  const valid=expectedSlots.filter(s=>s.enabled&&!s.approved_suspension);
  let succeeded=0,missing=0;
  for(const slot of valid){
    // Recovery/manual success cannot satisfy an expected scheduled slot.
    const matched=runs.some(r=>r.slot_id===slot.id&&r.trigger_type==='scheduled'&&r.status==='SUCCEEDED'&&hasText(r.verified_outcome_ref));
    if(matched)succeeded++;else missing++;
  }
  return {numerator:succeeded,denominator:valid.length,missing,rate:valid.length?succeeded/valid.length:null,assurance:valid.length?'PARTIALLY OBSERVABLE':'NOT INSTRUMENTED'};
}
export function evidenceChain(links){
  const required=['approved_contract','source_version','execution','durable_state','independent_readback','regression','decision'];
  const missing=required.filter(k=>!links||!hasText(links[k]));
  return {status:missing.length?'INCOMPLETE':'READY_FOR_REVIEW',missing};
}


// Validate metric *definitions*, never claim measured outcomes or approve baselines.
export function validateMetricDictionary(registry){
  if(!registry||registry.schema!=='janu-metric-dictionary-v1')return ['UNSUPPORTED_METRIC_SCHEMA'];
  if(!Array.isArray(registry.definitions)||!registry.definitions.length)return ['MISSING_METRIC_DEFINITIONS'];
  const errors=[],seen=new Set();
  const required=['metric_id','definition_version','business_question','numerator','denominator','unit_of_analysis','inclusion_criteria','exclusion_criteria','evidence_sources','evidence_version','missing_data','minimum_sample','owner','freshness_slo','assurance_status'];
  for(const [index,metric] of registry.definitions.entries()){
    if(!metric||typeof metric!=='object'||Array.isArray(metric)){errors.push('INVALID_DEFINITION:'+index);continue;}
    for(const field of required)if(!hasText(metric[field]))errors.push('MISSING_METRIC_FIELD:'+index+':'+field);
    if(hasText(metric.metric_id)){if(seen.has(metric.metric_id))errors.push('DUPLICATE_METRIC_ID:'+metric.metric_id);seen.add(metric.metric_id);}
    if(!Array.isArray(metric.observation_windows)||!metric.observation_windows.length||metric.observation_windows.some(x=>!hasText(x)))errors.push('MISSING_OBSERVATION_WINDOW:'+index);
    if(!ASSURANCE_STATUSES.includes(metric.assurance_status))errors.push('INVALID_ASSURANCE_STATUS:'+index);
    if(!Object.hasOwn(metric,'baseline')||!Object.hasOwn(metric,'target'))errors.push('MISSING_BASELINE_TARGET_FIELDS:'+index);
    if(String(registry.approval_status||'').toUpperCase().startsWith('DRAFT')&&(metric.baseline!==null||metric.target!==null))errors.push('UNAPPROVED_NUMERICAL_BASELINE:'+index);
  }
  return errors;
}
