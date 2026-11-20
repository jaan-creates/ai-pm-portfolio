import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2];
if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8'),marker='P04-COMPANY-WORKER-WITNESS-001';
let source=original;
if(!source.includes(marker)){
  if(!source.includes('P04-CONTACT-DISABLED-WITNESS-001'))throw new Error('Contact witness patch required first');
  const replacements=[
    ["logCost_(appId,JC.W.CO,'COMPANY_ENRICH','Direct/Cache','',{},0,true,'','','No OpenAI web search; lean provider enrichment pending/provider-independent.');",
     "logCost_(appId,JC.W.CO,'COMPANY_ENRICH','Direct/Cache','',{},0,true,p&&p.attempt,p&&p.qid,'No OpenAI web search; lean provider enrichment pending/provider-independent.');if(p&&p.qid)p04RecordCompanyWitness_(appId,p);"],
    ["p04ContactWitnessMatches_(job)?'MATCHED_CONTACT_DISABLED':'NO_MATCHING_COMPLETION_RECEIPT'",
     "p04ContactWitnessMatches_(job)?'MATCHED_CONTACT_DISABLED':p04CompanyWitnessMatches_(job)?'MATCHED_COMPANY_OUTPUT':'NO_MATCHING_COMPLETION_RECEIPT'"],
    ["['MATCHED_WORKER_RETURN','MATCHED_CONTACT_DISABLED'].includes(check.proof)",
     "['MATCHED_WORKER_RETURN','MATCHED_CONTACT_DISABLED','MATCHED_COMPANY_OUTPUT'].includes(check.proof)"],
    ["if(check.proof==='MATCHED_CONTACT_DISABLED'&&!p04ContactWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_CONTACT_WITNESS_CHANGED_DURING_RECONCILIATION');",
     "if(check.proof==='MATCHED_CONTACT_DISABLED'&&!p04ContactWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_CONTACT_WITNESS_CHANGED_DURING_RECONCILIATION');if(check.proof==='MATCHED_COMPANY_OUTPUT'&&!p04CompanyWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_COMPANY_WITNESS_CHANGED_DURING_RECONCILIATION');"],
    ["check.proof==='MATCHED_CONTACT_DISABLED'?'RECOVERED_FROM_CONTACT_WITNESS':'RECOVERED_FROM_COMPLETION_RECEIPT'",
     "check.proof==='MATCHED_CONTACT_DISABLED'?'RECOVERED_FROM_CONTACT_WITNESS':check.proof==='MATCHED_COMPANY_OUTPUT'?'RECOVERED_FROM_COMPANY_WITNESS':'RECOVERED_FROM_COMPLETION_RECEIPT'"],
    ["check.proof==='MATCHED_CONTACT_DISABLED'?'P04-CONTACT-DISABLED-WITNESS-001: exact-attempt disabled-contact output independently read back; no replay':'P04-QUEUE-COMPLETION-RECEIPT-001: matching durable worker-return receipt independently read back; no replay'",
     "check.proof==='MATCHED_CONTACT_DISABLED'?'P04-CONTACT-DISABLED-WITNESS-001: exact-attempt disabled-contact output independently read back; no replay':check.proof==='MATCHED_COMPANY_OUTPUT'?'P04-COMPANY-WORKER-WITNESS-001: exact-attempt company row, completion flag and cost row independently read back; no replay':'P04-QUEUE-COMPLETION-RECEIPT-001: matching durable worker-return receipt independently read back; no replay'"],
  ];
  for(const [before,after] of replacements){if(source.split(before).length-1!==1)throw new Error('Company witness anchor not unique: '+before.slice(0,90));source=source.replace(before,after);}
  source+=String.raw`
/* P04-COMPANY-WORKER-WITNESS-001: job-bound proof for Company Enrichment row, completion flag and cost row. */
function p04CompanyOutputHash_(appId,qid,attempt){if(P_().getProperty('DONE_CO_'+appId)!=='1')return'';const cr=find_(JC.S.CO,appId,'Application ID'),lr=find_(JC.S.COST,qid,'Queue Job ID');if(!cr||!lr)return'';const cs=SH_(JC.S.CO),ls=SH_(JC.S.COST),cost=obj_(ls,lr);if(String(cost['Application ID']||'')!==String(appId)||String(cost['Worker']||'')!=='COMPANY_ENRICH'||String(cost['Task']||'')!=='COMPANY_ENRICH'||String(cost['Queue Job ID']||'')!==String(qid)||Number(cost['Attempt']||0)!==Number(attempt))return'';const company=cs.getRange(cr,1,1,cs.getLastColumn()).getValues()[0],ledger=ls.getRange(lr,1,1,ls.getLastColumn()).getValues()[0];return hash_(JSON.stringify([company,ledger,'DONE_CO=1']));}
function p04RecordCompanyWitness_(appId,p){const id=String(p&&p.qid||''),attempt=Number(p&&p.attempt||0);if(!id||!attempt)throw new Error('P04_COMPANY_WITNESS_IDENTITY_REQUIRED');const s=SH_(JC.S.Q),m=hm_(s),f=s.getLastRow()>1?s.getRange(2,m['Queue Job ID'],s.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext():null;if(!f)throw new Error('P04_COMPANY_WITNESS_QUEUE_MISSING');const job=s.getRange(f.getRow(),1,1,16).getValues()[0];if(String(job[0])!==id||String(job[1])!==String(appId)||String(job[2])!=='COMPANY_ENRICH'||String(job[3])!=='running'||Number(job[6])!==attempt)throw new Error('P04_COMPANY_WITNESS_QUEUE_MISMATCH');const outputHash=p04CompanyOutputHash_(appId,id,attempt);if(!outputHash)throw new Error('P04_COMPANY_WITNESS_OUTPUT_MISSING');const witness={contract:'P04-COMPANY-WORKER-WITNESS-001',queueJobId:id,applicationId:String(appId),workerType:'COMPANY_ENRICH',inputHash:String(job[4]||''),idempotencyKey:String(job[5]||''),attempt:attempt,startedAt:new Date(job[9]).toISOString(),outputHash:outputHash},key='p04_company_witness_'+id,encoded=JSON.stringify(witness);upsertWorkerState_(key,encoded,'Company row, completion flag and cost row independently read back');if(rendererWorkerStateValue_(key)!==encoded)throw new Error('P04_COMPANY_WITNESS_READBACK');return witness;}
function p04CompanyWitnessMatches_(job){if(String(job[2]||'')!=='COMPANY_ENRICH')return false;let witness=null,started='';try{witness=JSON.parse(rendererWorkerStateValue_('p04_company_witness_'+String(job[0]||''))||'null');started=new Date(job[9]).toISOString();}catch(e){return false;}if(!witness||witness.contract!=='P04-COMPANY-WORKER-WITNESS-001'||witness.queueJobId!==String(job[0]||'')||witness.applicationId!==String(job[1]||'')||witness.workerType!==String(job[2]||'')||witness.inputHash!==String(job[4]||'')||witness.idempotencyKey!==String(job[5]||'')||witness.attempt!==Number(job[6]||0)||witness.startedAt!==started)return false;const current=p04CompanyOutputHash_(String(job[1]||''),String(job[0]||''),Number(job[6]||0));return !!current&&current===witness.outputHash;}
`;
}
if(source!==original)fs.writeFileSync(file,source);
console.log(JSON.stringify({changed:source!==original,contract:marker}));
