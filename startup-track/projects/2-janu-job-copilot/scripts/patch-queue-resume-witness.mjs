import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2];
if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8'),marker='P04-RESUME-WORKER-WITNESS-001';
let source=original;
if(!source.includes(marker)){
  if(!source.includes('P04-SCORE-WORKER-WITNESS-001'))throw new Error('Score witness patch required first');
  const replacements=[
    ['function workerResume_(appId,p){','function workerResumeOriginal_(appId,p){'],
    ["p04ScoreWitnessMatches_(job)?'MATCHED_SCORE_OUTPUT':'NO_MATCHING_COMPLETION_RECEIPT'", "p04ScoreWitnessMatches_(job)?'MATCHED_SCORE_OUTPUT':typeof p04ResumeWitnessMatches_==='function'&&p04ResumeWitnessMatches_(job)?'MATCHED_RESUME_OUTPUT':'NO_MATCHING_COMPLETION_RECEIPT'"],
    ["'MATCHED_JD_CLOSED','MATCHED_SCORE_OUTPUT'].includes(check.proof)","'MATCHED_JD_CLOSED','MATCHED_SCORE_OUTPUT','MATCHED_RESUME_OUTPUT'].includes(check.proof)"],
    ["if(check.proof==='MATCHED_SCORE_OUTPUT'&&!p04ScoreWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_SCORE_WITNESS_CHANGED_DURING_RECONCILIATION');","if(check.proof==='MATCHED_SCORE_OUTPUT'&&!p04ScoreWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_SCORE_WITNESS_CHANGED_DURING_RECONCILIATION');if(check.proof==='MATCHED_RESUME_OUTPUT'&&!p04ResumeWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_RESUME_WITNESS_CHANGED_DURING_RECONCILIATION');"],
    ["check.proof==='MATCHED_SCORE_OUTPUT'?'RECOVERED_FROM_SCORE_WITNESS':'RECOVERED_FROM_COMPLETION_RECEIPT'","check.proof==='MATCHED_SCORE_OUTPUT'?'RECOVERED_FROM_SCORE_WITNESS':check.proof==='MATCHED_RESUME_OUTPUT'?'RECOVERED_FROM_RESUME_WITNESS':'RECOVERED_FROM_COMPLETION_RECEIPT'"],
    ["check.proof==='MATCHED_SCORE_OUTPUT'?'P04-SCORE-WORKER-WITNESS-001: complete map, new gaps, score flag and resume admission independently read back; no replay':'P04-QUEUE-COMPLETION-RECEIPT-001: matching durable worker-return receipt independently read back; no replay'","check.proof==='MATCHED_SCORE_OUTPUT'?'P04-SCORE-WORKER-WITNESS-001: complete map, new gaps, score flag and resume admission independently read back; no replay':check.proof==='MATCHED_RESUME_OUTPUT'?'P04-RESUME-WORKER-WITNESS-001: persisted source, rendered resume, pack, registry, application and cost independently read back; no replay':'P04-QUEUE-COMPLETION-RECEIPT-001: matching durable worker-return receipt independently read back; no replay'"],
  ];
  for(const [before,after] of replacements){if(source.split(before).length-1!==1)throw new Error('Resume witness anchor not unique: '+before.slice(0,90));source=source.replace(before,after);}
  source+=String.raw`
/* P04-RESUME-WORKER-WITNESS-001: completed exact-attempt resume output, never an orphan artifact. */
function workerResume_(appId,p){const out=workerResumeOriginal_(appId,p);if(p&&p.qid)p04RecordResumeWitness_(appId,p);return out;}
function p04ResumeOutputHash_(appId,qid,attempt,version,docId,packId,artifactId){
  const ar=find_(JC.S.A,appId),rr=activeResumeRegistryRow_(appId,version),cs=SH_(JC.S.COST),as=SH_(JC.S.A),rs=SH_(JC.S.RR),arts=SH_(P12.SHEETS.ART);
  if(!ar||!rr||!version||!docId||!packId||!artifactId)return'';
  const a=obj_(as,ar),reg=obj_(rs,rr);
  if(String(a['Decision'])!=='Apply'||String(a['Status'])!=='QA'||String(a['Resume Version ID'])!==String(version)||String(a['ATS QA Status'])!=='Not Started'||String(a['Resume Review Decision'])!=='Not Ready'||String(a['Submission Ready?'])!=='No'||String(a['Tailored Resume Link'])!==String(reg['Editable Resume Link'])||String(a['Application Pack Link'])!==String(DriveApp.getFileById(packId).getUrl())||fileId_(a['Tailored Resume Link'])!==String(docId)||String(reg['Resume Version ID'])!==String(version)||String(reg['Application ID'])!==String(appId)||String(reg['QA Status'])!=='Pending'||String(reg['Review Decision'])!=='Not Ready'||String(reg['PDF Resume Link']||'')!=='')return'';
  const map=mapFor_(appId),ev=docText_(JC.IDS.EV),input=map?resumeInputHash_(appId,map,ev):'';
  if(!input)return'';
  let artifactRow=null;for(let r=2;r<=arts.getLastRow();r++){const o=obj_(arts,r);if(String(o['Application ID'])===String(appId)&&String(o['Resume Version ID'])===String(version)&&String(o['Artifact Type'])==='ResumeDocument'&&String(o['Drive File ID'])===String(artifactId)&&String(o['Input Hash'])===String(input)&&String(o['Status'])==='Ready'){if(artifactRow)return'';artifactRow=o;}}
  if(!artifactRow)return'';
  const raw=DriveApp.getFileById(artifactId).getBlob().getDataAsString(),sourceDoc=JSON.parse(raw);
  if(String(artifactRow['Content Hash'])!==String(hash_(raw))||!sourceDoc||typeof sourceDoc!=='object')return'';
  const rendered=DocumentApp.openById(docId).getBody().getText(),pack=DocumentApp.openById(packId).getBody().getText();
  if(!rendered||!pack||internalEvidenceLeak_(rendered)||internalEvidenceLeak_(pack))return'';
  let costRow=null;for(let r=2;r<=cs.getLastRow();r++){const o=obj_(cs,r);if(String(o['Queue Job ID'])!==String(qid)||String(o['Worker'])!=='RESUME_GENERATE'||String(o['Task'])!=='RENDER_REUSE')continue;if(costRow)return'';costRow=o;}
  if(!costRow||String(costRow['Application ID'])!==String(appId)||Number(costRow['Attempt'])!==Number(attempt))return'';
  return hash_(JSON.stringify([as.getRange(ar,1,1,as.getLastColumn()).getValues()[0],rs.getRange(rr,1,1,rs.getLastColumn()).getValues()[0],artifactRow,hash_(raw),hash_(rendered),hash_(pack),costRow,docId,packId,artifactId,input]));
}
function p04RecordResumeWitness_(appId,p){const id=String(p&&p.qid||''),attempt=Number(p&&p.attempt||0),s=SH_(JC.S.Q),m=hm_(s),f=id&&s.getLastRow()>1?s.getRange(2,m['Queue Job ID'],s.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext():null;if(!f||!attempt)throw new Error('P04_RESUME_WITNESS_QUEUE_MISSING');const job=s.getRange(f.getRow(),1,1,16).getValues()[0];if(String(job[1])!==String(appId)||String(job[2])!=='RESUME_GENERATE'||String(job[3])!=='running'||Number(job[6])!==attempt)throw new Error('P04_RESUME_WITNESS_QUEUE_MISMATCH');const ar=find_(JC.S.A,appId),a=ar?obj_(SH_(JC.S.A),ar):{},version=String(a['Resume Version ID']||''),docId=fileId_(a['Tailored Resume Link']||''),packId=fileId_(a['Application Pack Link']||'');const arts=SH_(P12.SHEETS.ART);let artifactId='';for(let r=2;r<=arts.getLastRow();r++){const o=obj_(arts,r);if(String(o['Application ID'])===String(appId)&&String(o['Resume Version ID'])===version&&String(o['Artifact Type'])==='ResumeDocument'){if(artifactId)throw new Error('P04_RESUME_WITNESS_AMBIGUOUS_SOURCE');artifactId=String(o['Drive File ID']||'');}}const outputHash=p04ResumeOutputHash_(appId,id,attempt,version,docId,packId,artifactId);if(!outputHash)throw new Error('P04_RESUME_WITNESS_OUTPUT_MISSING');const witness={contract:'P04-RESUME-WORKER-WITNESS-001',queueJobId:id,applicationId:String(appId),workerType:'RESUME_GENERATE',inputHash:String(job[4]||''),idempotencyKey:String(job[5]||''),attempt:attempt,startedAt:new Date(job[9]).toISOString(),version:version,docId:docId,packId:packId,artifactId:artifactId,outputHash:outputHash},key='p04_resume_witness_'+id,encoded=JSON.stringify(witness);upsertWorkerState_(key,encoded,'Persisted source, rendered resume, pack, registry, application and cost independently read back');if(rendererWorkerStateValue_(key)!==encoded)throw new Error('P04_RESUME_WITNESS_READBACK');return witness;}
function p04ResumeWitnessMatches_(job){if(String(job[2]||'')!=='RESUME_GENERATE')return false;let w=null,started='';try{w=JSON.parse(rendererWorkerStateValue_('p04_resume_witness_'+String(job[0]||''))||'null');started=new Date(job[9]).toISOString();}catch(e){return false;}if(!w||w.contract!=='P04-RESUME-WORKER-WITNESS-001'||w.queueJobId!==String(job[0]||'')||w.applicationId!==String(job[1]||'')||w.workerType!==String(job[2]||'')||w.inputHash!==String(job[4]||'')||w.idempotencyKey!==String(job[5]||'')||w.attempt!==Number(job[6]||0)||w.startedAt!==started)return false;try{const current=p04ResumeOutputHash_(String(job[1]||''),String(job[0]||''),Number(job[6]||0),w.version,w.docId,w.packId,w.artifactId);return !!current&&current===w.outputHash;}catch(e){return false;}}
`;
}
if(source!==original)fs.writeFileSync(file,source);
console.log(JSON.stringify({changed:source!==original,contract:marker}));
