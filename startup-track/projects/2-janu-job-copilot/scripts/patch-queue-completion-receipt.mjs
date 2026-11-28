import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('Source directory required');
const files = fs.readdirSync(root).filter(name => /\.(js|gs)$/.test(name))
  .map(name => path.join(root, name))
  .filter(file => fs.readFileSync(file, 'utf8').includes('function verifyReleaseIdentity()'));
if (files.length !== 1) throw new Error('Expected one product runtime');
const file = files[0];
const original = fs.readFileSync(file, 'utf8');
const marker = 'P04-QUEUE-COMPLETION-RECEIPT-001';
let source = original;
if (!source.includes(marker)) {
  if (!source.includes('P04-HOLD-ADMISSION-001')) throw new Error('Held-job admission guard must be installed first');
  const beforeCall = "__p04WorkerEntered=true;({JD_RETRIEVE:workerJD_";
  const afterCall = "__p04WorkerEntered=true;const __p04WorkerResult=({JD_RETRIEVE:workerJD_";
  if (source.split(beforeCall).length - 1 !== 1) throw new Error('Worker call anchor not unique');
  source = source.replace(beforeCall, afterCall);
  const beforeWarning = '    if(now_()-started>P12.MAX_JOB_RUNTIME_MS){';
  const receipt = `    /* ${marker}: record worker return before changing queue status. No automatic replay of an unproved hold. */
    const __p04Receipt={contract:'${marker}',queueJobId:qid,applicationId:app,workerType:type,inputHash:String(v[4]||''),idempotencyKey:idem,attempt:attempt,startedAt:started.toISOString(),resultHash:hash_(String(JSON.stringify(__p04WorkerResult)||''))};
    const __p04ReceiptKey='p04_queue_completion_'+qid;
    upsertWorkerState_(__p04ReceiptKey,JSON.stringify(__p04Receipt),'Worker returned before queue completion write; P04 recovery proof');
    if(rendererWorkerStateValue_(__p04ReceiptKey)!==JSON.stringify(__p04Receipt))throw new Error('DETERMINISTIC:P04_COMPLETION_RECEIPT_READBACK');
`;
  if (source.split(beforeWarning).length - 1 !== 1) throw new Error('Completion boundary not unique');
  source = source.replace(beforeWarning, receipt + beforeWarning);
  const helper = `
function p04CompletionReceiptMatches_(job,receipt){if(!receipt||receipt.contract!=='${marker}')return false;let started='';try{started=new Date(job[9]).toISOString();}catch(e){return false;}return receipt.queueJobId===String(job[0]||'')&&receipt.applicationId===String(job[1]||'')&&receipt.workerType===String(job[2]||'')&&receipt.inputHash===String(job[4]||'')&&receipt.idempotencyKey===String(job[5]||'')&&receipt.attempt===Number(job[6]||0)&&receipt.startedAt===started&&typeof receipt.resultHash==='string'&&receipt.resultHash.length>0;}
function inspectRecoveryHeldQueueJob(qid){const id=String(qid||'');if(!id)throw new Error('P04_QUEUE_ID_REQUIRED');const s=SH_(JC.S.Q),m=hm_(s);if(!m['Queue Job ID']||!m['Status'])throw new Error('P04_QUEUE_HEADERS_MISSING');const f=s.getLastRow()>1?s.getRange(2,m['Queue Job ID'],s.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext():null;if(!f)return{queueJobId:id,status:'NOT_FOUND',proof:'NONE'};const row=f.getRow(),job=s.getRange(row,1,1,16).getValues()[0];if(String(job[0]||'')!==id)return{queueJobId:id,status:'IDENTITY_MISMATCH',proof:'NONE'};const state=String(job[3]||'');if(state!=='recovery_hold')return{queueJobId:id,status:state,proof:'NOT_APPLICABLE'};let receipt=null;try{receipt=JSON.parse(rendererWorkerStateValue_('p04_queue_completion_'+id)||'null');}catch(e){}return{queueJobId:id,row:row,status:state,proof:p04CompletionReceiptMatches_(job,receipt)?'MATCHED_WORKER_RETURN':'NO_MATCHING_COMPLETION_RECEIPT',workerType:String(job[2]||''),applicationId:String(job[1]||'')};}
function reconcileRecoveryHeldQueueJob(qid){const lock=p04TrackedScriptLock_();if(!lock.tryLock(5000))throw new Error('temporarily unavailable P04 recovery lock');try{const check=inspectRecoveryHeldQueueJob(qid);if(check.status!=='recovery_hold'||check.proof!=='MATCHED_WORKER_RETURN')return check;const s=SH_(JC.S.Q),row=check.row;if(String(s.getRange(row,1).getDisplayValue()||'')!==String(qid)||String(s.getRange(row,4).getDisplayValue()||'')!=='recovery_hold')throw new Error('P04_QUEUE_CHANGED_DURING_RECONCILIATION');s.getRange(row,4).setValue('succeeded');s.getRange(row,11).setValue(now_());s.getRange(row,12).setValue('RECOVERED_FROM_COMPLETION_RECEIPT');s.getRange(row,13).setValue('${marker}: matching durable worker-return receipt independently read back; no replay');s.getRange(row,16).setValue(now_());if(String(s.getRange(row,4).getDisplayValue()||'')!=='succeeded')throw new Error('P04_QUEUE_RECONCILIATION_READBACK');return{queueJobId:String(qid),status:'succeeded',proof:'MATCHED_WORKER_RETURN',replayed:false};}finally{lock.releaseLock();}}
`;
  source += helper;
}
if (source !== original) fs.writeFileSync(file, source);
console.log(JSON.stringify({changed: source !== original, contract: marker}));
