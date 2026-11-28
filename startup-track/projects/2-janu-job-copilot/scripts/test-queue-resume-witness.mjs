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
  const regHeaders=['Resume Version ID','Application ID','Editable Resume Link','PDF Resume Link','QA Status','Review Decision'];
  const artHeaders=['Application ID','Resume Version ID','Artifact Type','Drive File ID','Input Hash','Content Hash','Status'];
  const costHeaders=['Application ID','Worker','Task','Attempt','Queue Job ID'];
  const tables=new Map();
  function sheet(name,headers,initial=[]){const rows=[headers,...initial];const out={rows,getLastRow:()=>rows.length,getLastColumn:()=>headers.length,getRange(row,col,height=1,width=1){return{getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row+i-1]?.[col+j-1]??'')),getValue:()=>rows[row-1]?.[col-1]??'',getDisplayValue:()=>String(rows[row-1]?.[col-1]??''),setValue:value=>{rows[row-1][col-1]=value;},createTextFinder:value=>({matchEntireCell:()=>({findNext:()=>{for(let r=row;r<row+height;r++)if(String(rows[r-1]?.[col-1]??'')===String(value))return{getRow:()=>r};return null;}})})};}};tables.set(name,out);return out;}
  const queue=sheet('Queue',queueHeaders,[['Q-RES','APP-1','RESUME_GENERATE','queued','input','idem',0,3,new Date(0),'','','','',JSON.stringify({}),new Date(0),new Date(0)]]);
  const app=sheet('Applications',appHeaders,[['APP-1','Apply','Tailoring','','','','','','']]);
  const reg=sheet('Resume Registry',regHeaders),art=sheet('Artifact',artHeaders),cost=sheet('Cost',costHeaders);
  const receipts=new Map(),files=new Map(),docs=new Map(),hash=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
  const raw=JSON.stringify({summary:'Verified candidate summary'}),input='resume-input';
  let failStage='',failReceipt=false,renderCount=0;
  const fail=stage=>{if(failStage===stage){failStage='';throw Error(stage+' write lost');}};
  const find=(name,id,head='Application ID')=>{const s=tables.get(name),ix=s.rows[0].indexOf(head),index=s.rows.findIndex((r,i)=>i>0&&String(r[ix]??'')===String(id));return index>0?index+1:null;};
  const obj=(s,row)=>Object.fromEntries(s.rows[0].map((h,i)=>[h,s.rows[row-1][i]??'']));
  const context=vm.createContext({
    JC:{S:{Q:'Queue',A:'Applications',RR:'Resume Registry',COST:'Cost'},IDS:{EV:'EV'},W:{RES:'RESUME_GENERATE'},RETRIES:3},P12:{SHEETS:{ART:'Artifact'},MAX_JOB_RUNTIME_MS:100000},
    SH_:name=>tables.get(name),hm_:s=>Object.fromEntries(s.rows[0].map((h,i)=>[h,i+1])),find_:find,obj_:obj,now_:()=>new Date(100000),hash_:hash,
    DriveApp:{getFileById:id=>{if(!files.has(id))throw Error('file missing');return{getUrl:()=>`https://drive.google.com/file/d/${id}/view`,getBlob:()=>({getDataAsString:()=>files.get(id)})};}},
    DocumentApp:{openById:id=>{if(!docs.has(id))throw Error('doc missing');return{getBody:()=>({getText:()=>docs.get(id)})};}},
    fileId_:url=>String(url||'').match(/\/d\/([^/]+)/)?.[1]||'',mapFor_:()=>({jd:{},matches:[]}),docText_:()=> 'approved evidence',resumeInputHash_:()=>input,internalEvidenceLeak_:()=>false,
    activeResumeRegistryRow_:(id,version)=>{const index=reg.rows.findIndex((r,i)=>i>0&&r[0]===version&&r[1]===id);return index>0?index+1:null;},
    workerResumeOriginal_:(_app,p)=>{
      renderCount++;
      files.set('ART-1',raw);art.rows.push(['APP-1','V1','ResumeDocument','ART-1',input,hash(raw),'Ready']);fail('source');
      docs.set('DOC-1','Rendered resume');fail('render');
      reg.rows.push(['V1','APP-1','https://drive.google.com/file/d/DOC-1/view','','Pending','Not Ready']);fail('registry');
      docs.set('PACK-1','Application pack');files.set('PACK-1','pack');fail('pack');
      app.rows[1]=['APP-1','Apply','QA','V1','Not Started','Not Ready','No','https://drive.google.com/file/d/DOC-1/view','https://drive.google.com/file/d/PACK-1/view'];fail('application');
      cost.rows.push(['APP-1','RESUME_GENERATE','RENDER_REUSE',p.attempt,p.qid]);fail('cost');
    },
    upsertWorkerState_:(key,value)=>{if(failReceipt&&key.startsWith('p04_queue_completion_')){failReceipt=false;throw Error('receipt lost');}receipts.set(key,value);},rendererWorkerStateValue_:key=>receipts.get(key)||'',
    circuitOpen_:()=>false,rendererCanarySemanticFreshOverride_:()=>false,queueJobFresh_:()=>true,rendererQuarantineBlocks_:()=>false,
    workerJD_:()=>{},workerScore_:()=>{},workerCompany_:()=>{},workerContacts_:()=>{},workerArtifactMigrate_:()=>{},workerQA_:()=>{},workerPDF_:()=>{},
    budgetGuard_:()=>{},backoffAt_:()=>new Date(200000),closeCircuit_:()=>{},classifyError_:()=>({kind:'TRANSIENT',code:'TRANSIENT_WRITE'}),
    p04ContactWitnessMatches_:()=>false,p04CompanyWitnessMatches_:()=>false,p04JdExistingWitnessMatches_:()=>false,p04JdRecoveredWitnessMatches_:()=>false,p04JdClosedWitnessMatches_:()=>false,p04ScoreWitnessMatches_:()=>false,
    p04TrackedScriptLock_:()=>({tryLock:()=>true,releaseLock:()=>{}}),
  });
  for(const name of ['p04RunQCore_','p04CompletionReceiptMatches_','p04ResumeOutputHash_','p04RecordResumeWitness_','p04ResumeWitnessMatches_','inspectRecoveryHeldQueueJob','reconcileRecoveryHeldQueueJob','workerResume_'])vm.runInContext(functionText(name),context);
  return{context,queue,app,reg,art,cost,receipts,docs,files,loseReceipt(){failReceipt=true;},failAt:value=>{failStage=value;},renderCount:()=>renderCount};
}

test('complete resume, pack, registry, application and cost recover lost receipt without replay',()=>{const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/receipt lost/);assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-RES').proof,'MATCHED_RESUME_OUTPUT');const result=h.context.reconcileRecoveryHeldQueueJob('Q-RES');assert.equal(result.status,'succeeded');assert.equal(result.replayed,false);assert.equal(h.renderCount(),1);assert.equal(h.queue.rows[1][11],'RECOVERED_FROM_RESUME_WITNESS');});

test('changed source, rendered document, pack, registry, application, cost or attempt stays held',()=>{const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2));const no=()=>assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-RES').proof,'NO_MATCHING_COMPLETION_RECEIPT');for(const [target,index,value] of [[h.art.rows[1],5,'other'],[h.reg.rows[1],4,'Passed'],[h.app.rows[1],2,'Resume Review'],[h.cost.rows[1],4,'other']]){const old=target[index];target[index]=value;no();target[index]=old;}h.docs.set('DOC-1','tampered');no();h.docs.set('DOC-1','Rendered resume');h.docs.set('PACK-1','tampered');no();h.docs.set('PACK-1','Application pack');h.files.set('ART-1','{}');no();h.files.set('ART-1',JSON.stringify({summary:'Verified candidate summary'}));h.queue.rows[1][6]=2;no();});

test('failure after any partial output creates no completion witness',()=>{for(const stage of ['source','render','registry','pack','application','cost']){const h=harness();h.failAt(stage);assert.throws(()=>h.context.p04RunQCore_(2));assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.receipts.has('p04_resume_witness_Q-RES'),false);}});

test('witness cannot close after queue output changes between inspection and lock readback',()=>{const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2));const inspect=h.context.inspectRecoveryHeldQueueJob;h.context.inspectRecoveryHeldQueueJob=id=>{const result=inspect(id);h.docs.set('PACK-1','mutated after inspection');return result;};assert.throws(()=>h.context.reconcileRecoveryHeldQueueJob('Q-RES'),/RESUME_WITNESS_CHANGED_DURING_RECONCILIATION/);assert.equal(h.queue.rows[1][3],'recovery_hold');});
