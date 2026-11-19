import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2];
if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8'),marker='P04-MIGRATION-WORKER-WITNESS-001';
let source=original;
if(!source.includes(marker)){
  if(!source.includes('P04-RESUME-WORKER-WITNESS-001'))throw new Error('Resume witness patch required first');
  const replacements=[
    ['function workerArtifactMigrate_(appId,p){','function workerArtifactMigrateOriginal_(appId,p){'],
    ["p04ResumeWitnessMatches_(job)?'MATCHED_RESUME_OUTPUT':'NO_MATCHING_COMPLETION_RECEIPT'","p04ResumeWitnessMatches_(job)?'MATCHED_RESUME_OUTPUT':typeof p04MigrationWitnessMatches_==='function'&&p04MigrationWitnessMatches_(job)?'MATCHED_MIGRATION_OUTPUT':'NO_MATCHING_COMPLETION_RECEIPT'"],
    ["'MATCHED_SCORE_OUTPUT','MATCHED_RESUME_OUTPUT'].includes(check.proof)","'MATCHED_SCORE_OUTPUT','MATCHED_RESUME_OUTPUT','MATCHED_MIGRATION_OUTPUT'].includes(check.proof)"],
    ["if(check.proof==='MATCHED_RESUME_OUTPUT'&&!p04ResumeWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_RESUME_WITNESS_CHANGED_DURING_RECONCILIATION');","if(check.proof==='MATCHED_RESUME_OUTPUT'&&!p04ResumeWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_RESUME_WITNESS_CHANGED_DURING_RECONCILIATION');if(check.proof==='MATCHED_MIGRATION_OUTPUT'&&!p04MigrationWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_MIGRATION_WITNESS_CHANGED_DURING_RECONCILIATION');"],
    ["check.proof==='MATCHED_RESUME_OUTPUT'?'RECOVERED_FROM_RESUME_WITNESS':'RECOVERED_FROM_COMPLETION_RECEIPT'","check.proof==='MATCHED_RESUME_OUTPUT'?'RECOVERED_FROM_RESUME_WITNESS':check.proof==='MATCHED_MIGRATION_OUTPUT'?'RECOVERED_FROM_MIGRATION_WITNESS':'RECOVERED_FROM_COMPLETION_RECEIPT'"],
    ["check.proof==='MATCHED_RESUME_OUTPUT'?'P04-RESUME-WORKER-WITNESS-001: persisted source, rendered resume, pack, registry, application and cost independently read back; no replay':'P04-QUEUE-COMPLETION-RECEIPT-001: matching durable worker-return receipt independently read back; no replay'","check.proof==='MATCHED_RESUME_OUTPUT'?'P04-RESUME-WORKER-WITNESS-001: persisted source, rendered resume, pack, registry, application and cost independently read back; no replay':check.proof==='MATCHED_MIGRATION_OUTPUT'?'P04-MIGRATION-WORKER-WITNESS-001: preimage, clean Docs, QA reset and audit independently read back; no replay':'P04-QUEUE-COMPLETION-RECEIPT-001: matching durable worker-return receipt independently read back; no replay'"],
  ];
  for(const [before,after] of replacements){if(source.split(before).length-1!==1)throw new Error('Migration witness anchor not unique: '+before.slice(0,90));source=source.replace(before,after);}
  source+=String.raw`
/* P04-MIGRATION-WORKER-WITNESS-001: protect submitted artifacts and prove full cleanup after a dirty preimage. */
function p04MigrationPreimage_(appId){
  const ar=find_(JC.S.A,appId);if(!ar)throw new Error('DETERMINISTIC:P04_MIGRATION_APPLICATION_MISSING');
  const as=SH_(JC.S.A),a=obj_(as,ar),version=String(a['Resume Version ID']||''),rr=activeResumeRegistryRow_(appId,version);
  if(String(a['Decision'])!=='Apply'||['Closed','On Hold','Submitted','Rejected','Offer'].includes(String(a['Status']))||!version||!rr)throw new Error('DETERMINISTIC:P04_MIGRATION_PROTECTED_STATE');
  const rs=SH_(JC.S.RR),reg=obj_(rs,rr);
  if(String(reg['Application ID'])!==String(appId)||String(reg['Resume Version ID'])!==version||String(reg['Immutable After Submission?'])==='Yes'||String(reg['Used to Apply?'])==='Yes')throw new Error('DETERMINISTIC:P04_MIGRATION_IMMUTABLE_VERSION');
  const docId=fileId_(a['Tailored Resume Link']||''),packId=fileId_(a['Application Pack Link']||'');if(!docId)throw new Error('DETERMINISTIC:P04_MIGRATION_DOC_MISSING');
  const doc=DocumentApp.openById(docId).getBody().getText(),pack=packId?DocumentApp.openById(packId).getBody().getText():'';
  if(!internalEvidenceLeak_(doc)&&!internalEvidenceLeak_(pack))throw new Error('DETERMINISTIC:P04_MIGRATION_NOT_DIRTY');
  return{version:version,docId:docId,packId:packId,preimageHash:hash_(JSON.stringify([as.getRange(ar,1,1,as.getLastColumn()).getValues()[0],rs.getRange(rr,1,1,rs.getLastColumn()).getValues()[0],doc,pack])),auditStart:SH_(JC.S.AUD).getLastRow()};
}
function workerArtifactMigrate_(appId,p){const before=p04MigrationPreimage_(appId),out=workerArtifactMigrateOriginal_(appId,p);if(p&&p.qid)p04RecordMigrationWitness_(appId,p,before);return out;}
function p04MigrationOutputHash_(appId,before){
  const ar=find_(JC.S.A,appId),rr=activeResumeRegistryRow_(appId,before.version);if(!ar||!rr)return'';
  const as=SH_(JC.S.A),rs=SH_(JC.S.RR),a=obj_(as,ar),reg=obj_(rs,rr);
  if(String(a['Decision'])!=='Apply'||String(a['Status'])!=='QA'||String(a['Resume Version ID'])!==before.version||fileId_(a['Tailored Resume Link'])!==before.docId||fileId_(a['Application Pack Link']||'')!==before.packId||String(a['ATS QA Status'])!=='Not Started'||String(a['Resume Review Decision'])!=='Not Ready'||String(a['Submission Ready?'])!=='No'||String(reg['Application ID'])!==String(appId)||String(reg['Resume Version ID'])!==before.version||String(reg['PDF Resume Link']||'')!==''||String(reg['QA Status'])!=='Pending'||String(reg['Review Decision'])!=='Not Ready'||String(reg['Immutable After Submission?'])==='Yes'||String(reg['Used to Apply?'])==='Yes')return'';
  const doc=DocumentApp.openById(before.docId).getBody().getText(),pack=before.packId?DocumentApp.openById(before.packId).getBody().getText():'';
  if(!doc||internalEvidenceLeak_(doc)||internalEvidenceLeak_(pack))return'';
  if(before.packId&&(!pack.includes('Submission PDF: Pending candidate approval')||!pack.includes('Editable resume: '+String(a['Tailored Resume Link']))))return'';
  const aud=SH_(JC.S.AUD),auditRows=[];for(let r=Number(before.auditStart)+1;r<=aud.getLastRow();r++){const row=aud.getRange(r,1,1,aud.getLastColumn()).getValues()[0];if(String(row[1])===String(appId)&&String(row[2])==='Resume'&&String(row[3])==='Artifact Migration'&&String(row[5])==='Sanitized editable resume')auditRows.push(row);}
  if(!auditRows.length)return'';
  return hash_(JSON.stringify([as.getRange(ar,1,1,as.getLastColumn()).getValues()[0],rs.getRange(rr,1,1,rs.getLastColumn()).getValues()[0],hash_(doc),hash_(pack),auditRows,before.preimageHash,before.version,before.docId,before.packId]));
}
function p04RecordMigrationWitness_(appId,p,before){const id=String(p&&p.qid||''),attempt=Number(p&&p.attempt||0),s=SH_(JC.S.Q),m=hm_(s),f=id&&s.getLastRow()>1?s.getRange(2,m['Queue Job ID'],s.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext():null;if(!f||!attempt)throw new Error('P04_MIGRATION_WITNESS_QUEUE_MISSING');const job=s.getRange(f.getRow(),1,1,16).getValues()[0];if(String(job[1])!==String(appId)||String(job[2])!=='ARTIFACT_MIGRATE'||String(job[3])!=='running'||Number(job[6])!==attempt)throw new Error('P04_MIGRATION_WITNESS_QUEUE_MISMATCH');const outputHash=p04MigrationOutputHash_(appId,before);if(!outputHash)throw new Error('P04_MIGRATION_WITNESS_OUTPUT_MISSING');const witness={contract:'P04-MIGRATION-WORKER-WITNESS-001',queueJobId:id,applicationId:String(appId),workerType:'ARTIFACT_MIGRATE',inputHash:String(job[4]||''),idempotencyKey:String(job[5]||''),attempt:attempt,startedAt:new Date(job[9]).toISOString(),version:before.version,docId:before.docId,packId:before.packId,preimageHash:before.preimageHash,auditStart:before.auditStart,outputHash:outputHash},key='p04_migration_witness_'+id,encoded=JSON.stringify(witness);upsertWorkerState_(key,encoded,'Dirty preimage, clean Docs, QA reset and audit independently read back');if(rendererWorkerStateValue_(key)!==encoded)throw new Error('P04_MIGRATION_WITNESS_READBACK');return witness;}
function p04MigrationWitnessMatches_(job){if(String(job[2]||'')!=='ARTIFACT_MIGRATE')return false;let w=null,started='';try{w=JSON.parse(rendererWorkerStateValue_('p04_migration_witness_'+String(job[0]||''))||'null');started=new Date(job[9]).toISOString();}catch(e){return false;}if(!w||w.contract!=='P04-MIGRATION-WORKER-WITNESS-001'||w.queueJobId!==String(job[0]||'')||w.applicationId!==String(job[1]||'')||w.workerType!==String(job[2]||'')||w.inputHash!==String(job[4]||'')||w.idempotencyKey!==String(job[5]||'')||w.attempt!==Number(job[6]||0)||w.startedAt!==started||!w.preimageHash)return false;try{const current=p04MigrationOutputHash_(String(job[1]||''),w);return !!current&&current===w.outputHash;}catch(e){return false;}}
`;
}
if(source!==original)fs.writeFileSync(file,source);
console.log(JSON.stringify({changed:source!==original,contract:marker}));
