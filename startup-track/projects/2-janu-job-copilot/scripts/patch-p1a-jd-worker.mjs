import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target)throw new Error('TrackerWorkflow source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;
const anchor='function verifyReleaseIdentity()';

for(const token of ['function retrievalGatewayFetch_(','function parseSaveJD_(','function loadJDArtifact_(','function enqueue_(','function atsHostKind_(','function upsertWorkerState_(']){
  if(!s.includes(token))throw new Error('P1-A JD integration dependency missing '+token);
}

function functionRange_(name){
  const marker='function '+name+'(';
  const start=s.indexOf(marker);if(start<0)return null;
  const open=s.indexOf('{',start+marker.length);if(open<0)throw new Error('Function body missing '+name);
  let depth=0,inS=false,inD=false,inT=false,esc=false,lineComment=false,blockComment=false;
  for(let i=open;i<s.length;i++){
    const c=s[i],n=s[i+1]||'';
    if(lineComment){if(c==='\n')lineComment=false;continue;}
    if(blockComment){if(c==='*'&&n==='/'){blockComment=false;i++;}continue;}
    if(esc){esc=false;continue;}if((inS||inD||inT)&&c==='\\'){esc=true;continue;}
    if(inS){if(c==="'")inS=false;continue;}if(inD){if(c==='"')inD=false;continue;}if(inT){if(c==='`')inT=false;continue;}
    if(c==='/'&&n==='/'){lineComment=true;i++;continue;}if(c==='/'&&n==='*'){blockComment=true;i++;continue;}
    if(c==="'"){inS=true;continue;}if(c==='"'){inD=true;continue;}if(c==='`'){inT=true;continue;}
    if(c==='{')depth++;else if(c==='}'&&--depth===0)return{start:start,end:i+1};
  }
  throw new Error('Unterminated function '+name);
}
function insertBeforeAnchor_(code){const i=s.indexOf(anchor);if(i<0)throw new Error('release identity anchor missing');s=s.slice(0,i)+code+'\n'+s.slice(i);}
function add_(token,code){if(!s.includes(token))insertBeforeAnchor_(code);}
function appendToFunction_(name,marker,code){if(s.includes(marker))return;const r=functionRange_(name);if(!r)throw new Error(name+' missing');const close=r.end-1;s=s.slice(0,close)+code+s.slice(close);}

add_('function ashbyPublicPostingCoordinates_(',`function ashbyPublicPostingCoordinates_(url){const m=String(url||'').match(/^https?:\\/\\/jobs\\.ashbyhq\\.com\\/([^\\/?#]+)\\/([0-9a-f-]{36})(?:[\\/?#]|$)/i);return m?{slug:m[1],id:m[2]}:null;}`);
add_('function ashbyPublicPostingFetch_(',`function ashbyPublicPostingFetch_(url){const c=ashbyPublicPostingCoordinates_(url);if(!c)return{ok:false,provider:'ASHBY_PUBLIC_API',url:String(url||''),error:'NOT_ASHBY_POSTING'};try{const api='https://api.ashbyhq.com/posting-api/job-board/'+encodeURIComponent(c.slug)+'?includeCompensation=true',r=UrlFetchApp.fetch(api,{method:'get',followRedirects:true,muteHttpExceptions:true,headers:{'User-Agent':'JanuJobCopilot/1.0'}}),code=Number(r.getResponseCode()),body=String(r.getContentText()||'');if(code<200||code>=300)return{ok:false,provider:'ASHBY_PUBLIC_API',url:String(url),httpStatus:code,error:'HTTP_'+code};const j=body?JSON.parse(body):{},jobs=Array.isArray(j.jobs)?j.jobs:[],x=jobs.find(q=>String(q.id||'').toLowerCase()===String(c.id).toLowerCase()||String(q.jobUrl||'').toLowerCase().indexOf(String(c.id).toLowerCase())>=0);if(!x)return{ok:false,provider:'ASHBY_PUBLIC_API',url:String(url),httpStatus:code,explicitClosed:true,error:'POSTING_NOT_ON_PUBLIC_BOARD'};return{ok:true,provider:'ASHBY_PUBLIC_API',url:String(x.jobUrl||url),httpStatus:code,content:JSON.stringify(x),retrievedAt:iso_(),confidence:0.98,explicitOpen:x.isListed!==false,job:x};}catch(e){return{ok:false,provider:'ASHBY_PUBLIC_API',url:String(url||''),error:String(e&&e.message||e)};}}`);
add_('function p1aJdTextFromRetrieval_(',`function p1aJdTextFromRetrieval_(url,r){r=r||{};const content=String(r.content||'');if(!content)return'';if(String(r.provider||'')==='ASHBY_PUBLIC_API')return content;try{const d=deterministicJobParse_(url||r.url||'',content);if(d&&d.ok&&d.job)return JSON.stringify(d.job);}catch(e){}const t=String(content).replace(/<script[\\s\\S]*?<\\/script>/gi,' ').replace(/<style[\\s\\S]*?<\\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\\s+/g,' ').trim();return t.length>=800?t:'';}`);
add_('function p1aJdRetrieveForApp_(',`function p1aJdRetrieveForApp_(a,allowPaid){a=a||{};const urls=[a['Canonical Apply URL'],a['Job URL']].filter(Boolean),attempts=[];for(const url of urls){if(atsHostKind_(url)==='ASHBY'){const x=ashbyPublicPostingFetch_(url);attempts.push({provider:x.provider,ok:x.ok,httpStatus:x.httpStatus||null,error:x.error||null});if(x.ok||x.explicitClosed)return Object.assign(x,{attempts:attempts});}const r=retrievalGatewayFetch_({officialUrl:url,query:[a['Company'],a['Role'],url].filter(Boolean).join(' '),allowPaid:allowPaid===true});(r.attempts||[]).forEach(q=>attempts.push(q));const txt=p1aJdTextFromRetrieval_(url,r);if(r.explicitClosed)return Object.assign(r,{attempts:attempts});if(r.ok&&txt)return Object.assign(r,{content:txt,attempts:attempts});}return{ok:false,provider:'UNAVAILABLE',url:String(urls[0]||''),attempts:attempts,error:'NO_SUFFICIENT_JD_EVIDENCE'};}`);
add_('function p1aRecordJdRetrieval_(',`function p1aRecordJdRetrieval_(appId,r){const row=find_(JC.S.A,appId);if(!row)return null;const sheet=SH_(JC.S.A),headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0],h=p1aHeaderMap_(headers),needed=['Last Vacancy Verified At','Vacancy Status','Vacancy Verification Source','Vacancy Evidence Hash','Vacancy Verification URL','Vacancy Verification Confidence'];if(needed.some(k=>h[k]===undefined))return null;const state=r&&r.explicitClosed?'CLOSED':r&&r.explicitOpen?'OPEN':p1aVacancyFromRetrieval_(r||{});return p1aWriteVacancyEvidence_(sheet,row,h,r||{},state);}`);
add_('function p1aJdRecoveryCandidate_(',`function p1aJdRecoveryCandidate_(a){a=a||{};const url=String(a['Canonical Apply URL']||a['Job URL']||'');return String(a['Decision']||'')==='Apply'&&String(a['Blocker Category']||'')==='full_jd_unavailable'&&String(a['Status']||'')==='Blocked'&&atsHostKind_(url)==='ASHBY'&&!!ashbyPublicPostingCoordinates_(url);}`);
add_('function p1aJdRecoveryMaintenanceTick_(',`function p1aJdRecoveryMaintenanceTick_(){const sheet=SH_(JC.S.A),last=Math.min(sheet.getLastRow(),250);if(last<2)return{status:'NO_ROWS'};for(let row=2;row<=last;row++){const a=obj_(sheet,row);if(!p1aJdRecoveryCandidate_(a))continue;const id=String(a['Application ID']||'');try{const out=workerJD_(id,{recoveryTick:true});upsertWorkerState_('p1a_jd_recovery_last_result','PASS',JSON.stringify({applicationId:id,result:out||null}).slice(0,1500));return{status:'RECOVERED',applicationId:id};}catch(e){const msg=String((e&&e.message)||e);upsertWorkerState_('p1a_jd_recovery_last_result',msg.indexOf('USER_BLOCKER:')===0?'NO_RECOVERY':'FAIL',JSON.stringify({applicationId:id,error:msg}).slice(0,1500));return{status:msg.indexOf('USER_BLOCKER:')===0?'NO_RECOVERY':'FAIL',applicationId:id,error:msg};}}upsertWorkerState_('p1a_jd_recovery_last_result','NO_ELIGIBLE_BLOCKERS','bounded scan complete');return{status:'NO_ELIGIBLE_BLOCKERS'};}`);
add_('function p1aJdWorkerSelfTest_(',`function p1aJdWorkerSelfTest_(){const c=[],a=ashbyPublicPostingCoordinates_('https://jobs.ashbyhq.com/metaforms/d6406949-6a4b-44b0-af33-cefdf02afc72');c.push(!!a&&a.slug==='metaforms'&&a.id==='d6406949-6a4b-44b0-af33-cefdf02afc72');c.push(!ashbyPublicPostingCoordinates_('https://example.com/job'));c.push(p1aJdTextFromRetrieval_('https://jobs.ashbyhq.com/x/00000000-0000-0000-0000-000000000000',{provider:'ASHBY_PUBLIC_API',content:JSON.stringify({title:'Product Manager',descriptionPlain:'x'.repeat(900)})}).length>900);c.push(p1aJdRecoveryCandidate_({'Decision':'Apply','Status':'Blocked','Blocker Category':'full_jd_unavailable','Canonical Apply URL':'https://jobs.ashbyhq.com/x/00000000-0000-0000-0000-000000000000'})===true);if(c.some(x=>!x))throw new Error('P1-A JD worker self-test failed '+JSON.stringify(c));return{pass:true,total:c.length,contract:'P1-A-JD-WORKER-1'};}`);
add_('function runP1AJdWorkerSelfTest()',`function runP1AJdWorkerSelfTest(){const x=p1aJdWorkerSelfTest_();upsertWorkerState_('p1a_jd_worker_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));upsertWorkerState_('p1a_jd_worker_contract_version','P1-A-JD-WORKER-1','RetrievalProvider-backed JD recovery with Ashby public posting adapter');return x;}`);

function replaceHelper_(name,code){const r=functionRange_(name);if(r)s=s.slice(0,r.start)+code+s.slice(r.end);else insertBeforeAnchor_(code);}
replaceHelper_('jdCompletenessPercent_', `function jdCompletenessPercent_(raw){
  if(typeof raw!=='number' && typeof raw!=='string')return NaN;
  const text=String(raw == null ? '' : raw).trim();
  const explicit=text.endsWith('%');
  const numeric=(explicit ? text.slice(0,-1) : text).trim();
  if(!/^(?:[0-9]+(?:\\.[0-9]+)?|\\.[0-9]+)$/.test(numeric))return NaN;
  const number=Number(numeric);
  if (!Number.isFinite(number) || number<0 || number>100) return NaN;
  return !explicit && number<=1 ? number*100 : number;
}`);
replaceHelper_('jdReadbackPercent_', `function jdReadbackPercent_(application){return jdCompletenessPercent_(application && application['JD Completeness %']);}`);
// Normalize the shared parser result before any durable write, including PDF callers.
const parserRange=functionRange_('parseSaveJD_');
let parser=s.slice(parserRange.start,parserRange.end);
const normalization="d.completeness=jdCompletenessPercent_(d.completeness);if(!Number.isFinite(d.completeness))throw new Error('DETERMINISTIC:P1A_JD_PERSISTENCE_OR_COMPLETENESS_FAILED');";
if(!parser.includes(normalization)){
  const boundaries=[...parser.matchAll(/const snapshotId\s*=/g)];
  if(boundaries.length!==1 || !parser.includes('persistJDArtifact_(appId,snapshotId,d)'))throw new Error('Unknown parseSaveJD_ persistence boundary');
  const i=boundaries[0].index;parser=parser.slice(0,i)+normalization+'\n  '+parser.slice(i);
  s=s.slice(0,parserRange.start)+parser+s.slice(parserRange.end);
}
replaceHelper_('jdVerifySaved_', `function jdVerifySaved_(id,artifact,canonical){
  const ar=find_(JC.S.A,id),jr=find_(JC.S.JD,id,'Application ID');
  const a=ar?obj_(SH_(JC.S.A),ar):{},j=jr?obj_(SH_(JC.S.JD),jr):{};
  const complete=jdReadbackPercent_(a),stored=jdCompletenessPercent_(artifact && artifact.completeness),snapshot=jdCompletenessPercent_(j['Completeness %']);
  if(!ar||!jr||!artifact||!Number.isFinite(complete)||complete<70||complete!==stored||complete!==snapshot)throw new Error('DETERMINISTIC:P1A_JD_PERSISTENCE_OR_COMPLETENESS_FAILED');
  const expectedStatus=complete>=90?'Verified Full JD':'Partial JD';
  if(canonical && (Number(a['JD Completeness %'])!==complete || Number(j['Completeness %'])!==complete || a['Status']!=='Scoring' || a['JD Snapshot Status']!==expectedStatus || j['Snapshot Status']!==expectedStatus || a['Blocker Category'] || a['Exact Input Needed']))throw new Error('DETERMINISTIC:P1A_JD_PERSISTENCE_OR_COMPLETENESS_FAILED');
  return {row:ar,snapshotRow:jr,application:a,completeness:complete};
}`);
replaceHelper_('jdPrepareExisting_', `function jdPrepareExisting_(id,artifact){
  const saved=jdVerifySaved_(id,artifact),a=saved.application,c=saved.completeness;
  if(!['New','Apply'].includes(String(a['Decision']))||!['New','Verifying JD','Scoring','Blocked'].includes(String(a['Status'])) || (a['Blocker Category'] && a['Blocker Category']!=='full_jd_unavailable') || (a['Exact Input Needed'] && a['Blocker Category']!=='full_jd_unavailable'))throw new Error('JD_SCORE_ADMISSION_UNVERIFIED');
  const snapshotStatus=c>=90?'Verified Full JD':'Partial JD';
  set_(JC.S.JD,saved.snapshotRow,{'Completeness %':c,'Snapshot Status':snapshotStatus});
  set_(JC.S.A,saved.row,{'JD Completeness %':c,'JD Snapshot Status':snapshotStatus,'Status':'Scoring','Blocker Category':'','Exact Input Needed':''});
  const after=jdVerifySaved_(id,loadJDArtifact_(id),true);
  return after;
}`);
add_('function jdAdmitScore_(', `function jdAdmitScore_(id,payload,input){
  const worker=JC.W.SCORE;
  const job=enqueue_(id,worker,payload,input);
  if(job)return job;
  const existing=typeof ownedFindQueueAdmission_==='function' && ownedFindQueueAdmission_(id,worker,input);
  if(existing && existing.queueJobId)return existing.queueJobId;
  throw new Error('JD_SCORE_ADMISSION_UNVERIFIED');
}`);
const worker=`function workerJD_(appId,p){
  const r=find_(JC.S.A,appId);if(!r)throw new Error('Application missing '+appId);const a=obj_(SH_(JC.S.A),r);
  const existing=loadJDArtifact_(appId),existingCompleteness=jdReadbackPercent_(a);
  if(existing && existingCompleteness>=70){
    jdPrepareExisting_(appId,existing);
    const q=jdAdmitScore_(appId,{source:'p1a-jd-existing'},hash_(appId+'|'+hash_(JSON.stringify(existing))+'|p1a-jd-score'));
    set_(JC.S.A,r,{'Status':'Scoring','Blocker Category':'','Exact Input Needed':'','Your Required Action':'No action','Last Operator Update':now_(),'Next Action':'System-owned: canonical JD already exists; scoring queued.'});
    resolve_(appId,'Canonical JD already available');
    upsertWorkerState_('p1a_jd_last_result','PASS',JSON.stringify({applicationId:appId,mode:'EXISTING_ARTIFACT',queueJobId:q}));
    return{status:'EXISTING_ARTIFACT',queueJobId:q};
  }
  const ret=p1aJdRetrieveForApp_(a,false);p1aRecordJdRetrieval_(appId,ret);
  if(ret.explicitClosed){set_(JC.S.A,r,{'Status':'Closed','Submission Ready?':'No','Blocker Category':'','Exact Input Needed':'','Your Required Action':'No action','Next Action':'Official ATS no longer lists this vacancy.','Last Operator Update':now_(),'State Consistency':'OK'});resolve_(appId,'Vacancy closed');upsertWorkerState_('p1a_jd_last_result','CLOSED',JSON.stringify({applicationId:appId,provider:ret.provider,url:ret.url}));return{status:'CLOSED',provider:ret.provider};}
  const raw=p1aJdTextFromRetrieval_(ret.url||a['Canonical Apply URL']||a['Job URL'],ret);
  if(!ret.ok||!raw){block_(appId,a['Company'],a['Role'],'JD Capture','Open the job, expand the full description, Save as PDF, upload it to Job Copilot â€” JD Captures as '+appId+'.pdf. No summary is needed.',a['Job URL']||a['Canonical Apply URL']);set_(JC.S.A,r,{'Status':'Blocked','Blocker Category':'full_jd_unavailable','Exact Input Needed':'Upload full JD PDF named '+appId+'.pdf','Your Required Action':'Upload the JD PDF; automation resumes automatically.'});upsertWorkerState_('p1a_jd_last_result','USER_BLOCKER',JSON.stringify({applicationId:appId,provider:ret.provider,error:ret.error||'NO_SUFFICIENT_JD_EVIDENCE'}));throw new Error('USER_BLOCKER: JD unavailable');}
  parseSaveJD_(appId,a,ret.url||a['Canonical Apply URL']||a['Job URL'],raw);
  const artifact=loadJDArtifact_(appId),complete=jdVerifySaved_(appId,artifact,true).completeness;
  const q=jdAdmitScore_(appId,{source:'p1a-jd-recovery',provider:ret.provider},hash_(appId+'|'+hash_(JSON.stringify(artifact))+'|p1a-jd-score'));
  upsertWorkerState_('p1a_jd_last_result','PASS',JSON.stringify({applicationId:appId,provider:ret.provider,url:ret.url,completeness:complete,queueJobId:q}).slice(0,1500));
  return{status:'RECOVERED',provider:ret.provider,completeness:complete,queueJobId:q};
}`;
const wr=functionRange_('workerJD_');if(!wr)throw new Error('workerJD_ missing');
const oldWorker=s.slice(wr.start,wr.end);
if (oldWorker.includes('P1-A-JD-WORKER-1') && !oldWorker.includes('jdReadbackPercent_(')) {
  // Previously customized handlers must be reconciled before replacement.
  throw new Error('Existing custom JD worker requires reviewed migration');
}
if(oldWorker!==worker)s=s.slice(0,wr.start)+worker+s.slice(wr.end);

appendToFunction_('phase1HealthTick',"runP1AJdWorkerSelfTest();",`try{runP1AJdWorkerSelfTest();}catch(e){upsertWorkerState_('p1a_jd_worker_self_test','FAIL',String((e&&e.stack)||e).slice(0,1500));}try{p1aJdRecoveryMaintenanceTick_();}catch(e){upsertWorkerState_('p1a_jd_recovery_last_result','FAIL',String((e&&e.stack)||e).slice(0,1500));}`);

for(const token of ['function ashbyPublicPostingCoordinates_(','function ashbyPublicPostingFetch_(','function p1aJdTextFromRetrieval_(','function p1aJdRetrieveForApp_(','function p1aRecordJdRetrieval_(','function p1aJdRecoveryCandidate_(','function p1aJdRecoveryMaintenanceTick_(','function p1aJdWorkerSelfTest_(','function runP1AJdWorkerSelfTest()','p1a_jd_worker_self_test','p1a_jd_recovery_last_result','P1-A-JD-WORKER-1'])if(!s.includes(token))throw new Error('P1-A JD worker wiring missing '+token);
if(!s.includes("p1aJdRetrieveForApp_(a,false)"))throw new Error('JD worker must keep paid search fallback disabled until P1-B runtime enforcement');
if(s!==before)fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,workstream:'P1-A-jd-worker',contract:'P1-A-JD-WORKER-1',ashbyPublicApi:true,paidSearchFallbackAllowed:false,recoveryMaxRows:250,recoveryMaxAppsPerHealthTick:1},null,2));
