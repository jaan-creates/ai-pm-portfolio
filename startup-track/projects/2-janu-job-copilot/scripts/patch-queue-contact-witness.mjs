import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2];
if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8'),marker='P04-CONTACT-DISABLED-WITNESS-001';
let source=original;
if(!source.includes(marker)){
  if(!source.includes('P04-QUEUE-COMPLETION-RECEIPT-001'))throw new Error('Completion receipt patch required first');
  const replacements=[
    ["if(P_().getProperty('ENABLE_CONTACT_ENRICH')!=='1'){P_().setProperty('DONE_CT_'+appId,'1');return;}",
     "if(P_().getProperty('ENABLE_CONTACT_ENRICH')!=='1'){P_().setProperty('DONE_CT_'+appId,'1');if(p&&p.qid)p04RecordContactWitness_(appId,p);return;}"],
    ["proof:p04CompletionReceiptMatches_(job,receipt)?'MATCHED_WORKER_RETURN':'NO_MATCHING_COMPLETION_RECEIPT'",
     "proof:p04CompletionReceiptMatches_(job,receipt)?'MATCHED_WORKER_RETURN':p04ContactWitnessMatches_(job)?'MATCHED_CONTACT_DISABLED':'NO_MATCHING_COMPLETION_RECEIPT'"],
    ["if(check.status!=='recovery_hold'||check.proof!=='MATCHED_WORKER_RETURN')return check;",
     "if(check.status!=='recovery_hold'||!['MATCHED_WORKER_RETURN','MATCHED_CONTACT_DISABLED'].includes(check.proof))return check;"],
    ["if(String(s.getRange(row,1).getDisplayValue()||'')!==String(qid)||String(s.getRange(row,4).getDisplayValue()||'')!=='recovery_hold')throw new Error('P04_QUEUE_CHANGED_DURING_RECONCILIATION');",
     "if(String(s.getRange(row,1).getDisplayValue()||'')!==String(qid)||String(s.getRange(row,4).getDisplayValue()||'')!=='recovery_hold')throw new Error('P04_QUEUE_CHANGED_DURING_RECONCILIATION');if(check.proof==='MATCHED_CONTACT_DISABLED'&&!p04ContactWitnessMatches_(s.getRange(row,1,1,16).getValues()[0]))throw new Error('P04_CONTACT_WITNESS_CHANGED_DURING_RECONCILIATION');"],
    ["s.getRange(row,12).setValue('RECOVERED_FROM_COMPLETION_RECEIPT');s.getRange(row,13).setValue('P04-QUEUE-COMPLETION-RECEIPT-001: matching durable worker-return receipt independently read back; no replay');",
     "s.getRange(row,12).setValue(check.proof==='MATCHED_CONTACT_DISABLED'?'RECOVERED_FROM_CONTACT_WITNESS':'RECOVERED_FROM_COMPLETION_RECEIPT');s.getRange(row,13).setValue(check.proof==='MATCHED_CONTACT_DISABLED'?'P04-CONTACT-DISABLED-WITNESS-001: exact-attempt disabled-contact output independently read back; no replay':'P04-QUEUE-COMPLETION-RECEIPT-001: matching durable worker-return receipt independently read back; no replay');"],
    ["return{queueJobId:String(qid),status:'succeeded',proof:'MATCHED_WORKER_RETURN',replayed:false};",
     "return{queueJobId:String(qid),status:'succeeded',proof:check.proof,replayed:false};"],
  ];
  for(const [before,after] of replacements){if(source.split(before).length-1!==1)throw new Error('Contact witness anchor not unique: '+before.slice(0,80));source=source.replace(before,after);}
  source+=String.raw`
/* P04-CONTACT-DISABLED-WITNESS-001: a job-bound witness for the only side effect of disabled contact enrichment. */
function p04RecordContactWitness_(appId,p){const id=String(p&&p.qid||''),attempt=Number(p&&p.attempt||0);if(!id||!attempt)throw new Error('P04_CONTACT_WITNESS_IDENTITY_REQUIRED');const s=SH_(JC.S.Q),m=hm_(s),f=s.getLastRow()>1?s.getRange(2,m['Queue Job ID'],s.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext():null;if(!f)throw new Error('P04_CONTACT_WITNESS_QUEUE_MISSING');const job=s.getRange(f.getRow(),1,1,16).getValues()[0];if(String(job[0])!==id||String(job[1])!==String(appId)||String(job[2])!=='CONTACT_ENRICH'||String(job[3])!=='running'||Number(job[6])!==attempt||P_().getProperty('ENABLE_CONTACT_ENRICH')==='1'||P_().getProperty('DONE_CT_'+appId)!=='1')throw new Error('P04_CONTACT_WITNESS_STATE_MISMATCH');const witness={contract:'P04-CONTACT-DISABLED-WITNESS-001',queueJobId:id,applicationId:String(appId),workerType:'CONTACT_ENRICH',inputHash:String(job[4]||''),idempotencyKey:String(job[5]||''),attempt:attempt,startedAt:new Date(job[9]).toISOString(),outputHash:hash_(String(appId)+'|DONE_CT|1')},key='p04_contact_witness_'+id,encoded=JSON.stringify(witness);upsertWorkerState_(key,encoded,'Disabled contact worker output witnessed after property write');if(rendererWorkerStateValue_(key)!==encoded)throw new Error('P04_CONTACT_WITNESS_READBACK');return witness;}
function p04ContactWitnessMatches_(job){if(String(job[2]||'')!=='CONTACT_ENRICH'||P_().getProperty('ENABLE_CONTACT_ENRICH')==='1'||P_().getProperty('DONE_CT_'+String(job[1]||''))!=='1')return false;let witness=null,started='';try{witness=JSON.parse(rendererWorkerStateValue_('p04_contact_witness_'+String(job[0]||''))||'null');started=new Date(job[9]).toISOString();}catch(e){return false;}return !!witness&&witness.contract==='P04-CONTACT-DISABLED-WITNESS-001'&&witness.queueJobId===String(job[0]||'')&&witness.applicationId===String(job[1]||'')&&witness.workerType===String(job[2]||'')&&witness.inputHash===String(job[4]||'')&&witness.idempotencyKey===String(job[5]||'')&&witness.attempt===Number(job[6]||0)&&witness.startedAt===started&&witness.outputHash===hash_(String(job[1]||'')+'|DONE_CT|1');}
`;
}
if(source!==original)fs.writeFileSync(file,source);
console.log(JSON.stringify({changed:source!==original,contract:marker}));
