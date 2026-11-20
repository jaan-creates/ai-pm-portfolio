import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || '.janu-live';
const file = path.join(root, 'TrackerWorkflow.js');
let source = fs.readFileSync(file, 'utf8');
const marker = 'SHEETS-FIRST-URL-INTAKE-001';
if (source.includes(marker)) {
  console.log(JSON.stringify({status:'PASS',changed:false,contract:marker}));
  process.exit(0);
}
const start = source.indexOf('function ownedSourceIntakeBootstrap_(e)');
const end = source.indexOf('function ownedApplyStatePlan_(a)', start);
if (start < 0 || end < 0 || source.indexOf('function ownedSourceIntakeBootstrap_(e)', start + 1) >= 0) {
  throw new Error('Unique owned source-intake boundary missing; refusing patch');
}

const replacement = String.raw`function p1aInboxCanonicalUrl_(input){
  const raw=String(input||'').trim(),m=raw.match(/^https?:\/\/([^/?#]+)([^?#]*)(?:\?([^#]*))?/i);
  if(!m)return'';
  const host=String(m[1]||'').toLowerCase().replace(/^www\./,'').replace(/^in\.linkedin\.com$/,'linkedin.com');
  let route=String(m[2]||'/').replace(/\/+$/,'')||'/';
  if(host==='linkedin.com'){
    const id=(route.match(/\/jobs\/view\/(?:[^/?#]*-)?(\d+)/i)||[])[1]||(String(m[3]||'').match(/(?:^|&)currentJobId=(\d+)/i)||[])[1];
    if(id)route='/jobs/view/'+id;
  }
  const official=/^(?:jobs\.ashbyhq\.com|jobs\.lever\.co|job-boards\.greenhouse\.io|linkedin\.com)$/.test(host);
  const query=official?'':String(m[3]||'').split('&').filter(x=>x&&!/^(?:utm_[^=]*|gh_src|trk|trackingId|refId)=/i.test(x)).sort().join('&');
  return 'https://'+host+route+(query?'?'+query:'');
}
function p1aInboxKey_(input){return p1aInboxCanonicalUrl_(input).toLowerCase();}
function p1aInboxExistingApplication_(url){
  const key=p1aInboxKey_(url),s=SH_(JC.S.A),m=hm_(s);
  if(!key||s.getLastRow()<2)return'';
  const rows=s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getDisplayValues();
  for(const row of rows){
    const id=String(row[m['Application ID']-1]||'');
    if(['Closed','Rejected','Submitted'].includes(String(row[m['Status']-1]||'')))continue;
    if(id&&(p1aInboxKey_(row[m['Canonical Apply URL']-1])===key||p1aInboxKey_(row[m['Job URL']-1])===key))return id;
  }
  return'';
}
function p1aInboxUniqueId_(s,m,r){
  const day=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Kolkata','yyyyMMdd');
  for(let n=0;n<12;n++){
    const code=String(Math.floor(Math.random()*1000000)).padStart(6,'0'),id='INT-'+day+'-'+code,prior=find_(JC.S.SRC,id,'Intake ID');
    if(!prior||prior===r)return id;
  }
  throw new Error('DETERMINISTIC:SOURCE_INTAKE_ID_COLLISION');
}
function p1aInboxProcessRow_(s,m,r){
  const read=k=>m[k]?String(s.getRange(r,m[k]).getDisplayValue()||'').trim():'';
  const original=read('Original URL'),canonical=p1aInboxCanonicalUrl_(original);
  if(!canonical)return false;
  let id=read('Intake ID');
  if(id){const prior=find_(JC.S.SRC,id,'Intake ID');if(prior&&prior!==r)throw new Error('DETERMINISTIC:SOURCE_INTAKE_DUPLICATE_ID:'+id);}
  else id=p1aInboxUniqueId_(s,m,r);
  const intent=read('Candidate Intent')||'Apply',stamp=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Kolkata','yyyy-MM-dd');
  const initial={'Intake ID':id,'Date Added':read('Date Added')||stamp,'Captured By':read('Captured By')||'Janu','Candidate Intent':intent,'Canonical URL':canonical};
  if(!read('Processing Status'))initial['Processing Status']='Queued for verification';
  set_(JC.S.SRC,r,initial);
  if(intent!=='Apply'){set_(JC.S.SRC,r,{'Processing Status':'On hold'});return true;}
  const linked=p1aInboxExistingApplication_(canonical);
  if(linked&&linked!==sourceApplicationId_(id)){
    set_(JC.S.SRC,r,{'Processing Status':'Linked to existing application','Duplicate Application ID':linked,'Promoted Application ID':linked,'Processed Date':now_()});
    return true;
  }
  const appId=sourceApplicationId_(id);
  if(!find_(JC.S.A,appId))append_(JC.S.A,{'Application ID':appId,'Date Added':now_(),'Job URL':original,'Source':'Sources Inbox / handpicked','Decision':'Apply','Status':'Verifying JD','Canonical Apply URL':canonical,'JD Snapshot Status':'Not Verified','Submission Ready?':'No','Your Required Action':'No action','Next Action':'System-owned: retrieve current official JD.','Last Operator Update':now_(),'Vacancy Status':'UNKNOWN','Resume Review Decision':'Not Ready','ATS QA Status':'Not Started'});
  const input=hash_(appId+'|JD_RETRIEVE|'+p1aInboxKey_(canonical)+'|SHEETS-FIRST-URL-INTAKE-001');
  const admitted=ownedEnsureQueueAdmission_(appId,JC.W.JD,{url:canonical,source:'sources-inbox-handpicked',contract:'SHEETS-FIRST-URL-INTAKE-001'},input,{recoverySafe:true});
  if(!admitted||!admitted.queueJobId)throw new Error('DETERMINISTIC:SOURCE_INTAKE_QUEUE_ADMISSION_MISSING:'+appId);
  set_(JC.S.SRC,r,{'Processing Status':'Promoted','Promoted Application ID':appId,'Processed Date':now_(),'Duplicate Application ID':'','Blocker Category':'','Exact Input Needed':''});
  upsertWorkerState_('sheets_first_last_intake',id,JSON.stringify({contract:'SHEETS-FIRST-URL-INTAKE-001',applicationId:appId,queueJobId:admitted.queueJobId,sourceRow:r}).slice(0,1500));
  return true;
}
function ownedSourceIntakeBootstrap_(e){
  if(!e||!e.range||!controlPlaneExecutionAuthorized_())return false;
  const s=e.range.getSheet();if(s.getName()!==JC.S.SRC||e.range.getRow()<2)return false;
  const m=ownedEditHeaderMap_(s),first=e.range.getColumn(),last=first+e.range.getNumColumns()-1;
  if(!m['Original URL']||!(first<=m['Original URL']&&m['Original URL']<=last||m['Candidate Intent']&&first<=m['Candidate Intent']&&m['Candidate Intent']<=last))return false;
  const lock=p04TrackedScriptLock_();if(!lock.tryLock(5000))throw new Error('temporarily unavailable source-intake lock');
  try{let handled=false;for(let r=e.range.getRow();r<e.range.getRow()+e.range.getNumRows();r++)handled=p1aInboxProcessRow_(s,m,r)||handled;return handled;}
  finally{lock.releaseLock();}
}/* SHEETS-FIRST-URL-INTAKE-001 */
`;
source = source.slice(0, start) + replacement + source.slice(end);
if (!source.includes('function ownedImmediateEditContract_(e){return ownedSourceIntakeBootstrap_(e)||ownedApplyAdmission_(e)')) throw new Error('Immediate edit entrypoint changed');
fs.writeFileSync(file, source);
console.log(JSON.stringify({status:'PASS',changed:true,contract:marker}));
