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
  const appHeaders=['Application ID','Decision','Status','JD Fit Score','JD Completeness %','Vacancy Status'];
  const mapHeaders=['Application ID','JD Requirement','Evidence Strength','Gap Type','Source JD Text'];
  const gapHeaders=['Application ID','JD Requirement','Gap ID','Evidence Status','Gap Type'];
  const costHeaders=['Application ID','Worker','Task','Attempt','Queue Job ID','Notes'];
  const tables=new Map();
  function sheet(name,headers,initial=[]){const rows=[headers,...initial];const out={rows,getLastRow:()=>rows.length,getLastColumn:()=>headers.length,
    getRange(row,col,height=1,width=1){return{
      getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row+i-1]?.[col+j-1]??'')),
      getValue:()=>rows[row-1]?.[col-1]??'',getDisplayValue:()=>String(rows[row-1]?.[col-1]??''),
      setValue:value=>{rows[row-1][col-1]=value;},
      clearContent:()=>{for(let j=0;j<width;j++)rows[row-1][col+j-1]='';},
      createTextFinder:value=>({matchEntireCell:()=>({findNext:()=>{for(let r=row;r<row+height;r++)if(String(rows[r-1]?.[col-1]??'')===String(value))return{getRow:()=>r};return null;}})}),
    };}};tables.set(name,out);return out;}
  const queue=sheet('Queue',queueHeaders,[['Q-SCORE','APP-1','JD_PARSE_SCORE_MAP','queued','input-hash','idem-1',0,3,new Date(0),'','','','',JSON.stringify({}),new Date(0),new Date(0)]]);
  const app=sheet('Applications',appHeaders,[['APP-1','Apply','Scoring','',90,'OPEN']]);
  const map=sheet('Evidence Map',mapHeaders),gaps=sheet('Skill Gaps',gapHeaders),cost=sheet('Cost',costHeaders);
  const properties=new Map(),receipts=new Map();
  const jd={company:'Example Co',title:'Product Manager',requirements:[{id:'R1',text:'Build product',importance:'high'},{id:'R2',text:'SQL',importance:'medium'}]};
  let failStage='',failReceipt=false,failAdmission=false,failResult=false,omitSecond=false;
  const find=(name,id,head='Application ID')=>{const rows=tables.get(name).rows,ix=rows[0].indexOf(head),index=rows.findIndex((r,i)=>i>0&&String(r[ix]??'')===String(id));return index>0?index+1:null;};
  const readObj=(s,row)=>Object.fromEntries(s.rows[0].map((h,i)=>[h,s.rows[row-1][i]??'']));
  const fail=stage=>{if(failStage===stage){failStage='';throw Error(stage+' write lost');}};
  const context=vm.createContext({
    JC:{S:{Q:'Queue',A:'Applications',MAP:'Evidence Map',COST:'Cost'},W:{SCORE:'JD_PARSE_SCORE_MAP'},SCORING_VERSION:'fit-v2',RETRIES:3},P12:{MAX_JOB_RUNTIME_MS:100000},
    SH_:name=>tables.get(name),hm_:s=>Object.fromEntries(s.rows[0].map((h,i)=>[h,i+1])),find_:find,obj_:readObj,
    P_:()=>({getProperty:key=>properties.get(key)||'',setProperty:(key,value)=>properties.set(key,value),deleteProperty:key=>properties.delete(key)}),
    now_:()=>new Date(100000),hash_:value=>crypto.createHash('sha256').update(String(value)).digest('hex'),
    circuitOpen_:()=>false,rendererCanarySemanticFreshOverride_:()=>false,queueJobFresh_:()=>true,rendererQuarantineBlocks_:()=>false,
    workerJD_:()=>{},workerCompany_:()=>{},workerContacts_:()=>{},workerResume_:()=>{},workerArtifactMigrate_:()=>{},workerQA_:()=>{},workerPDF_:()=>{},
    budgetGuard_:()=>{},backoffAt_:()=>new Date(200000),closeCircuit_:()=>{},classifyError_:()=>({kind:'TRANSIENT',code:'TRANSIENT_WRITE'}),
    loadJD_:()=>({parsed:jd}),
    workerScoreOriginal_:(_app,p)=>{
      cost.rows.push(['APP-1','JD_PARSE_SCORE_MAP','EVIDENCE_MAP',p.attempt,p.qid,'model call']);fail('cost');
      map.rows.splice(1);properties.delete('MAP_READY_APP-1');fail('clear');
      map.rows.push(['APP-1','Build product','strong','','Build product']);fail('first-map');
      if(!omitSecond)map.rows.push(['APP-1','SQL','weak','experience_gap','SQL']);
      gaps.rows.push(['APP-1','SQL','GAP-APP-1-R2','weak','experience_gap']);fail('gap');
      app.rows[1][2]='Tailoring';app.rows[1][3]=82;fail('score');
      properties.set('MAP_READY_APP-1','fit-v2');fail('flag');
    },
    p1aScoreCompletionAdmission_:()=>{if(failAdmission)throw Error('resume admission lost');queue.rows.push(['Q-RES','APP-1','RESUME_GENERATE','queued','resume-input','resume-idem',0,3,new Date(0),'','','','',JSON.stringify({}),new Date(0),new Date(0)]);return{admitted:true,queueJobId:'Q-RES',applicationId:'APP-1'};},
    upsertWorkerState_:(key,value)=>{if(failReceipt&&key.startsWith('p04_queue_completion_')){failReceipt=false;throw Error('completion receipt lost');}if(failResult&&key==='p1a_score_completion_admission_last_result'){failResult=false;throw Error('admission result lost');}receipts.set(key,value);},
    rendererWorkerStateValue_:key=>receipts.get(key)||'',
    p04ContactWitnessMatches_:()=>false,p04CompanyWitnessMatches_:()=>false,p04JdExistingWitnessMatches_:()=>false,p04JdRecoveredWitnessMatches_:()=>false,p04JdClosedWitnessMatches_:()=>false,
    p04TrackedScriptLock_:()=>({tryLock:()=>true,releaseLock:()=>{}}),
  });
  for(const name of ['p04RunQCore_','p04CompletionReceiptMatches_','p04ScoreOutputHash_','p04RecordScoreWitness_','p04ScoreWitnessMatches_','inspectRecoveryHeldQueueJob','reconcileRecoveryHeldQueueJob','workerScore_'])vm.runInContext(functionText(name),context);
  return{context,queue,app,map,gaps,cost,jd,properties,receipts,loseReceipt(){failReceipt=true;},failAt:value=>{failStage=value;},omitSecondMap(){omitSecond=true;},loseAdmission(){failAdmission=true;},loseResult(){failResult=true;}};
}

test('complete map, new gap, score flag, cost and resume job recover a lost receipt without replay',()=>{
  const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/completion receipt lost/);
  assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-SCORE').proof,'MATCHED_SCORE_OUTPUT');
  const result=h.context.reconcileRecoveryHeldQueueJob('Q-SCORE');assert.equal(result.status,'succeeded');assert.equal(result.replayed,false);
  assert.equal(h.queue.rows[1][11],'RECOVERED_FROM_SCORE_WITNESS');assert.equal(h.queue.rows.length,3);
});

test('changed map, gap, cost, flag, resume job or attempt keeps score held',()=>{
  const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/completion receipt lost/);
  const no=()=>assert.equal(h.context.inspectRecoveryHeldQueueJob('Q-SCORE').proof,'NO_MATCHING_COMPLETION_RECEIPT');
  h.map.rows[2][1]='Other';no();h.map.rows[2][1]='SQL';
  h.gaps.rows[1][1]='Other';no();h.gaps.rows[1][1]='SQL';
  h.cost.rows[1][4]='OTHER';no();h.cost.rows[1][4]='Q-SCORE';
  h.properties.delete('MAP_READY_APP-1');no();h.properties.set('MAP_READY_APP-1','fit-v2');
  h.queue.rows[2][4]='other-input';no();h.queue.rows[2][4]='resume-input';
  h.queue.rows[1][6]=99;assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-SCORE').status,'recovery_hold');
});

test('partial map, gap, score, flag or provider cost writes create no output witness',()=>{
  for(const stage of ['cost','clear','first-map','gap','score','flag']){
    const h=harness();h.failAt(stage);assert.throws(()=>h.context.p04RunQCore_(2));
    assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.receipts.has('p04_score_witness_Q-SCORE'),false);
  }
});

test('incomplete returned map or missing resume admission cannot prove completion',()=>{
  for(const mode of ['omitSecondMap','loseAdmission','loseResult']){
    const h=harness();h[mode]();assert.throws(()=>h.context.p04RunQCore_(2));
    assert.equal(h.queue.rows[1][3],'recovery_hold');assert.equal(h.context.reconcileRecoveryHeldQueueJob('Q-SCORE').status,'recovery_hold');
  }
});

test('score output changing after inspection cannot reconcile held job',()=>{
  const h=harness();h.loseReceipt();assert.throws(()=>h.context.p04RunQCore_(2),/completion receipt lost/);
  const inspect=h.context.inspectRecoveryHeldQueueJob;h.context.inspectRecoveryHeldQueueJob=id=>{const result=inspect(id);h.map.rows[1][2]='missing';return result;};
  assert.throws(()=>h.context.reconcileRecoveryHeldQueueJob('Q-SCORE'),/SCORE_WITNESS_CHANGED_DURING_RECONCILIATION/);
  assert.equal(h.queue.rows[1][3],'recovery_hold');
});
