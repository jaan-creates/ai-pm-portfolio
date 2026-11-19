import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2];
if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8'),marker='P04-JD-EXISTING-WITNESS-001';
let source=original;
if(!source.includes(marker)){
  if(!source.includes('P04-COMPANY-WORKER-WITNESS-001'))throw new Error('Company witness patch required first');
  const replacements=[
    ["upsertWorkerState_('p1a_jd_last_result','PASS',JSON.stringify({applicationId:appId,mode:'EXISTING_ARTIFACT',queueJobId:q}));\n    return{status:'EXISTING_ARTIFACT',queueJobId:q};",
     "upsertWorkerState_('p1a_jd_last_result','PASS',JSON.stringify({applicationId:appId,mode:'EXISTING_ARTIFACT',queueJobId:q}));\n    if(p&&p.qid)p04RecordJdExistingWitness_(appId,p,q);\n    return{status:'EXISTING_ARTIFACT',queueJobId:q};"],
    ["p04CompanyWitnessMatches_(job)?'MATCHED_COMPANY_OUTPUT':'NO_MATCHING_COMPLETION_RECEIPT'",
     "p04CompanyWitnessMatches_(job)?'MATCHED_COMPANY_OUTPUT':p04JdExistingWitnessMatches_(job)?'MATCHED_JD_EXISTING':'NO_MATCHING_COMPLETION_RECEIPT'"],
    ["['MATCHED_WORKER_RETURN','MATCHED_CONTACT_DISABLED','MATCHED_COMPANY_OUTPUT'].includes(check.proof)",
     "['MATCHED_WORKER_RETURN','MATCHED_CONTACT_DISABLED','MATCHED_COMPANY_OUTPUT','MATCHED_JD_EXISTING'].includes(check.proof)"],
    ["if(check.proof==='MATCHED_COMPANY_OUTPUT'&&!p04CompanyWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_COMPANY_WITNESS_CHANGED_DURING_RECONCILIATION');",
     "if(check.proof==='MATCHED_COMPANY_OUTPUT'&&!p04CompanyWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_COMPANY_WITNESS_CHANGED_DURING_RECONCILIATION');if(check.proof==='MATCHED_JD_EXISTING'&&!p04JdExistingWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_JD_EXISTING_WITNESS_CHANGED_DURING_RECONCILIATION');"],
    ["check.proof==='MATCHED_COMPANY_OUTPUT'?'RECOVERED_FROM_COMPANY_WITNESS':'RECOVERED_FROM_COMPLETION_RECEIPT'",
     "check.proof==='MATCHED_COMPANY_OUTPUT'?'RECOVERED_FROM_COMPANY_WITNESS':check.proof==='MATCHED_JD_EXISTING'?'RECOVERED_FROM_JD_EXISTING_WITNESS':'RECOVERED_FROM_COMPLETION_RECEIPT'"],
    ["check.proof==='MATCHED_COMPANY_OUTPUT'?'P04-COMPANY-WORKER-WITNESS-001: exact-attempt company row, completion flag and cost row independently read back; no replay':'P04-QUEUE-COMPLETION-RECEIPT-001: matching durable worker-return receipt independently read back; no replay'",
     "check.proof==='MATCHED_COMPANY_OUTPUT'?'P04-COMPANY-WORKER-WITNESS-001: exact-attempt company row, completion flag and cost row independently read back; no replay':check.proof==='MATCHED_JD_EXISTING'?'P04-JD-EXISTING-WITNESS-001: existing JD, snapshot, application and score admission independently read back; no replay':'P04-QUEUE-COMPLETION-RECEIPT-001: matching durable worker-return receipt independently read back; no replay'"],
  ];
  for(const [before,after] of replacements){if(source.split(before).length-1!==1)throw new Error('JD existing witness anchor not unique: '+before.slice(0,90));source=source.replace(before,after);}
  source+=String.raw`
/* P04-JD-EXISTING-WITNESS-001: only the existing-artifact branch. New retrieval, closure and blocker branches remain held without a completion receipt. */
function p04JdExistingOutputHash_(appId,scoreQid){let verified=null,artifact=null;try{artifact=loadJDArtifact_(appId);verified=jdVerifySaved_(appId,artifact,true);}catch(e){return'';}if(!verified||!artifact)return'';const qr=find_(JC.S.Q,scoreQid,'Queue Job ID');if(!qr)return'';const q=SH_(JC.S.Q).getRange(qr,1,1,16).getValues()[0];if(String(q[0])!==String(scoreQid)||String(q[1])!==String(appId)||String(q[2])!=='JD_PARSE_SCORE_MAP'||!['queued','running','recovery_hold','succeeded'].includes(String(q[3])))return'';const as=SH_(JC.S.A),js=SH_(JC.S.JD),a=as.getRange(verified.row,1,1,as.getLastColumn()).getValues()[0],j=js.getRange(verified.snapshotRow,1,1,js.getLastColumn()).getValues()[0];return hash_(JSON.stringify([artifact,a,j,[q[0],q[1],q[2],q[4],q[5]]]));}
function p04RecordJdExistingWitness_(appId,p,scoreQid){const id=String(p&&p.qid||''),attempt=Number(p&&p.attempt||0);if(!id||!attempt||!scoreQid)throw new Error('P04_JD_EXISTING_WITNESS_IDENTITY_REQUIRED');const s=SH_(JC.S.Q),m=hm_(s),f=s.getLastRow()>1?s.getRange(2,m['Queue Job ID'],s.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext():null;if(!f)throw new Error('P04_JD_EXISTING_WITNESS_QUEUE_MISSING');const job=s.getRange(f.getRow(),1,1,16).getValues()[0];if(String(job[0])!==id||String(job[1])!==String(appId)||String(job[2])!=='JD_RETRIEVE'||String(job[3])!=='running'||Number(job[6])!==attempt)throw new Error('P04_JD_EXISTING_WITNESS_QUEUE_MISMATCH');const outputHash=p04JdExistingOutputHash_(appId,scoreQid);if(!outputHash)throw new Error('P04_JD_EXISTING_WITNESS_OUTPUT_MISSING');const witness={contract:'P04-JD-EXISTING-WITNESS-001',queueJobId:id,applicationId:String(appId),workerType:'JD_RETRIEVE',inputHash:String(job[4]||''),idempotencyKey:String(job[5]||''),attempt:attempt,startedAt:new Date(job[9]).toISOString(),scoreQueueJobId:String(scoreQid),outputHash:outputHash},key='p04_jd_existing_witness_'+id,encoded=JSON.stringify(witness);upsertWorkerState_(key,encoded,'Existing JD, snapshot, application and score admission independently read back');if(rendererWorkerStateValue_(key)!==encoded)throw new Error('P04_JD_EXISTING_WITNESS_READBACK');return witness;}
function p04JdExistingWitnessMatches_(job){if(String(job[2]||'')!=='JD_RETRIEVE')return false;let witness=null,started='';try{witness=JSON.parse(rendererWorkerStateValue_('p04_jd_existing_witness_'+String(job[0]||''))||'null');started=new Date(job[9]).toISOString();}catch(e){return false;}if(!witness||witness.contract!=='P04-JD-EXISTING-WITNESS-001'||witness.queueJobId!==String(job[0]||'')||witness.applicationId!==String(job[1]||'')||witness.workerType!==String(job[2]||'')||witness.inputHash!==String(job[4]||'')||witness.idempotencyKey!==String(job[5]||'')||witness.attempt!==Number(job[6]||0)||witness.startedAt!==started)return false;const current=p04JdExistingOutputHash_(String(job[1]||''),String(witness.scoreQueueJobId||''));return !!current&&current===witness.outputHash;}
`;
}
if(source!==original)fs.writeFileSync(file,source);
console.log(JSON.stringify({changed:source!==original,contract:marker}));
