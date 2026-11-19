import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2];
if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8'),marker='P04-SCORE-WORKER-WITNESS-001';
let source=original;
if(!source.includes(marker)){
  if(!source.includes('P04-JD-CLOSED-WITNESS-001'))throw new Error('Closed-JD witness patch required first');
  const replacements=[
    ["function workerScore_(appId,p){const out=workerScoreOriginal_(appId,p);const admission=p1aScoreCompletionAdmission_(appId);upsertWorkerState_('p1a_score_completion_admission_last_result',admission.admitted?'PASS':'NO_ADMISSION',JSON.stringify(admission).slice(0,1500));return out;}",
     "function workerScore_(appId,p){const __p04GapStart=SH_('Skill Gaps').getLastRow();const out=workerScoreOriginal_(appId,p),__p04GapEnd=SH_('Skill Gaps').getLastRow();const admission=p1aScoreCompletionAdmission_(appId);upsertWorkerState_('p1a_score_completion_admission_last_result',admission.admitted?'PASS':'NO_ADMISSION',JSON.stringify(admission).slice(0,1500));if(p&&p.qid)p04RecordScoreWitness_(appId,p,admission,__p04GapStart,__p04GapEnd);return out;}"],
    ["p04JdClosedWitnessMatches_(job)?'MATCHED_JD_CLOSED':'NO_MATCHING_COMPLETION_RECEIPT'",
     "p04JdClosedWitnessMatches_(job)?'MATCHED_JD_CLOSED':p04ScoreWitnessMatches_(job)?'MATCHED_SCORE_OUTPUT':'NO_MATCHING_COMPLETION_RECEIPT'"],
    ["['MATCHED_WORKER_RETURN','MATCHED_CONTACT_DISABLED','MATCHED_COMPANY_OUTPUT','MATCHED_JD_EXISTING','MATCHED_JD_RECOVERED','MATCHED_JD_CLOSED'].includes(check.proof)",
     "['MATCHED_WORKER_RETURN','MATCHED_CONTACT_DISABLED','MATCHED_COMPANY_OUTPUT','MATCHED_JD_EXISTING','MATCHED_JD_RECOVERED','MATCHED_JD_CLOSED','MATCHED_SCORE_OUTPUT'].includes(check.proof)"],
    ["if(check.proof==='MATCHED_JD_CLOSED'&&!p04JdClosedWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_JD_CLOSED_WITNESS_CHANGED_DURING_RECONCILIATION');",
     "if(check.proof==='MATCHED_JD_CLOSED'&&!p04JdClosedWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_JD_CLOSED_WITNESS_CHANGED_DURING_RECONCILIATION');if(check.proof==='MATCHED_SCORE_OUTPUT'&&!p04ScoreWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_SCORE_WITNESS_CHANGED_DURING_RECONCILIATION');"],
    ["check.proof==='MATCHED_JD_CLOSED'?'RECOVERED_FROM_JD_CLOSED_WITNESS':'RECOVERED_FROM_COMPLETION_RECEIPT'",
     "check.proof==='MATCHED_JD_CLOSED'?'RECOVERED_FROM_JD_CLOSED_WITNESS':check.proof==='MATCHED_SCORE_OUTPUT'?'RECOVERED_FROM_SCORE_WITNESS':'RECOVERED_FROM_COMPLETION_RECEIPT'"],
    ["check.proof==='MATCHED_JD_CLOSED'?'P04-JD-CLOSED-WITNESS-001: closed vacancy evidence, application, action and cancelled queue independently read back; no replay':'P04-QUEUE-COMPLETION-RECEIPT-001: matching durable worker-return receipt independently read back; no replay'",
     "check.proof==='MATCHED_JD_CLOSED'?'P04-JD-CLOSED-WITNESS-001: closed vacancy evidence, application, action and cancelled queue independently read back; no replay':check.proof==='MATCHED_SCORE_OUTPUT'?'P04-SCORE-WORKER-WITNESS-001: complete map, new gaps, score flag and resume admission independently read back; no replay':'P04-QUEUE-COMPLETION-RECEIPT-001: matching durable worker-return receipt independently read back; no replay'"],
  ];
  for(const [before,after] of replacements){if(source.split(before).length-1!==1)throw new Error('Score witness anchor not unique: '+before.slice(0,90));source=source.replace(before,after);}
  source+=String.raw`
/* P04-SCORE-WORKER-WITNESS-001: exact-attempt complete map, new gaps, app score/flag and resume admission. */
function p04ScoreOutputHash_(appId,scoreQid,attempt,resumeQid,gapStart,gapEnd){
  if(P_().getProperty('MAP_READY_'+appId)!==JC.SCORING_VERSION)return'';
  const ar=find_(JC.S.A,appId),jd=loadJD_(appId),ms=SH_(JC.S.MAP),gs=SH_('Skill Gaps'),qs=SH_(JC.S.Q);
  if(!ar||!jd||!jd.parsed||!Array.isArray(jd.parsed.requirements)||!jd.parsed.requirements.length)return'';
  const as=SH_(JC.S.A),a=obj_(as,ar),score=Number(a['JD Fit Score']);
  if(String(a['Decision'])!=='Apply'||String(a['Status'])!=='Tailoring'||!Number.isFinite(score)||score<0||score>100)return'';
  const mr=hm_(ms),gr=hm_(gs);if(!mr['Application ID']||!mr['JD Requirement']||!mr['Evidence Strength']||!mr['Gap Type']||!gr['Application ID']||!gr['JD Requirement'])return'';
  const mapRows=[],mapObjs=[];for(let r=2;r<=ms.getLastRow();r++){const o=obj_(ms,r);if(String(o['Application ID'])!==String(appId))continue;mapRows.push(ms.getRange(r,1,1,ms.getLastColumn()).getValues()[0]);mapObjs.push(o);}
  const expected=jd.parsed.requirements.map(x=>String(x.text||'')).sort(),actual=mapObjs.map(x=>String(x['JD Requirement']||'')).sort();
  if(actual.length!==expected.length||JSON.stringify(actual)!==JSON.stringify(expected))return'';
  const start=Number(gapStart),end=Number(gapEnd);if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end<start||end>gs.getLastRow())return'';
  const gapRows=[],gapObjs=[];for(let r=start+1;r<=end;r++){const o=obj_(gs,r);if(String(o['Application ID'])!==String(appId))return'';gapRows.push(gs.getRange(r,1,1,gs.getLastColumn()).getValues()[0]);gapObjs.push(o);}
  const wanted=mapObjs.filter(x=>String(x['Gap Type'])!=='eligibility_gate'&&(['weak','missing'].includes(String(x['Evidence Strength']))||String(x['Gap Type']))).map(x=>String(x['JD Requirement']||'')).sort(),found=gapObjs.map(x=>String(x['JD Requirement']||'')).sort();
  if(JSON.stringify(wanted)!==JSON.stringify(found))return'';
  const qr=find_(JC.S.Q,resumeQid,'Queue Job ID');if(!qr)return'';const q=qs.getRange(qr,1,1,16).getValues()[0];
  if(String(q[0])!==String(resumeQid)||String(q[1])!==String(appId)||String(q[2])!=='RESUME_GENERATE'||!['queued','running','recovery_hold','succeeded'].includes(String(q[3])))return'';
  const cs=SH_(JC.S.COST),cr=find_(JC.S.COST,scoreQid,'Queue Job ID');if(!cr)return'';const cost=obj_(cs,cr);
  if(String(cost['Application ID'])!==String(appId)||String(cost['Worker'])!=='JD_PARSE_SCORE_MAP'||String(cost['Task'])!=='EVIDENCE_MAP'||String(cost['Queue Job ID'])!==String(scoreQid)||Number(cost['Attempt'])!==Number(attempt))return'';
  return hash_(JSON.stringify([jd.parsed,as.getRange(ar,1,1,as.getLastColumn()).getValues()[0],mapRows,gapRows,cs.getRange(cr,1,1,cs.getLastColumn()).getValues()[0],[q[0],q[1],q[2],q[4],q[5]],JC.SCORING_VERSION]));
}
function p04RecordScoreWitness_(appId,p,admission,gapStart,gapEnd){const id=String(p&&p.qid||''),attempt=Number(p&&p.attempt||0),resumeQid=String(admission&&admission.queueJobId||'');if(!id||!attempt||!admission||admission.admitted!==true||!resumeQid)throw new Error('P04_SCORE_WITNESS_ADMISSION_REQUIRED');const s=SH_(JC.S.Q),m=hm_(s),f=s.getLastRow()>1?s.getRange(2,m['Queue Job ID'],s.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext():null;if(!f)throw new Error('P04_SCORE_WITNESS_QUEUE_MISSING');const job=s.getRange(f.getRow(),1,1,16).getValues()[0];if(String(job[0])!==id||String(job[1])!==String(appId)||String(job[2])!=='JD_PARSE_SCORE_MAP'||String(job[3])!=='running'||Number(job[6])!==attempt)throw new Error('P04_SCORE_WITNESS_QUEUE_MISMATCH');const outputHash=p04ScoreOutputHash_(appId,id,attempt,resumeQid,gapStart,gapEnd);if(!outputHash)throw new Error('P04_SCORE_WITNESS_OUTPUT_MISSING');const witness={contract:'P04-SCORE-WORKER-WITNESS-001',queueJobId:id,applicationId:String(appId),workerType:'JD_PARSE_SCORE_MAP',inputHash:String(job[4]||''),idempotencyKey:String(job[5]||''),attempt:attempt,startedAt:new Date(job[9]).toISOString(),resumeQueueJobId:resumeQid,gapStart:Number(gapStart),gapEnd:Number(gapEnd),outputHash:outputHash},key='p04_score_witness_'+id,encoded=JSON.stringify(witness);upsertWorkerState_(key,encoded,'Complete map, new gaps, score flag and resume admission independently read back');if(rendererWorkerStateValue_(key)!==encoded)throw new Error('P04_SCORE_WITNESS_READBACK');return witness;}
function p04ScoreWitnessMatches_(job){if(String(job[2]||'')!=='JD_PARSE_SCORE_MAP')return false;let witness=null,started='';try{witness=JSON.parse(rendererWorkerStateValue_('p04_score_witness_'+String(job[0]||''))||'null');started=new Date(job[9]).toISOString();}catch(e){return false;}if(!witness||witness.contract!=='P04-SCORE-WORKER-WITNESS-001'||witness.queueJobId!==String(job[0]||'')||witness.applicationId!==String(job[1]||'')||witness.workerType!==String(job[2]||'')||witness.inputHash!==String(job[4]||'')||witness.idempotencyKey!==String(job[5]||'')||witness.attempt!==Number(job[6]||0)||witness.startedAt!==started)return false;const current=p04ScoreOutputHash_(String(job[1]||''),String(job[0]||''),Number(job[6]||0),String(witness.resumeQueueJobId||''),witness.gapStart,witness.gapEnd);return !!current&&current===witness.outputHash;}
`;
}
if(source!==original)fs.writeFileSync(file,source);
console.log(JSON.stringify({changed:source!==original,contract:marker}));
