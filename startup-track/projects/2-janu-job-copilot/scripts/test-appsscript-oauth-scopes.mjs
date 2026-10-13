import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-oauth-scope-test-'));
try{
  fs.writeFileSync(path.join(dir,'appsscript.json'),JSON.stringify({
    timeZone:'Asia/Calcutta',
    dependencies:{},
    exceptionLogging:'STACKDRIVER',
    runtimeVersion:'V8',
    oauthScopes:['https://www.googleapis.com/auth/spreadsheets']
  },null,2));
  fs.writeFileSync(path.join(dir,'TrackerWorkflow.js'),`
function probe(){
  SpreadsheetApp.getActive();
  DriveApp.getRootFolder();
  DocumentApp.create('x');
  UrlFetchApp.fetch('https://example.com');
  ScriptApp.getProjectTriggers();
}
`);
  const script=path.resolve(path.dirname(new URL(import.meta.url).pathname),'patch-appsscript-oauth-scopes.mjs');
  const run=spawnSync(process.execPath,[script,dir],{encoding:'utf8'});
  if(run.status!==0) throw new Error(run.stderr||run.stdout);
  const m=JSON.parse(fs.readFileSync(path.join(dir,'appsscript.json'),'utf8'));
  for(const scope of [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/script.external_request',
    'https://www.googleapis.com/auth/script.scriptapp'
  ]) if(!m.oauthScopes.includes(scope)) throw new Error('missing '+scope);
  const check=spawnSync(process.execPath,[script,dir,'--check'],{encoding:'utf8'});
  if(check.status!==0) throw new Error(check.stderr||check.stdout);
  console.log(JSON.stringify({status:'PASS',contract:'OWNER-SCOPE-DELTA-002',scopeCount:m.oauthScopes.length}));
} finally {
  fs.rmSync(dir,{recursive:true,force:true});
}
