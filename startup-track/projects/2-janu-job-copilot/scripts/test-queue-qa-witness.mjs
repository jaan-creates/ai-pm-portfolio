import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const directory=process.argv[2];if(!directory)throw new Error('Assembled private source directory required');
const source=fs.readFileSync(`${directory}/TrackerWorkflow.js`,'utf8');
function functionText(name){const start=source.indexOf(`function ${name}(`);if(start<0)throw new Error(`Missing ${name}`);const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?undefined:end);}

function harness(outcome='PASSED'){
  const queueHeaders=['Queue Job ID','Application ID','Worker Type','Status','Input Hash','Idempotency Key','Attempts','Max Attempts','Next Run At','Started At','Finished At','Error Code','Error Detail','Payload Ref','Created At','Updated At'];
  const appHeaders=['Application ID','Decision','Status','Resume Version ID','Tailored Resume Link','Application Pack Link','ATS QA Status','Resume Review Decision','Submission Ready?'];
  const regHeaders=['Resume Version ID','Application ID','PDF Resume Link','Immutable After Submission?','Used to Apply?','QA Status','Review Decision'];
  const artHeaders=['Application ID','Resume Version ID','Artifact Type','Drive File ID','Content Hash','Status'];
  const reviewHeaders=['Application ID','ATS QA','Editable Resume','Application Pack','Review Decision','PDF / Submission Resume'];
  const auditHeaders=['Timestamp','Application ID','Entity','Field','Old','New'];
  const costHeaders=['Application ID','Worker','Task','Attempt','Queue Job ID'];
  const tables=new Map();function sheet(name,headers,initial=[]){const rows=[headers,...initial];const out={rows,getLastRow:()=>rows.length,getLastColumn:()=>headers.length,getRange(row,col,height=1,width=1){return{getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row+i-1]?.[col+j-1]??'')),getValue:()=>rows[row-1]?.[col-1]??'',getDisplayValue:()=>String(rows[row-1]?.[col-1]??''),setValue:value=>{rows[row-1][col-1]=value;},createTextFinder:value=>({matchEntireCell:()=>({findNext:()=>{for(let r=row;r<row+height;r++)if(String(rows[r-1]?.[col-1]??'')===String(value))return{getRow:()=>r};return null;}})})};}};tables.set(name,out);return out;}
  const resumeUrl='https://docs.google.com/document/d/DOC-1/edit',packUrl='https://docs.google.com/document/d/PACK-1/edit',hash=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
  const queue=sheet('Queue',queueHeaders,[['Q-QA','APP-1','QA_FINALIZE','queued','qa-input','qa-idem',0,3,new Date(0),'','','','',JSON.stringify({}),new Date(0),new Date(0)]]);
  const app=sheet('Applications',appHeaders,[['APP-1','Apply','QA','V1',resumeUrl,packUrl,'Not Started','Not Ready','No']]);
  const reg=sheet('Resume Registry',regHeaders,[['V1','APP-1','','No','No','Pending','Not Ready']]);
  const art=sheet('Artifact',artHeaders,[['APP-1','V1','ResumeDocument','ART-1',hash('source'),'Ready']]);
  const review=sheet('Resume Review',reviewHeaders),audit=sheet('Audit Log',auditHeaders),cost=sheet('Cost',costHeaders),docs=new Map([['DOC-1','SUMMARY\nCORE SKILLS\nPROFESSIONAL EXPERIENCE\nEDUCATION']]),receipts=new Map();
  let failStage='',failReceipt=false,callCount=0;
  const fail=stage=>{if(failStage===stage){failStage='';throw Error(stage+' write lost');}};
  const find=(name,id,head='Application ID')=>{const s=tables.get(name),ix=s.rows[0].indexOf(head),index=s.rows.findIndex((r,i)=>i>0&&String(r[ix]??'')===String(id));return index>0?index+1:null;};
  const obj=(s,row)=>Object.fromEntries(s.rows[0].map((h,i)=>[h,s.rows[row-1][i]??'']));
  const context=vm.createContext({
    JC:{S:{Q:'Queue',A:'Applications',RR:'Resume Registry',RV:'Resume Review',AUD:'Audit Log',COST:'Cost'},W:{QA:'QA_FINALIZE'},RETRIES:3},P12:{SHEETS:{ART:'Artifact'},APP_REVIEW_PENDING:'Pending Review',RR_REVIEW_PENDING:'Pending Review',VERSION:'v1',MAX_JOB_RUNTIME_MS:100000},
    SH_:name=>tables.get(name),hm_:s=>Object.fromEntries(s.rows[0].map((h,i)=>[h,i+1])),find_:find,obj_:obj,now_:()=>new Date(100000),hash_:hash,fileId_:url=>String(url||'').match(/\/d\/([^/]+)/)?.[1]||'',internalEvidenceLeak_:()=>false,
    DocumentApp:{openById:id=>{if(!docs.has(id))throw Error('doc missing');return{getBody:()=>({getText:()=>docs.get(id)})};}},activeResumeRegistryRow_:(id,version)=>{const index=reg.rows.findIndex((r,i)=>i>0&&r[0]===version&&r[1]===id);return index>0?index+1:null;},
    workerQAOriginal_:(_app,p)=>{callCount++;cost.rows.push(['APP-1','QA_FINALIZE','PDF_QA',p.attempt,p.qid]);fail('provider-cost');if(outcome==='PASSED'){art.rows.push(['APP-1','V1','QaPassed','DOC-1',hash(docs.get('DOC-1')),'Ready']);fail('qa-receipt');reg.rows[1][5]='Passed';reg.rows[1][6]='Pending Review';fail('registry');app.rows[1][2]='Resume Review';app.rows[1][6]='Passed';app.rows[1][7]='Pending Review';fail('application');review.rows.push(['APP-1','Passed',resumeUrl,packUrl,'Pending Review','']);fail('review');audit.rows.push([new Date(100000),'APP-1','Application','Status','QA','Resume Review']);fail('audit');}else{art.rows[1][5]='Rejected by QA';fail('quarantine');reg.rows[1][5]='Failed';reg.rows[1][6]='Not Ready';fail('registry');app.rows[1][2]='Tailoring';app.rows[1][3]='';app.rows[1][4]='';app.rows[1][5]='';app.rows[1][6]='Failed';fail('application');queue.rows.push(['Q-REPAIR','APP-1','RESUME_GENERATE','queued',hash('APP-1|qa-repair|V1|v1'),'repair-idem',0,3,new Date(0),'','','','',JSON.stringify({}),new Date(0),new Date(0)]);fail('admission');audit.rows.push([new Date(100000),'APP-1','Resume','QA Remediation','V1','Fresh version queued']);fail('audit');}},
    upsertWorkerState_:(key,value)=>{if(failReceipt&&key.startsWith('p04_queue_completion_')){failReceipt=false;throw Error('receipt lost');}receipts.set(key,value);},rendererWorkerStateValue_:key=>receipts.get(key)||'',
    circuitOpen_:()=>false,rendererCanarySemanticFreshOverride_:()=>false,queueJobFresh_:()=>true,rendererQuarantineBlocks_:()=>false,workerJD_:()=>{},workerScore_:()=>{},workerCompany_:()=>{},workerContacts_:()=>{},workerResume_:()=>{},workerArtifactMigrate_:()=>{},workerPDF_:()=>{},budgetGuard_:()=>{},backoffAt_:()=>new Date(200000),closeCircuit_:()=>{},classifyError_:()=>({kind:'TRANSIENT',code:'TRANSIENT_WRITE'}),
    p04ContactWitnessMatches_:()=>false,p04CompanyWitnessMatches_:()=>false,p04JdExistingWitnessMatches_:()=>false,p04JdRecoveredWitnessMatches_:()=>false,p04JdClosedWitnessMatches_:()=>false,p04ScoreWitnessMatches_:()=>false,p04ResumeWitnessMatches_:()=>false,p04MigrationWitnessMatches_:()=>false,p04TrackedScriptLock_:()=>({tryLock:()=>true,releaseLock:()=>{}}),
  });
  for(const name of ['qaRepairDecision_','p04RunQCore_','p04CompletionReceiptMatches_','p04QaPreimage_','workerQA_','p04QaOutput_','p04RecordQaWitness_','p04QaWitnessMatches_','inspectRecoveryHeldQueueJob','reconcileRecoveryHeldQueueJob'])vm.runInContext(functionText(name),context);
  return{context,queue,app,reg,art,review,audit,cost,docs,receipts,loseReceipt(){failReceipt=true;},failAt:stage=>{failStage=stage;},callCount:()=>callCount};
}

for(const outcome of ['PASSED','REGENERATE'])test(outcome+' complete output reconciles lost receipt without repeating provider call',()=>{const h=harness(outcome);h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/receipt lost/);assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-QA').proof,'MATCHED_QA_OUTPUT');const result=h.context.reconcileRecoveryHeldQueueJob('Q-QA');assert.equal(result.status,'succeeded');assert.equal(result.replayed,false);assert.equal(h.callCount(),1);});

test('claim risk or issue cannot be accepted by inconsistent passed flag',()=>{const h=harness();for(const extra of [{issues:['clipped text']},{claim_risk:['unsupported claim']}])assert.equal(h.context.qaRepairDecision_({passed:true,text_readable:true,structure_ok:true,issues:[],claim_risk:[],...extra}),'REGENERATE');});

test('partial provider, receipt, projection, audit or admission write stays held',()=>{for(const [outcome,stages] of [['PASSED',['provider-cost','qa-receipt','registry','application','review','audit']],['REGENERATE',['provider-cost','quarantine','registry','application','admission','audit']]])for(const stage of stages){const h=harness(outcome);h.failAt(stage);assert.throws(()=>h.context.p04RunQCore_(2));assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.receipts.has('p04_qa_witness_Q-QA'),false);}});

test('changed QA receipt, review, cost, repair queue or attempt stays held',()=>{for(const outcome of ['PASSED','REGENERATE']){const h=harness(outcome);h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2));const no=()=>assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-QA').proof,'NO_MATCHING_COMPLETION_RECEIPT');h.cost.rows[1][4]='other';no();h.cost.rows[1][4]='Q-QA';if(outcome==='PASSED'){h.art.rows[2][4]='other';no();h.art.rows[2][4]=h.context.hash_(h.docs.get('DOC-1'));h.review.rows[1][1]='Failed';no();}else{h.queue.rows[2][4]='other';no();h.queue.rows[2][4]=h.context.hash_('APP-1|qa-repair|V1|v1');h.art.rows[1][5]='Ready';no();}h.queue.rows[1][6]=99;no();}});

test('protected or stale QA preimages do not call provider',()=>{for(const mode of ['Submitted','immutable','pdf','missing-doc']){const h=harness();if(mode==='Submitted')h.app.rows[1][2]='Submitted';if(mode==='immutable')h.reg.rows[1][3]='Yes';if(mode==='pdf')h.reg.rows[1][2]='https://example.test/official.pdf';if(mode==='missing-doc')h.docs.delete('DOC-1');assert.throws(()=>h.context.p04RunQCore_(2));assert.equal(h.callCount(),0);}});

test('output mutation after inspection cannot reconcile QA',()=>{const h=harness('PASSED');h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2));const inspect=h.context.inspectRecoveryHeldQueueJob;h.context.inspectRecoveryHeldQueueJob=id=>{const result=inspect(id);h.review.rows[1][1]='Failed';return result;};assert.throws(()=>h.context.reconcileRecoveryHeldQueueJob('Q-QA'),/QA_WITNESS_CHANGED_DURING_RECONCILIATION/);assert.equal(h.queue.rows[1][3],'recovery_hold');});
