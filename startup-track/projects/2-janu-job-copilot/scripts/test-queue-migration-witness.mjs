import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const directory=process.argv[2];
if(!directory)throw new Error('Assembled private source directory required');
const source=fs.readFileSync(`${directory}/TrackerWorkflow.js`,'utf8');
function functionText(name){const start=source.indexOf(`function ${name}(`);if(start<0)throw new Error(`Missing ${name}`);const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?undefined:end);}

function harness(){
  const queueHeaders=['Queue Job ID','Application ID','Worker Type','Status','Input Hash','Idempotency Key','Attempts','Max Attempts','Next Run At','Started At','Finished At','Error Code','Error Detail','Payload Ref','Created At','Updated At'];
  const appHeaders=['Application ID','Decision','Status','Resume Version ID','ATS QA Status','Resume Review Decision','Submission Ready?','Tailored Resume Link','Application Pack Link'];
  const regHeaders=['Resume Version ID','Application ID','Editable Resume Link','PDF Resume Link','QA Status','Review Decision','Immutable After Submission?','Used to Apply?'];
  const auditHeaders=['Timestamp','Application ID','Entity','Field','Old','New','Actor','Why'];
  const tables=new Map();function sheet(name,headers,initial=[]){const rows=[headers,...initial];const out={rows,getLastRow:()=>rows.length,getLastColumn:()=>headers.length,getRange(row,col,height=1,width=1){return{getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row+i-1]?.[col+j-1]??'')),getValue:()=>rows[row-1]?.[col-1]??'',getDisplayValue:()=>String(rows[row-1]?.[col-1]??''),setValue:value=>{rows[row-1][col-1]=value;},createTextFinder:value=>({matchEntireCell:()=>({findNext:()=>{for(let r=row;r<row+height;r++)if(String(rows[r-1]?.[col-1]??'')===String(value))return{getRow:()=>r};return null;}})})};}};tables.set(name,out);return out;}
  const resumeUrl='https://docs.google.com/document/d/DOC-1/edit',packUrl='https://docs.google.com/document/d/PACK-1/edit';
  const queue=sheet('Queue',queueHeaders,[['Q-MIG','APP-1','ARTIFACT_MIGRATE','queued','input','idem',0,3,new Date(0),'','','','',JSON.stringify({}),new Date(0),new Date(0)]]);
  const app=sheet('Applications',appHeaders,[['APP-1','Apply','Resume Review','V1','Passed','Pending Review','No',resumeUrl,packUrl]]);
  const reg=sheet('Resume Registry',regHeaders,[['V1','APP-1',resumeUrl,'https://example.test/old.pdf','Passed','Pending Review','No','No']]);
  const audit=sheet('Audit Log',auditHeaders),docs=new Map([['DOC-1','Resume [EVIDENCE] internal'],['PACK-1','Editable resume: old\nSubmission PDF: old [EVIDENCE]']]),receipts=new Map();
  let failStage='',loseReceipt=false,editCount=0;
  const fail=stage=>{if(failStage===stage){failStage='';throw Error(stage+' write lost');}};
  const find=(name,id,head='Application ID')=>{const s=tables.get(name),ix=s.rows[0].indexOf(head),index=s.rows.findIndex((r,i)=>i>0&&String(r[ix]??'')===String(id));return index>0?index+1:null;};
  const obj=(s,row)=>Object.fromEntries(s.rows[0].map((h,i)=>[h,s.rows[row-1][i]??'']));
  const context=vm.createContext({
    JC:{S:{Q:'Queue',A:'Applications',RR:'Resume Registry',AUD:'Audit Log'},W:{MIG:'ARTIFACT_MIGRATE'},RETRIES:3},P12:{MAX_JOB_RUNTIME_MS:100000},
    SH_:name=>tables.get(name),hm_:s=>Object.fromEntries(s.rows[0].map((h,i)=>[h,i+1])),find_:find,obj_:obj,now_:()=>new Date(100000),hash_:value=>crypto.createHash('sha256').update(String(value)).digest('hex'),fileId_:url=>String(url||'').match(/\/d\/([^/]+)/)?.[1]||'',internalEvidenceLeak_:text=>String(text).includes('[EVIDENCE]'),
    DocumentApp:{openById:id=>{if(!docs.has(id))throw Error('missing doc');return{getBody:()=>({getText:()=>docs.get(id)})};}},activeResumeRegistryRow_:(id,version)=>{const index=reg.rows.findIndex((r,i)=>i>0&&r[0]===version&&r[1]===id);return index>0?index+1:null;},
    workerArtifactMigrateOriginal_:()=>{editCount++;docs.set('DOC-1','Clean resume');fail('resume-doc');docs.set('PACK-1','Editable resume: '+resumeUrl+'\nSubmission PDF: Pending candidate approval');fail('pack-doc');reg.rows[1][3]='';reg.rows[1][4]='Pending';reg.rows[1][5]='Not Ready';fail('registry');app.rows[1][2]='QA';app.rows[1][4]='Not Started';app.rows[1][5]='Not Ready';app.rows[1][6]='No';fail('application');audit.rows.push([new Date(100000),'APP-1','Resume','Artifact Migration','Legacy / dirty','Sanitized editable resume','Automation','Removed internal metadata']);fail('audit');return{appId:'APP-1',doc:'DOC-1'};},
    upsertWorkerState_:(key,value)=>{if(loseReceipt&&key.startsWith('p04_queue_completion_')){loseReceipt=false;throw Error('receipt lost');}receipts.set(key,value);},rendererWorkerStateValue_:key=>receipts.get(key)||'',
    circuitOpen_:()=>false,rendererCanarySemanticFreshOverride_:()=>false,queueJobFresh_:()=>true,rendererQuarantineBlocks_:()=>false,workerJD_:()=>{},workerScore_:()=>{},workerCompany_:()=>{},workerContacts_:()=>{},workerResume_:()=>{},workerQA_:()=>{},workerPDF_:()=>{},budgetGuard_:()=>{},backoffAt_:()=>new Date(200000),closeCircuit_:()=>{},classifyError_:()=>({kind:'TRANSIENT',code:'TRANSIENT_WRITE'}),
    p04ContactWitnessMatches_:()=>false,p04CompanyWitnessMatches_:()=>false,p04JdExistingWitnessMatches_:()=>false,p04JdRecoveredWitnessMatches_:()=>false,p04JdClosedWitnessMatches_:()=>false,p04ScoreWitnessMatches_:()=>false,p04ResumeWitnessMatches_:()=>false,p04TrackedScriptLock_:()=>({tryLock:()=>true,releaseLock:()=>{}}),
  });
  for(const name of ['p04RunQCore_','p04CompletionReceiptMatches_','p04MigrationPreimage_','workerArtifactMigrate_','p04MigrationOutputHash_','p04RecordMigrationWitness_','p04MigrationWitnessMatches_','inspectRecoveryHeldQueueJob','reconcileRecoveryHeldQueueJob'])vm.runInContext(functionText(name),context);
  return{context,queue,app,reg,audit,docs,receipts,loseReceipt(){loseReceipt=true;},failAt:stage=>{failStage=stage;},editCount:()=>editCount};
}

test('complete migration reconciles a lost receipt without repeating document edits',()=>{const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/receipt lost/);assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-MIG').proof,'MATCHED_MIGRATION_OUTPUT');const result=h.context.reconcileRecoveryHeldQueueJob('Q-MIG');assert.equal(result.status,'succeeded');assert.equal(result.replayed,false);assert.equal(h.editCount(),1);assert.equal(h.queue.rows[1][11],'RECOVERED_FROM_MIGRATION_WITNESS');});

test('changed document, pack, registry, application, audit or attempt remains held',()=>{const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2));const no=()=>assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-MIG').proof,'NO_MATCHING_COMPLETION_RECEIPT');for(const [target,index,value] of [[h.reg.rows[1],4,'Passed'],[h.app.rows[1],2,'Resume Review'],[h.audit.rows[1],5,'different']]){const old=target[index];target[index]=value;no();target[index]=old;}h.docs.set('DOC-1','tampered');no();h.docs.set('DOC-1','Clean resume');h.docs.set('PACK-1','tampered');no();h.docs.set('PACK-1','Editable resume: https://docs.google.com/document/d/DOC-1/edit\nSubmission PDF: Pending candidate approval');h.queue.rows[1][6]=99;no();});

test('failure after each partial write stays held with no migration witness',()=>{for(const stage of ['resume-doc','pack-doc','registry','application','audit']){const h=harness();h.failAt(stage);assert.throws(()=>h.context.p04RunQCore_(2));assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.receipts.has('p04_migration_witness_Q-MIG'),false);}});

test('submitted, immutable and clean preimages are rejected before any edit',()=>{for(const mode of ['Submitted','immutable','used','clean']){const h=harness();if(mode==='Submitted')h.app.rows[1][2]='Submitted';if(mode==='immutable')h.reg.rows[1][6]='Yes';if(mode==='used')h.reg.rows[1][7]='Yes';if(mode==='clean'){h.docs.set('DOC-1','Clean resume');h.docs.set('PACK-1','Clean pack');}assert.throws(()=>h.context.p04RunQCore_(2));assert.equal(h.editCount(),0);}});

test('mutation after inspection cannot reconcile the held migration',()=>{const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2));const inspect=h.context.inspectRecoveryHeldQueueJob;h.context.inspectRecoveryHeldQueueJob=id=>{const result=inspect(id);h.docs.set('PACK-1','changed after inspection');return result;};assert.throws(()=>h.context.reconcileRecoveryHeldQueueJob('Q-MIG'),/MIGRATION_WITNESS_CHANGED_DURING_RECONCILIATION/);assert.equal(h.queue.rows[1][3],'recovery_hold');});
