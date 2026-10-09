import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>fs.readFileSync(path.join(root,f),'utf8').includes('function forceOwnerAuthorization'));
if(!target)throw new Error('Owner authorization function missing');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');
const re=/function forceOwnerAuthorization\(\)[\s\S]*?\}/;
if(!re.test(s))throw new Error('Owner authorization function body missing');
const fn="function forceOwnerAuthorization(){ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);const triggers=ScriptApp.getProjectTriggers();return{pass:true,contract:'OWNER-AUTHORIZATION-SCOPE-PROBE-001',triggerCount:triggers.length};}";
s=s.replace(re,fn);
if(!s.includes('OWNER-AUTHORIZATION-SCOPE-PROBE-001'))throw new Error('owner auth scope probe missing');
fs.writeFileSync(file,s);
const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr||'syntax failure');
console.log(JSON.stringify({status:'PASS',contract:'OWNER-AUTHORIZATION-SCOPE-PROBE-001',file:target},null,2));
