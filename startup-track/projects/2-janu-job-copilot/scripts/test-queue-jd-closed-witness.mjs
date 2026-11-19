import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const directory=process.argv[2];
if(!directory)throw new Error('Assembled private source directory required');
const source=fs.readFileSync(`${directory}/TrackerWorkflow.js`,'utf8');
function functionText(name){const start=source.indexOf(`function ${name}(`);if(start<0)throw new Error(`Missing ${name}`);const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?undefined:end);}

function harness(mode='closed'){
  const queueHeaders=['Queue Job ID','Application ID','Worker Type','Status','Input Hash','Idempotency Key','Attempts','Max Attempts','Next Run At','Started At','Finished At','Error Code','Error Detail','Payload Ref','Created At','Updated At'];
  const appHeaders=['Application ID','Company','Role','Canonical Apply URL','Status','Decision','Vacancy Status','Last Vacancy Verified At','Vacancy Verification Source','Vacancy Verification URL','Vacancy Evidence Hash','Submission Ready?','Blocker Category','Exact Input Needed','Your Required Action','State Consistency'];
  const actionHeaders=['Record ID','Action Type','Workflow Status'];
  const tables=new Map();
  function sheet(name,headers,initial=[]){const rows=[headers,...initial];const out={rows,getLastRow:()=>rows.length,getLastColumn:()=>headers.length,
    getRange(row,col,height=1,width=1){return{
      getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row+i-1]?.[col+j-1]??'')),
      getValue:()=>rows[row-1]?.[col-1]??'',getDisplayValue:()=>String(rows[row-1]?.[col-1]??''),
      setValue:value=>{rows[row-1][col-1]=value;},
      clearContent:()=>{for(let j=0;j<width;j++)rows[row-1][col+j-1]='';},
      createTextFinder:value=>({matchEntireCell:()=>({findNext:()=>{for(let r=row;r<row+height;r++)if(String(rows[r-1]?.[col-1]??'')===String(value))return{getRow:()=>r};return null;}})}),
    };}};tables.set(name,out);return out;}
  const queue=sheet('Queue',queueHeaders,[
    ['Q-JD','APP-1','JD_RETRIEVE','queued','input-hash','idem-1',0,3,new Date(0),'','','','',JSON.stringify({}),new Date(0),new Date(0)],
    ['Q-OTHER','APP-1','COMPANY_ENRICH','queued','other-input','other-idem',0,3,new Date(0),'','','','',JSON.stringify({}),new Date(0),new Date(0)],
  ]);
  const app=sheet('Applications',appHeaders,[['APP-1','Example Co','Product Manager','https://example.invalid/job','New','Apply','','','','','','No','','','No action','OK']]);
  const actions=sheet('Actions',actionHeaders,[['APP-1','JD Capture','Blocked']]);
  const receipts=new Map();let failReceipt=false,failClosure=false,failCancel=false,failAction=false,failResult=false,failEvidence=false;
  const find=(name,id,head='Application ID')=>{const rows=tables.get(name).rows,ix=rows[0].indexOf(head),index=rows.findIndex((r,i)=>i>0&&String(r[ix]??'')===String(id));return index>0?index+1:null;};
  const readObj=(s,row)=>Object.fromEntries(s.rows[0].map((h,i)=>[h,s.rows[row-1][i]??'']));
  const context=vm.createContext({
    JC:{S:{Q:'Queue',A:'Applications',ACT:'Actions'},W:{JD:'JD_RETRIEVE'},RETRIES:3},P12:{MAX_JOB_RUNTIME_MS:100000},
    SH_:name=>tables.get(name),hm_:s=>Object.fromEntries(s.rows[0].map((h,i)=>[h,i+1])),find_:find,obj_:readObj,
    set_:(name,row,values)=>{if(failClosure&&name==='Applications'&&values.Status==='Closed'){failClosure=false;throw Error('closure write lost');}const s=tables.get(name);for(const [key,value] of Object.entries(values)){const col=s.rows[0].indexOf(key);if(col>=0)s.rows[row-1][col]=value;}},
    now_:()=>new Date(100000),hash_:value=>crypto.createHash('sha256').update(String(value)).digest('hex'),
    circuitOpen_:()=>false,rendererCanarySemanticFreshOverride_:()=>false,queueJobFresh_:()=>true,rendererQuarantineBlocks_:()=>false,
    workerScore_:()=>{},workerCompany_:()=>{},workerContacts_:()=>{},workerResume_:()=>{},workerArtifactMigrate_:()=>{},workerQA_:()=>{},workerPDF_:()=>{},
    budgetGuard_:()=>{},backoffAt_:()=>new Date(200000),closeCircuit_:()=>{},classifyError_:()=>({kind:'TRANSIENT',code:'TRANSIENT_WRITE'}),
    loadJDArtifact_:()=>null,jdReadbackPercent_:()=>0,
    p1aJdRetrieveForApp_:()=>mode==='closed'?{explicitClosed:true,provider:'ATS',url:'https://example.invalid/job'}:{ok:false,provider:'UNAVAILABLE',url:'https://example.invalid/job'},
    p1aRecordJdRetrieval_:()=>{if(failEvidence)return null;app.rows[1][6]=mode==='closed'?'CLOSED':'UNKNOWN';app.rows[1][7]=new Date(100000);app.rows[1][8]='ATS';app.rows[1][9]='https://example.invalid/job';app.rows[1][10]='closure-hash';if(mode==='closed'){app.rows[1][4]='Closed';actions.rows[1]=['','',''];if(failCancel){failCancel=false;throw Error('queue cancellation lost');}queue.rows[2][3]='cancelled';queue.rows[2][11]='OBSOLETE_CLOSED_VACANCY';}return{provider:'ATS',url:'https://example.invalid/job',hash:'closure-hash'};},
    resolve_:()=>{if(failAction){failAction=false;throw Error('action resolution lost');}actions.rows[1]=['','',''];},
    p1aJdTextFromRetrieval_:()=>'',block_:()=>{},
    upsertWorkerState_:(key,value)=>{if(failReceipt&&key.startsWith('p04_queue_completion_')){failReceipt=false;throw Error('completion receipt lost');}if(failResult&&key==='p1a_jd_last_result'){failResult=false;throw Error('result write lost');}receipts.set(key,value);},
    rendererWorkerStateValue_:key=>receipts.get(key)||'',
    p04ContactWitnessMatches_:()=>false,p04CompanyWitnessMatches_:()=>false,p04JdExistingWitnessMatches_:()=>false,p04JdRecoveredWitnessMatches_:()=>false,
    p04ScoreWitnessMatches_:()=>false,
    p04TrackedScriptLock_:()=>({tryLock:()=>true,releaseLock:()=>{}}),
  });
  for(const name of ['p04RunQCore_','p04CompletionReceiptMatches_','p04JdClosedOutputHash_','p04RecordJdClosedWitness_','p04JdClosedWitnessMatches_','inspectRecoveryHeldQueueJob','reconcileRecoveryHeldQueueJob','workerJD_'])vm.runInContext(functionText(name),context);
  return{context,queue,app,actions,receipts,loseReceipt(){failReceipt=true;},loseClosure(){failClosure=true;},loseCancel(){failCancel=true;},loseAction(){failAction=true;},loseResult(){failResult=true;},loseEvidence(){failEvidence=true;}};
}

test('closed vacancy, resolved action and cancelled queue recover a lost receipt without replay',()=>{
  const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/completion receipt lost/);
  assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.queue.rows[2][3],'cancelled');
  assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-JD').proof,'MATCHED_JD_CLOSED');
  const result=h.context.reconcileRecoveryHeldQueueJob('Q-JD');assert.equal(result.status,'succeeded');assert.equal(result.replayed,false);
  assert.equal(h.queue.rows[1][11],'RECOVERED_FROM_JD_CLOSED_WITNESS');
});

test('changed vacancy evidence, action, queued work or attempt keeps closure held',()=>{
  const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/completion receipt lost/);
  h.app.rows[1][10]='other-hash';assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-JD').proof,'NO_MATCHING_COMPLETION_RECEIPT');
  h.app.rows[1][10]='closure-hash';h.actions.rows[1][0]='APP-1';assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-JD').proof,'NO_MATCHING_COMPLETION_RECEIPT');
  h.actions.rows[1][0]='';h.queue.rows[2][3]='queued';assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-JD').proof,'NO_MATCHING_COMPLETION_RECEIPT');
  h.queue.rows[2][3]='cancelled';h.queue.rows[1][6]=99;assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-JD').status,'recovery_hold');
});

test('lost evidence, cancellation, closure, action or result write produces no closure witness',()=>{
  for(const failure of ['loseEvidence','loseCancel','loseClosure','loseAction','loseResult']){
    const h=harness();h[failure]();assert.throws(()=>h.context.p04RunQCore_(2));
    assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.receipts.has('p04_jd_closed_witness_Q-JD'),false);
    assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-JD').status,'recovery_hold');
  }
});

test('unavailable JD user blocker has no closure witness',()=>{
  const h=harness('blocked');assert.throws(()=>h.context.p04RunQCore_(2));
  assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.receipts.has('p04_jd_closed_witness_Q-JD'),false);
});

test('closure changing after inspection cannot reconcile the held job',()=>{
  const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/completion receipt lost/);
  const inspect=h.context.inspectRecoveryHeldQueueJob;h.context.inspectRecoveryHeldQueueJob=id=>{const result=inspect(id);h.queue.rows[2][3]='queued';return result;};
  assert.throws(()=>h.context.reconcileRecoveryHeldQueueJob('Q-JD'),/JD_CLOSED_WITNESS_CHANGED_DURING_RECONCILIATION/);
  assert.equal(h.queue.rows[1][3],'recovery_hold');
});
