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
  const appHeaders=['Application ID','Company','Canonical Apply URL','Job URL','Source Reliability'];
  const companyHeaders=['Application ID','Company','Research Sources','Last Updated'];
  const costHeaders=['Application ID','Worker','Task','Attempt','Queue Job ID','Notes'];
  const tables=new Map();
  function sheet(name,headers,initial=[]){
    const rows=[headers,...initial];
    const out={rows,getLastRow:()=>rows.length,getLastColumn:()=>headers.length,
      getRange(row,col,height=1,width=1){return{
        getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row+i-1]?.[col+j-1]??'')),
        getValue:()=>rows[row-1]?.[col-1]??'',
        getDisplayValue:()=>String(rows[row-1]?.[col-1]??''),
        setValue:value=>{rows[row-1][col-1]=value;},
        clearContent:()=>{for(let j=0;j<width;j++)rows[row-1][col+j-1]='';},
        createTextFinder:value=>({matchEntireCell:()=>({findNext:()=>{for(let r=row;r<row+height;r++)if(String(rows[r-1]?.[col-1]??'')===String(value))return{getRow:()=>r};return null;}})}),
      };},
    };
    tables.set(name,out);return out;
  }
  const queue=sheet('Queue',queueHeaders,[['Q-1','APP-1','COMPANY_ENRICH','queued','input-hash','idem-1',0,3,new Date(0),'','','','',JSON.stringify({}),new Date(0),new Date(0)]]);
  sheet('Applications',appHeaders,[['APP-1','Example Co','https://example.invalid/job','','Official ATS']]);
  const company=sheet('Company',companyHeaders);
  const cost=sheet('Cost',costHeaders);
  const properties=new Map(),receipts=new Map();
  let failReceipt=false,failCost=false;
  const headersOf=name=>tables.get(name).rows[0];
  const find=(name,id,head='Application ID')=>{const rows=tables.get(name).rows,ix=headersOf(name).indexOf(head);const index=rows.findIndex((r,i)=>i>0&&String(r[ix]??'')===String(id));return index>0?index+1:null;};
  const readObj=(sheet,row)=>Object.fromEntries(sheet.rows[0].map((h,i)=>[h,sheet.rows[row-1][i]??'']));
  const context=vm.createContext({
    JC:{S:{Q:'Queue',A:'Applications',CO:'Company',COST:'Cost'},W:{CO:'COMPANY_ENRICH'},RETRIES:3},P12:{MAX_JOB_RUNTIME_MS:100000},
    SH_:name=>tables.get(name),hm_:s=>Object.fromEntries(s.rows[0].map((h,i)=>[h,i+1])),find_:find,obj_:readObj,
    set_:(name,row,values)=>{const s=tables.get(name);for(const [key,value] of Object.entries(values)){const col=s.rows[0].indexOf(key);if(col>=0)s.rows[row-1][col]=value;}},
    append_:(name,values)=>{const s=tables.get(name);s.rows.push(s.rows[0].map(h=>values[h]??''));},
    P_:()=>({getProperty:key=>properties.get(key)||'',setProperty:(key,value)=>properties.set(key,value)}),
    now_:()=>new Date(100000),hash_:value=>crypto.createHash('sha256').update(String(value)).digest('hex'),
    circuitOpen_:()=>false,rendererCanarySemanticFreshOverride_:()=>false,queueJobFresh_:()=>true,rendererQuarantineBlocks_:()=>false,
    workerJD_:()=>{},workerScore_:()=>{},workerContacts_:()=>{},workerResume_:()=>{},workerArtifactMigrate_:()=>{},workerQA_:()=>{},workerPDF_:()=>{},
    budgetGuard_:()=>{},backoffAt_:()=>new Date(200000),closeCircuit_:()=>{},classifyError_:()=>({kind:'TRANSIENT',code:'TRANSIENT_WRITE'}),
    logCost_:(app,worker,task,provider,model,usage,searchCalls,cacheHit,attempt,qid,notes)=>{if(failCost)throw Error('cost write lost');cost.rows.push([app,worker,task,attempt,qid,notes]);},
    upsertWorkerState_:(key,value)=>{if(failReceipt&&key.startsWith('p04_queue_completion_')){failReceipt=false;throw Error('completion receipt lost');}receipts.set(key,value);},
    rendererWorkerStateValue_:key=>receipts.get(key)||'',
    p04ContactWitnessMatches_:()=>false,
    p04JdExistingWitnessMatches_:()=>false,
    p04JdRecoveredWitnessMatches_:()=>false,
    p04JdClosedWitnessMatches_:()=>false,
    p04TrackedScriptLock_:()=>({tryLock:()=>true,releaseLock:()=>{}}),
  });
  for(const name of ['p04RunQCore_','p04CompletionReceiptMatches_','p04CompanyOutputHash_','p04RecordCompanyWitness_','p04CompanyWitnessMatches_','inspectRecoveryHeldQueueJob','reconcileRecoveryHeldQueueJob','workerCompany_'])vm.runInContext(functionText(name),context);
  return{context,queue,company,cost,properties,receipts,loseReceipt(){failReceipt=true;},loseCost(){failCost=true;}};
}

test('company row, completion flag and job-bound cost witness recover a lost receipt without replay',()=>{
  const h=harness();h.loseReceipt();
  assert.throws(()=>h.context.p04RunQCore_(2),/completion receipt lost/);
  assert.equal(h.queue.rows[1][3],'recovery_hold');
  assert.equal(h.properties.get('DONE_CO_APP-1'),'1');
  assert.equal(h.cost.rows[1][4],'Q-1');
  assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof,'MATCHED_COMPANY_OUTPUT');
  const result=h.context.reconcileRecoveryHeldQueueJob('Q-1');
  assert.equal(result.status,'succeeded');assert.equal(result.proof,'MATCHED_COMPANY_OUTPUT');assert.equal(result.replayed,false);
  assert.equal(h.queue.rows[1][11],'RECOVERED_FROM_COMPANY_WITNESS');
  assert.equal(h.context.p04RunQCore_(2),0);
  assert.equal(h.cost.rows.length,2);
});

test('changed company output, cost row, input or attempt cannot prove completion',()=>{
  const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/completion receipt lost/);
  const originalCompany=h.company.rows[1][1],originalCost=h.cost.rows[1][4],originalInput=h.queue.rows[1][4],originalAttempt=h.queue.rows[1][6];
  h.company.rows[1][1]='Other Co';assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof,'NO_MATCHING_COMPLETION_RECEIPT');
  h.company.rows[1][1]=originalCompany;h.cost.rows[1][4]='OTHER';assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof,'NO_MATCHING_COMPLETION_RECEIPT');
  h.cost.rows[1][4]=originalCost;h.queue.rows[1][4]='other-input';assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof,'NO_MATCHING_COMPLETION_RECEIPT');
  h.queue.rows[1][4]=originalInput;h.queue.rows[1][6]=99;assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-1').proof,'NO_MATCHING_COMPLETION_RECEIPT');
  h.queue.rows[1][6]=originalAttempt;h.properties.delete('DONE_CO_APP-1');assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-1').status,'recovery_hold');
});

test('lost cost write after company row cannot create an output witness',()=>{
  const h=harness();h.loseCost();
  assert.throws(()=>h.context.p04RunQCore_(2),/cost write lost/);
  assert.equal(h.company.rows.length,2);assert.equal(h.properties.get('DONE_CO_APP-1'),'1');
  assert.equal(h.cost.rows.length,1);assert.equal(h.receipts.has('p04_company_witness_Q-1'),false);
  assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-1').status,'recovery_hold');
});

test('company output changed after inspection cannot be reconciled',()=>{
  const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/completion receipt lost/);
  const inspect=h.context.inspectRecoveryHeldQueueJob;
  h.context.inspectRecoveryHeldQueueJob=id=>{const result=inspect(id);h.cost.rows[1][5]='changed after inspection';return result;};
  assert.throws(()=>h.context.reconcileRecoveryHeldQueueJob('Q-1'),/COMPANY_WITNESS_CHANGED_DURING_RECONCILIATION/);
  assert.equal(h.queue.rows[1][3],'recovery_hold');
});
