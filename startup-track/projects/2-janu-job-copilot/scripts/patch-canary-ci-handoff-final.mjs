import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>fs.readFileSync(path.join(root,f),'utf8').includes('function installOwnedRendererCanaryTrigger'));
if(!target)throw new Error('Canary handoff target missing');
const file=path.join(root,target);
const lines=fs.readFileSync(file,'utf8').split(/\r?\n/);
const lineIndex=lines.findIndex(line=>line.includes('function installOwnedRendererCanaryTrigger'));
if(lineIndex<0)throw new Error('Canary handoff function line missing');
lines[lineIndex]="function installOwnedRendererCanaryTrigger(){if(typeof runRendererAuthorizedCanaryEnqueue!=='function')throw new Error('DETERMINISTIC:CI_CANARY_ENQUEUE_ENTRYPOINT_MISSING');const out=runRendererAuthorizedCanaryEnqueue();return{pass:true,contract:'CONTROL-PLANE-CANARY-ONLY-001',telemetry:'CONTROL-PLANE-CANARY-TELEMETRY-001',queueJobId:String(out&&out.queueJobId||''),ciTriggerMutation:false};/* CANARY-CI-NO-SCRIPTAPP-001 */}";
const s=lines.join('\n');
if(!s.includes('CANARY-CI-NO-SCRIPTAPP-001')||!s.includes("ciTriggerMutation:false"))throw new Error('CI-safe canary handoff marker missing');
fs.writeFileSync(file,s);
const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
if(ck.status!==0)throw new Error(ck.stderr||'syntax failure');
console.log(JSON.stringify({status:'PASS',file:target,contract:'CANARY-CI-NO-SCRIPTAPP-001',ciTriggerMutation:false},null,2));
