import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const base=path.resolve(path.dirname(new URL(import.meta.url).pathname),'patch-trace-golden-v0.mjs');
const run=spawnSync(process.execPath,[base,root],{encoding:'utf8'});
if(run.status!==0)throw new Error(run.stderr||run.stdout||'base TRACE patch failed');
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function traceGoldenTick_(')&&t.includes('const P12');});
if(!target)throw new Error('TRACE patched TrackerWorkflow source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');
const bad=".replace(//$/,'')";
const good=".replace(/[/]$/,'')";
const count=s.split(bad).length-1;
if(count>1)throw new Error('Unexpected repeated malformed slash matcher: '+count);
if(count===1){s=s.replace(bad,good);fs.writeFileSync(file,s);}
if(!s.includes(good))throw new Error('Safe slash matcher missing after TRACE normalization');
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('TRACE transformed source remains invalid: '+syntax.stderr);
console.log(JSON.stringify({status:'PASS',file:target,basePatch:'TRACE-GOLDEN-V0-1',generatedEscapeRepairs:count,generatedSyntax:true},null,2));
