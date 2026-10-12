// JANU-RUNTIME-READONLY-2. Offline-contract-tested, direct Google Apps Script API read.
// Not an Apps Script executor or production deployment path. NEVER print OAuth secrets or source.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const READ_SCOPE='https://www.googleapis.com/auth/script.projects.readonly';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const fail=code=>{throw new Error(code)};
export function checkScopes(scope){
  if(typeof scope!=='string')return false;
  const a=scope.trim().split(/\s+/).filter(Boolean);
  return a.length===1&&a[0]===READ_SCOPE;
}
export function hashSource(files){
  if(!Array.isArray(files))fail('INVALID_PROJECT_CONTENT');
  const names=new Set();
  const code=[];
  for(const f of files){
    if(f?.type!=='SERVER_JS')continue;
    if(typeof f.name!=='string'||!/^[\w.-]+$/.test(f.name)||typeof f.source!=='string')fail('INVALID_SCRIPT_FILE');
    const filename=f.name+'.js';
    if(names.has(filename))fail('DUPLICATE_SCRIPT_FILE');
    names.add(filename);
    code.push({name:filename,hash:sha(Buffer.from(f.source,'utf8'))});
  }
  if(!code.length)fail('NO_SERVER_JS_FILES');
  code.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  const source_sha256=sha(code.map(f=>f.name+':'+f.hash).join('\n'));
  return {source_sha256,source_files:code.length};
}
export function releaseIdentity(files){
  const source=files.filter(f=>f?.type==='SERVER_JS').map(f=>f.source).join('\n');
  const version=source.match(/P12\s*=\s*Object\.freeze\(\{[\s\S]*?VERSION\s*:\s*['"]([^'"]+)['"]/);
  const suite=source.match(/P12\s*=\s*Object\.freeze\(\{[\s\S]*?SUITE\s*:\s*['"]([^'"]+)['"]/);
  if(!version||!suite)fail('RELEASE_IDENTITY_UNAVAILABLE');
  return {release_version:version[1],regression_suite:suite[1]};
}
async function expectJson(response,code){
  if(!response.ok)fail(code);
  try{return await response.json();}catch{fail(code);}
}
async function inspect(){
  let credentials,project;
  try{
    credentials=JSON.parse(process.env.JANU_INSPECT_OAUTH_JSON||'');
    project=JSON.parse(process.env.JANU_CLASP_JSON||'');
  }catch{fail('AUDITOR_CONFIGURATION_MISSING');}
  if(!credentials||!project||typeof credentials.client_id!=='string'||typeof credentials.client_secret!=='string'||typeof credentials.refresh_token!=='string'||typeof project.scriptId!=='string'||!/^[A-Za-z0-9_-]{15,300}$/.test(project.scriptId))fail('INVALID_AUDITOR_CONFIGURATION');
  const body=new URLSearchParams({client_id:credentials.client_id,client_secret:credentials.client_secret,refresh_token:credentials.refresh_token,grant_type:'refresh_token'});
  const token=await expectJson(await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,redirect:'error'}),'TOKEN_EXCHANGE_FAILED');
  if(typeof token.access_token!=='string'||!token.access_token)fail('NO_ACCESS_TOKEN');
  let scopes=token.scope;
  if(typeof scopes!=='string'){
    const t=await expectJson(await fetch('https://oauth2.googleapis.com/tokeninfo?access_token='+encodeURIComponent(token.access_token),{redirect:'error'}),'SCOPE_INTROSPECTION_FAILED');
    scopes=t.scope;
  }
  if(!checkScopes(scopes))fail('PRIVILEGE_SCOPE_VIOLATION');
  const endpoint='https://script.googleapis.com/v1/projects/'+encodeURIComponent(project.scriptId)+'/content';
  const payload=await expectJson(await fetch(endpoint,{headers:{Authorization:'Bearer '+token.access_token},redirect:'error'}),'SCRIPT_CONTENT_READ_FAILED');
  if(payload?.scriptId!==project.scriptId)fail('PROJECT_IDENTITY_MISMATCH');
  const identity=releaseIdentity(payload.files||[]);
  const hashed=hashSource(payload.files);
  return {contract:'JANU-READONLY-RUNTIME-SNAPSHOT-2',observed_at:new Date().toISOString(),inspector_git_sha:process.env.GITHUB_SHA||null,github_run_id:process.env.GITHUB_RUN_ID||null,project_id_sha256:sha(project.scriptId),runtime_target:'APPS_SCRIPT_PROJECT_HEAD',credential_scope:'script.projects.readonly',scope_check:'EXACT_READONLY_SCOPE',...identity,...hashed,hash_semantics:'JANU-DEPLOYMENT-MANIFEST-1 / API_SERVER_JS_AS_DOT_JS_UTF8',private_tracker_hash_comparison:'PENDING_INDEPENDENT_READBACK',pinned_deployment_version:'NOT_INSPECTED',trigger_inventory:'NOT_INSPECTED',worker_execution:'NOT_RUN',source_body_in_artifact:false};
}
function selfTest(){
 let checks=0;
 const test=fn=>{fn();checks++};
 test(()=>assert(checkScopes(READ_SCOPE)));
 test(()=>assert(!checkScopes('https://www.googleapis.com/auth/script.projects')));
 test(()=>assert(!checkScopes(READ_SCOPE+' https://www.googleapis.com/auth/drive')));
 test(()=>assert(!checkScopes('')));
 const fixture=[{name:'B',type:'SERVER_JS',source:'const b=2;'},{name:'A',type:'SERVER_JS',source:'const a=1;'},{name:'appsscript',type:'JSON',source:'{}'}];
 test(()=>assert.equal(hashSource(fixture).source_sha256,hashSource([...fixture].reverse()).source_sha256));
 test(()=>assert.notEqual(hashSource(fixture).source_sha256,hashSource([{...fixture[0],source:'const b=3;'},...fixture.slice(1)]).source_sha256));
 test(()=>assert.throws(()=>hashSource([{...fixture[0]},{...fixture[0]}]),/DUPLICATE_SCRIPT_FILE/));
 test(()=>assert.throws(()=>hashSource([{name:'a',type:'JSON',source:'{}'}]),/NO_SERVER_JS_FILES/));
 test(()=>assert.deepEqual(releaseIdentity([{name:'X',type:'SERVER_JS',source:'const P12 = Object.freeze({ VERSION: "1.3.8", SUITE: "p0-regression-v19" });'}]),{release_version:'1.3.8',regression_suite:'p0-regression-v19'}));
 test(()=>assert.throws(()=>releaseIdentity(fixture),/RELEASE_IDENTITY_UNAVAILABLE/));
 console.log(JSON.stringify({contract:'JANU-READONLY-RUNTIME-SNAPSHOT-2',status:'PASS',checks,network:'NOT_USED',worker_execution:'NOT_RUN'}));
}
const mode=process.argv[2];
if(mode==='--self-test'){selfTest();}
else if(mode==='--inspect'){
  try{const result=await inspect();fs.writeFileSync('/tmp/janu-runtime-observation.json',JSON.stringify(result,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({contract:result.contract,source_sha256:result.source_sha256,release_version:result.release_version,regression_suite:result.regression_suite,scope_check:result.scope_check,runtime_target:result.runtime_target,worker_execution:result.worker_execution}));}
  catch(e){console.error('ASSURANCE_BLOCKED: '+(e?.message||'UNKNOWN').replace(/[^A-Z0-9_]/g,'').slice(0,90));process.exitCode=1;}
}else{console.error('Usage: --self-test or --inspect');process.exitCode=2;}
