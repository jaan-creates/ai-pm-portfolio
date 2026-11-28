import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const directory=process.argv[2];if(!directory)throw new Error('Assembled private source directory required');
const source=fs.readFileSync(`${directory}/TrackerWorkflow.js`,'utf8');
function functionText(name){const start=source.indexOf(`function ${name}(`);if(start<0)throw new Error(`Missing ${name}`);const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?undefined:end);}

function harness(branch='DIRECT'){
  const qh=['Queue Job ID','Application ID','Worker Type','Status','Input Hash','Idempotency Key','Attempts','Max Attempts','Next Run At','Started At','Finished At','Error Code','Error Detail','Payload Ref','Created At','Updated At'];
  const ah=['Application ID','Decision','Status','JD Snapshot Status','JD Completeness %','Company','Role'];
  const jh=['JD Snapshot ID','Application ID','Source URL','Snapshot Status','Completeness %'];
  const sh=['Intake ID','Processing Status','Promoted Application ID','Resolved Company','Resolved Role'];
  const arth=['Application ID','JD Snapshot ID','Artifact Type','Drive File ID','Content Hash','Status'];
  const ch=['Application ID','Worker','Task','Attempt','Queue Job ID'];
  const audh=['Timestamp','Application ID','Entity','Field','Old','New'];
  const tables=new Map();function sheet(name,headers,initial=[]){const rows=[headers,...initial];const out={rows,getLastRow:()=>rows.length,getLastColumn:()=>headers.length,getRange(row,col,height=1,width=1){return{getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row+i-1]?.[col+j-1]??'')),getValue:()=>rows[row-1]?.[col-1]??'',getDisplayValue:()=>String(rows[row-1]?.[col-1]??''),setValue:value=>{rows[row-1][col-1]=value;},createTextFinder:value=>({matchEntireCell:()=>({findNext:()=>{for(let r=row;r<row+height;r++)if(String(rows[r-1]?.[col-1]??'')===String(value))return{getRow:()=>r};return null;}})})};}};tables.set(name,out);return out;}
  const id=branch==='DIRECT'?'APP-1':'INT-1',targetId=branch==='DIRECT'?'APP-1':'APP-INT-1',fileUrl='https://drive.google.com/file/d/F-1/view',hash=value=>crypto.createHash('sha256').update(String(value)).digest('hex'),raw=JSON.stringify({company:'Example',title:'PM',completeness:92}),files=new Map([['F-1','binary pdf'],['JDART-1',raw]]);
  const queue=sheet('Queue',qh,[['Q-PDF',id,'PDF_CAPTURE','queued','input','idem',0,3,new Date(0),'','','','',JSON.stringify({fileId:'F-1'}),new Date(0),new Date(0)]]);
  const app=sheet('Applications',ah,branch==='DIRECT'?[['APP-1','Apply','Verifying JD','','','Example','PM']]:[]);
  const jd=sheet('JD Snapshots',jh),src=sheet('Sources Inbox',sh,branch==='SOURCE_INTAKE'?[['INT-1','Ready','','','']]:[]);
  const art=sheet('JD Artifacts',arth),cost=sheet('Cost',ch),audit=sheet('Audit Log',audh);
  const actions=sheet('My Actions',['Record ID'],[[id]]),receipts=new Map();let failStage='',failReceipt=false,callCount=0;
  const fail=stage=>{if(failStage===stage){failStage='';throw Error(stage+' write lost');}};
  const find=(name,value,head='Application ID')=>{const s=tables.get(name),ix=s.rows[0].indexOf(head),index=s.rows.findIndex((r,i)=>i>0&&String(r[ix]??'')===String(value));return index>0?index+1:null;};
  const obj=(s,row)=>Object.fromEntries(s.rows[0].map((h,i)=>[h,s.rows[row-1][i]??'']));
  const context=vm.createContext({
    JC:{S:{Q:'Queue',A:'Applications',JD:'JD Snapshots',SRC:'Sources Inbox',COST:'Cost',AUD:'Audit Log',ACT:'My Actions'},W:{PDF:'PDF_CAPTURE'},RETRIES:3},P12:{SHEETS:{JDART:'JD Artifacts'},MAX_JOB_RUNTIME_MS:100000},
    SH_:name=>tables.get(name),hm_:s=>Object.fromEntries(s.rows[0].map((h,i)=>[h,i+1])),find_:find,obj_:obj,now_:()=>new Date(100000),hash_:hash,sourceApplicationId_:intake=>'APP-'+intake,
    DriveApp:{getFileById:fileId=>{if(!files.has(fileId))throw Error('missing file');return{getUrl:()=>`https://drive.google.com/file/d/${fileId}/view`,getBlob:()=>({getDataAsString:()=>files.get(fileId)})};}},
    workerPDFOriginal_:(_id,p)=>{callCount++;cost.rows.push([id,'PDF_CAPTURE','PDF_EXTRACT',p.attempt,p.qid]);fail('provider-cost');if(branch==='SOURCE_INTAKE'){app.rows.push([targetId,'Apply','Scoring','Verified Full JD',92,'Example','PM']);fail('application');}art.rows.push([targetId,'JD-'+targetId+'-V1','StructuredJD','JDART-1',hash(raw),'Active']);fail('artifact');jd.rows.push(['JD-'+targetId+'-V1',targetId,fileUrl,'Verified Full JD',92]);fail('snapshot');if(branch==='DIRECT'){app.rows[1][2]='Scoring';app.rows[1][3]='Verified Full JD';app.rows[1][4]=92;fail('application');}else{src.rows[1][1]='Promoted';src.rows[1][2]=targetId;src.rows[1][3]='Example';src.rows[1][4]='PM';fail('source-writeback');audit.rows.push([new Date(100000),id,'Sources Inbox','Processing Status','Ready','Promoted']);fail('audit');}actions.rows[1][0]='';fail('action');},
    upsertWorkerState_:(key,value)=>{if(failReceipt&&key.startsWith('p04_queue_completion_')){failReceipt=false;throw Error('receipt lost');}receipts.set(key,value);},rendererWorkerStateValue_:key=>receipts.get(key)||'',
    circuitOpen_:()=>false,rendererCanarySemanticFreshOverride_:()=>false,queueJobFresh_:()=>true,rendererQuarantineBlocks_:()=>false,workerJD_:()=>{},workerScore_:()=>{},workerCompany_:()=>{},workerContacts_:()=>{},workerResume_:()=>{},workerArtifactMigrate_:()=>{},workerQA_:()=>{},budgetGuard_:()=>{},backoffAt_:()=>new Date(200000),closeCircuit_:()=>{},classifyError_:()=>({kind:'TRANSIENT',code:'TRANSIENT_WRITE'}),
    p04ContactWitnessMatches_:()=>false,p04CompanyWitnessMatches_:()=>false,p04JdExistingWitnessMatches_:()=>false,p04JdRecoveredWitnessMatches_:()=>false,p04JdClosedWitnessMatches_:()=>false,p04ScoreWitnessMatches_:()=>false,p04ResumeWitnessMatches_:()=>false,p04MigrationWitnessMatches_:()=>false,p04QaWitnessMatches_:()=>false,p04TrackedScriptLock_:()=>({tryLock:()=>true,releaseLock:()=>{}}),
  });
  for(const name of ['p04RunQCore_','p04CompletionReceiptMatches_','p04PdfPreimage_','workerPDF_','p04PdfOutput_','p04RecordPdfWitness_','p04PdfWitnessMatches_','inspectRecoveryHeldQueueJob','reconcileRecoveryHeldQueueJob'])vm.runInContext(functionText(name),context);
  return{context,id,queue,app,jd,src,art,cost,audit,actions,files,receipts,loseReceipt(){failReceipt=true;},failAt:stage=>{failStage=stage;},callCount:()=>callCount};
}

for(const branch of ['DIRECT','SOURCE_INTAKE'])test(branch+' complete PDF capture reconciles lost receipt without repeat provider call',()=>{const h=harness(branch);h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/receipt lost/);assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-PDF').proof,'MATCHED_PDF_OUTPUT');const result=h.context.reconcileRecoveryHeldQueueJob('Q-PDF');assert.equal(result.status,'succeeded');assert.equal(result.replayed,false);assert.equal(h.callCount(),1);});

test('partial PDF extraction, artifact, snapshot, application, intake, audit or action stays held',()=>{for(const [branch,stages] of [['DIRECT',['provider-cost','artifact','snapshot','application','action']],['SOURCE_INTAKE',['provider-cost','application','artifact','snapshot','source-writeback','audit','action']]])for(const stage of stages){const h=harness(branch);h.failAt(stage);assert.throws(()=>h.context.p04RunQCore_(2));assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.receipts.has('p04_pdf_witness_Q-PDF'),false);}});

test('changed cost, artifact, snapshot, promotion or queue attempt stays held',()=>{for(const branch of ['DIRECT','SOURCE_INTAKE']){const h=harness(branch);h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2));const no=()=>assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-PDF').proof,'NO_MATCHING_COMPLETION_RECEIPT');h.cost.rows[1][4]='other';no();h.cost.rows[1][4]='Q-PDF';h.art.rows[1][4]='other';no();h.art.rows[1][4]=h.context.hash_(h.files.get('JDART-1'));h.jd.rows[1][0]='other';no();h.jd.rows[1][0]='JD-'+(branch==='DIRECT'?'APP-1':'APP-INT-1')+'-V1';if(branch==='SOURCE_INTAKE'){h.src.rows[1][2]='other';no();h.src.rows[1][2]='APP-INT-1';}h.queue.rows[1][6]=99;no();}});

test('promoted intake and protected direct application reject before provider',()=>{for(const branch of ['DIRECT','SOURCE_INTAKE']){const h=harness(branch);if(branch==='DIRECT')h.app.rows[1][2]='Submitted';else h.src.rows[1][2]='APP-OLD';assert.throws(()=>h.context.p04RunQCore_(2));assert.equal(h.callCount(),0);}});

test('mutation after inspection cannot reconcile held PDF capture',()=>{const h=harness('SOURCE_INTAKE');h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2));const inspect=h.context.inspectRecoveryHeldQueueJob;h.context.inspectRecoveryHeldQueueJob=id=>{const result=inspect(id);h.src.rows[1][2]='other';return result;};assert.throws(()=>h.context.reconcileRecoveryHeldQueueJob('Q-PDF'),/PDF_WITNESS_CHANGED_DURING_RECONCILIATION/);assert.equal(h.queue.rows[1][3],'recovery_hold');});
