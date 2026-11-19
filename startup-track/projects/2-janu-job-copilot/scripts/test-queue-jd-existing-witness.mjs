import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const directory=process.argv[2];
if(!directory)throw new Error('Assembled private source directory required');
const source=fs.readFileSync(`${directory}/TrackerWorkflow.js`,'utf8');
function functionText(name){const start=source.indexOf(`function ${name}(`);if(start<0)throw new Error(`Missing ${name}`);const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?undefined:end);}

function harness(mode='existing'){
  const queueHeaders=['Queue Job ID','Application ID','Worker Type','Status','Input Hash','Idempotency Key','Attempts','Max Attempts','Next Run At','Started At','Finished At','Error Code','Error Detail','Payload Ref','Created At','Updated At'];
  const appHeaders=['Application ID','Company','Role','Canonical Apply URL','JD Completeness %','Status','Decision','Blocker Category','Exact Input Needed'];
  const jdHeaders=['JD Snapshot ID','Application ID','Completeness %','Snapshot Status','JD Text / Document Link'];
  const artifactHeaders=['Application ID','JD Snapshot ID','Artifact Type','Drive File ID','Content Hash','Status'];
  const tables=new Map();
  function sheet(name,headers,initial=[]){const rows=[headers,...initial];const out={rows,getLastRow:()=>rows.length,getLastColumn:()=>headers.length,
    getRange(row,col,height=1,width=1){return{
      getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row+i-1]?.[col+j-1]??'')),
      getValue:()=>rows[row-1]?.[col-1]??'',getDisplayValue:()=>String(rows[row-1]?.[col-1]??''),
      setValue:value=>{rows[row-1][col-1]=value;},
      clearContent:()=>{for(let j=0;j<width;j++)rows[row-1][col+j-1]='';},
      createTextFinder:value=>({matchEntireCell:()=>({findNext:()=>{for(let r=row;r<row+height;r++)if(String(rows[r-1]?.[col-1]??'')===String(value))return{getRow:()=>r};return null;}})}),
    };}};tables.set(name,out);return out;}
  const queue=sheet('Queue',queueHeaders,[['Q-JD','APP-1','JD_RETRIEVE','queued','input-hash','idem-1',0,3,new Date(0),'','','','',JSON.stringify({}),new Date(0),new Date(0)]]);
  const app=sheet('Applications',appHeaders,[['APP-1','Example Co','Product Manager','https://example.invalid/job',mode==='existing'?90:0,'New','Apply','','']]);
  const jd=sheet('JD Snapshots',jdHeaders,mode==='existing'?[['JD-1','APP-1',90,'Verified Full JD','full JD']]:[]);
  const jdArtifacts=sheet('JD Artifacts',artifactHeaders,mode==='existing'?[['APP-1','JD-1','StructuredJD','FILE-1','hash-1','Active']]:[]);
  const receipts=new Map();let artifact=mode==='existing'?{title:'Product Manager',completeness:90}:null,failReceipt=false,failAppWrite=false,failScore=false;
  const find=(name,id,head='Application ID')=>{const rows=tables.get(name).rows,ix=rows[0].indexOf(head),index=rows.findIndex((r,i)=>i>0&&String(r[ix]??'')===String(id));return index>0?index+1:null;};
  const readObj=(s,row)=>Object.fromEntries(s.rows[0].map((h,i)=>[h,s.rows[row-1][i]??'']));
  const context=vm.createContext({
    JC:{S:{Q:'Queue',A:'Applications',JD:'JD Snapshots'},W:{JD:'JD_RETRIEVE',SCORE:'JD_PARSE_SCORE_MAP'},RETRIES:3},P12:{MAX_JOB_RUNTIME_MS:100000,SHEETS:{JDART:'JD Artifacts'}},
    SH_:name=>tables.get(name),hm_:s=>Object.fromEntries(s.rows[0].map((h,i)=>[h,i+1])),find_:find,obj_:readObj,
    set_:(name,row,values)=>{if(failAppWrite&&name==='Applications'&&values.Status==='Scoring'){failAppWrite=false;throw Error('application write lost');}const s=tables.get(name);for(const [key,value] of Object.entries(values)){const col=s.rows[0].indexOf(key);if(col>=0)s.rows[row-1][col]=value;}},
    now_:()=>new Date(100000),hash_:value=>crypto.createHash('sha256').update(String(value)).digest('hex'),
    circuitOpen_:()=>false,rendererCanarySemanticFreshOverride_:()=>false,queueJobFresh_:()=>true,rendererQuarantineBlocks_:()=>false,
    workerScore_:()=>{},workerCompany_:()=>{},workerContacts_:()=>{},workerResume_:()=>{},workerArtifactMigrate_:()=>{},workerQA_:()=>{},workerPDF_:()=>{},
    budgetGuard_:()=>{},backoffAt_:()=>new Date(200000),closeCircuit_:()=>{},classifyError_:()=>({kind:'TRANSIENT',code:'TRANSIENT_WRITE'}),
    loadJDArtifact_:()=>artifact,jdReadbackPercent_:()=>app.rows[1][4],
    jdPrepareExisting_:()=>{app.rows[1][5]='Scoring';jd.rows[1][3]='Verified Full JD';},
    jdVerifySaved_:()=>{if(!artifact||app.rows[1][5]!=='Scoring'||jd.rows.length<2)throw Error('JD incomplete');return{row:2,snapshotRow:2,completeness:90};},
    jdAdmitScore_:()=>{if(failScore)throw Error('score admission lost');if(queue.rows.length<3)queue.rows.push(['Q-SCORE','APP-1','JD_PARSE_SCORE_MAP','queued','score-input','score-idem',0,3,new Date(0),'','','','',JSON.stringify({}),new Date(0),new Date(0)]);return'Q-SCORE';},
    p1aJdRetrieveForApp_:()=>mode==='closed'?{explicitClosed:true,provider:'ATS',url:'https://example.invalid/job'}:{ok:true,provider:'ATS',url:'https://example.invalid/job',content:'full JD'},
    p1aRecordJdRetrieval_:()=>{},p1aJdTextFromRetrieval_:(_url,ret)=>ret.content||'',
    parseSaveJD_:()=>{artifact={title:'New JD',completeness:90};jd.rows.push(['JD-NEW','APP-1',90,'Verified Full JD','new JD']);app.rows[1][4]=90;app.rows[1][5]='Scoring';},
    resolve_:()=>{},block_:()=>{},
    upsertWorkerState_:(key,value)=>{if(failReceipt&&key.startsWith('p04_queue_completion_')){failReceipt=false;throw Error('completion receipt lost');}receipts.set(key,value);},
    rendererWorkerStateValue_:key=>receipts.get(key)||'',
    p04ContactWitnessMatches_:()=>false,p04CompanyWitnessMatches_:()=>false,
    p04JdRecoveredWitnessMatches_:()=>false,
    p04JdClosedWitnessMatches_:()=>false,
    p04RecordJdClosedWitness_:()=>{},
    p04TrackedScriptLock_:()=>({tryLock:()=>true,releaseLock:()=>{}}),
  });
  for(const name of ['p04RunQCore_','p04CompletionReceiptMatches_','p04JdExistingOutputHash_','p04RecordJdExistingWitness_','p04JdExistingWitnessMatches_','inspectRecoveryHeldQueueJob','reconcileRecoveryHeldQueueJob','workerJD_'])vm.runInContext(functionText(name),context);
  return{context,queue,app,jd,jdArtifacts,receipts,get artifact(){return artifact;},setArtifact:value=>{artifact=value;},loseReceipt(){failReceipt=true;},loseAppWrite(){failAppWrite=true;},loseScore(){failScore=true;}};
}

test('saved JD, snapshot, application and score admission recover a lost receipt without replay',()=>{
  const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/completion receipt lost/);
  assert.equal(h.queue.rows[1][3],'recovery_hold');
  assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-JD').proof,'MATCHED_JD_EXISTING');
  const result=h.context.reconcileRecoveryHeldQueueJob('Q-JD');assert.equal(result.status,'succeeded');assert.equal(result.replayed,false);
  assert.equal(h.queue.rows[1][11],'RECOVERED_FROM_JD_EXISTING_WITNESS');
  assert.equal(h.queue.rows.length,3);
});

test('changed artifact, snapshot, score admission or queue identity keeps saved JD held',()=>{
  const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/completion receipt lost/);
  h.setArtifact({title:'Changed',completeness:90});assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-JD').proof,'NO_MATCHING_COMPLETION_RECEIPT');
  h.setArtifact({title:'Product Manager',completeness:90});h.jd.rows[1][4]='changed';assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-JD').proof,'NO_MATCHING_COMPLETION_RECEIPT');
  h.jd.rows[1][4]='full JD';h.jdArtifacts.rows[1][3]='OTHER-FILE';assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-JD').proof,'NO_MATCHING_COMPLETION_RECEIPT');
  h.jdArtifacts.rows[1][3]='FILE-1';h.queue.rows[2][4]='changed';assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-JD').proof,'NO_MATCHING_COMPLETION_RECEIPT');
  h.queue.rows[2][4]='score-input';h.queue.rows[1][6]=99;assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-JD').status,'recovery_hold');
});

test('partial score admission or application write leaves no JD witness',()=>{
  for(const failure of ['loseScore','loseAppWrite']){const h=harness();h[failure]();assert.throws(()=>h.context.p04RunQCore_(2));assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.receipts.has('p04_jd_existing_witness_Q-JD'),false);}
});

test('closed-vacancy branch cannot use the saved-JD output proof',()=>{
  const h=harness('closed');h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/completion receipt lost/);assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-JD').status,'recovery_hold');
});

test('saved JD changing between inspection and reconciliation cannot close hold',()=>{
  const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/completion receipt lost/);
  const inspect=h.context.inspectRecoveryHeldQueueJob;h.context.inspectRecoveryHeldQueueJob=id=>{const result=inspect(id);h.jd.rows[1][4]='changed after inspection';return result;};
  assert.throws(()=>h.context.reconcileRecoveryHeldQueueJob('Q-JD'),/JD_EXISTING_WITNESS_CHANGED_DURING_RECONCILIATION/);
  assert.equal(h.queue.rows[1][3],'recovery_hold');
});
