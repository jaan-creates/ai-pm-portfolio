import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.argv[2] || '.janu-live';
const full = fs.readFileSync(path.join(root, 'TrackerWorkflow.js'), 'utf8');
const first = full.indexOf('function p1aInboxCanonicalUrl_(input)');
const last = full.indexOf('function ownedApplyStatePlan_(a)', first);
assert.ok(first >= 0 && last > first, 'installed intake functions missing');
const code = full.slice(first, last);
const sourceHeaders = ['Intake ID','Date Added','Source','Original URL','Captured By','Candidate Intent','Processing Status','Resolved Company','Resolved Role','Canonical URL','Duplicate Application ID','Fit Result','Blocker Category','Exact Input Needed','Processed Date','Promoted Application ID'];
const appHeaders = ['Application ID','Date Added','Company','Role','Job URL','Source','Decision','Status','Canonical Apply URL','JD Snapshot Status','Submission Ready?','Your Required Action','Next Action','Last Operator Update','Vacancy Status','Resume Review Decision','ATS QA Status'];
const makeSheet = (name, headers, rows=[]) => ({name, headers, rows, getName(){return name},getLastColumn(){return headers.length},getLastRow(){return rows.length+1},getRange(r,c,h=1,w=1){return {getDisplayValue:()=>String(rows[r-2]?.[c-1]??''),getDisplayValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>r+i===1?headers[c+j-1]||'':String(rows[r+i-2]?.[c+j-1]??'')))}}});
const src = makeSheet('Sources Inbox', sourceHeaders, []);
const apps = makeSheet('Applications', appHeaders, []);
const sheets = {'Sources Inbox':src,Applications:apps};
const queue = new Map();
const state = new Map();
let failNextAdmission = false;
const headerMap = sh => Object.fromEntries(sh.headers.map((h,i)=>[h,i+1]));
const ctx = {
  JC:{S:{SRC:'Sources Inbox',A:'Applications'},W:{JD:'JD_RETRIEVE'}},
  SH_:name=>sheets[name], hm_:headerMap, ownedEditHeaderMap_:headerMap,
  find_:(name,id,field='Application ID')=>{const sh=sheets[name],idx=sh.headers.indexOf(field);const at=sh.rows.findIndex(r=>String(r[idx]||'')===String(id));return at<0?null:at+2},
  set_:(name,row,obj)=>{const sh=sheets[name],m=headerMap(sh),values=sh.rows[row-2];assert.ok(values);for(const [k,v] of Object.entries(obj)){assert.ok(m[k],k);values[m[k]-1]=v}},
  append_:(name,obj)=>{const sh=sheets[name],m=headerMap(sh),values=Array(sh.headers.length).fill('');for(const [k,v] of Object.entries(obj)){assert.ok(m[k],k);values[m[k]-1]=v}sh.rows.push(values)},
  sourceApplicationId_:id=>'APP-'+id,
  ownedEnsureQueueAdmission_:(id,type,payload,input)=>{if(failNextAdmission){failNextAdmission=false;throw new Error('SIMULATED_QUEUE_OUTAGE')}const key=id+'|'+type;if(!queue.has(key))queue.set(key,{id,type,payload,input,qid:'Q-'+(queue.size+1)});return {queueJobId:queue.get(key).qid}},
  p04TrackedScriptLock_:()=>({tryLock:()=>true,releaseLock:()=>{}}),
  controlPlaneExecutionAuthorized_:()=>true,
  Utilities:{formatDate:(_d,_tz,fmt)=>fmt==='yyyyMMdd'?'20261120':'2026-11-20'},
  Session:{getScriptTimeZone:()=> 'Asia/Kolkata'},
  now_:()=> '2026-11-20T12:00:00Z',
  hash_:x=>crypto.createHash('sha256').update(String(x)).digest('hex'),
  upsertWorkerState_:(k,v,d)=>state.set(k,{v,d}),
  Math, Date, JSON, String, Number, Error, Object, Array
};
vm.createContext(ctx);
vm.runInContext(code,ctx);
const edit=(row,col=4)=>({range:{getSheet:()=>src,getRow:()=>row,getColumn:()=>col,getNumRows:()=>1,getNumColumns:()=>1}});
const add=(url,intent='')=>{const row=Array(sourceHeaders.length).fill('');row[3]=url;row[5]=intent;src.rows.push(row);return src.rows.length+1};
const firstRow=add('https://job-boards.greenhouse.io/example/jobs/123?gh_src=campaign');
assert.equal(ctx.ownedSourceIntakeBootstrap_(edit(firstRow)),true);
assert.match(src.rows[0][0],/^INT-20261120-\d{6}$/);
assert.equal(src.rows[0][6],'Promoted');
assert.equal(src.rows[0][15],apps.rows[0][0]);
assert.equal(apps.rows.length,1);
assert.equal(queue.size,1);
assert.equal(apps.rows[0][6],'Apply');
assert.equal(apps.rows[0][7],'Verifying JD');
assert.equal(src.rows[0][9],'https://job-boards.greenhouse.io/example/jobs/123');

const duplicateRow=add('https://job-boards.greenhouse.io/example/jobs/123?utm_source=other');
assert.equal(ctx.ownedSourceIntakeBootstrap_(edit(duplicateRow)),true);
assert.equal(src.rows[1][6],'Linked to existing application');
assert.equal(src.rows[1][10],apps.rows[0][0]);
assert.equal(apps.rows.length,1);
assert.equal(queue.size,1);
assert.notEqual(src.rows[0][0],src.rows[1][0]);

assert.equal(ctx.ownedSourceIntakeBootstrap_(edit(firstRow)),true);
assert.equal(apps.rows.length,1);
assert.equal(queue.size,1);

const heldRow=add('https://jobs.ashbyhq.com/example/11111111-1111-1111-1111-111111111111','Hold');
assert.equal(ctx.ownedSourceIntakeBootstrap_(edit(heldRow)),true);
assert.equal(src.rows[2][6],'On hold');
assert.equal(apps.rows.length,1);
assert.equal(queue.size,1);

const collisionRow=add('https://jobs.lever.co/example/another');
src.rows[3][0]=src.rows[0][0];
assert.throws(()=>ctx.ownedSourceIntakeBootstrap_(edit(collisionRow)),/SOURCE_INTAKE_DUPLICATE_ID/);
assert.equal(apps.rows.length,1);
assert.equal(queue.size,1);

assert.equal(ctx.p1aInboxCanonicalUrl_('https://www.linkedin.com/jobs/search-results/?currentJobId=4440465375&trackingId=x'),'https://linkedin.com/jobs/view/4440465375');
assert.equal(ctx.p1aInboxCanonicalUrl_('https://in.linkedin.com/jobs/view/product-manager-at-company-4440465375?trk=x'),'https://linkedin.com/jobs/view/4440465375');
assert.notEqual(ctx.p1aInboxKey_('https://careers.example.com/posting?jobId=123&utm_source=x'),ctx.p1aInboxKey_('https://careers.example.com/posting?jobId=456&utm_source=x'));
apps.rows[0][7]='Closed';
const repostRow=add('https://job-boards.greenhouse.io/example/jobs/123?gh_src=repost');
assert.equal(ctx.ownedSourceIntakeBootstrap_(edit(repostRow)),true);
assert.equal(apps.rows.length,2);
assert.equal(queue.size,2);
assert.notEqual(apps.rows[0][0],apps.rows[1][0]);
const interruptedRow=add('https://jobs.lever.co/example/fresh-requisition');
const interruptedIndex=interruptedRow-2;
failNextAdmission=true;
assert.throws(()=>ctx.ownedSourceIntakeBootstrap_(edit(interruptedRow)),/SIMULATED_QUEUE_OUTAGE/);
const interruptedId=src.rows[interruptedIndex][0];
assert.equal(apps.rows.length,3);
assert.equal(src.rows[interruptedIndex][6],'Queued for verification');
assert.equal(ctx.ownedSourceIntakeBootstrap_(edit(interruptedRow)),true);
assert.equal(src.rows[interruptedIndex][0],interruptedId);
assert.equal(apps.rows.length,3);
assert.equal(queue.size,3);
assert.equal(src.rows[interruptedIndex][6],'Promoted');
console.log(JSON.stringify({status:'PASS',contract:'SHEETS-FIRST-URL-INTAKE-001',cases:8,scope:'source-level; installed Sheets runtime still required'}));
