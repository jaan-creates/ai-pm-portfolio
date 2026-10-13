import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-project-dedupe-'));
try{
  const src="function rendererCareerBreakExperienceLines_(){return [];}\nfunction esc_(s){return s;}\nfunction render_(v,d){const b={findText(){return null}};const ex={independent_break:{key:'independent_break'}};function block(token,items){return items;}block('{{PROJECT_BULLETS}}',(d.projects||[]).map(x=>x.text));return b;}\n";
  fs.writeFileSync(path.join(dir,'TrackerWorkflow.js'),src);
  const p=path.resolve(path.dirname(new URL(import.meta.url).pathname),'patch-renderer-project-dedupe.mjs');
  const r=spawnSync(process.execPath,[p,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);
  const out=fs.readFileSync(path.join(dir,'TrackerWorkflow.js'),'utf8');
  for(const token of ['RENDER-CAREERBREAK-PROJECT-DEDUPE-001','function rendererCareerBreakProjectItems_(','rendererCareerBreakProjectItems_(ex.independent_break','rendererRemovePlaceholderParagraph_'])if(!out.includes(token))throw new Error('missing '+token);
  const start=out.indexOf('function rendererCareerBreakProjectItems_('),end=out.indexOf('function rendererRemovePlaceholderParagraph_(');const helper=out.slice(start,end);
  const ctx={};vm.createContext(ctx);vm.runInContext(helper+';this.f=rendererCareerBreakProjectItems_;',ctx);
  const projects=['Morning Brief duplicate','Job Copilot duplicate'];
  if(ctx.f({key:'independent_break'},projects).length!==0)throw new Error('independent-break project duplicates were not suppressed');
  if(ctx.f(null,projects).length!==2)throw new Error('standalone project block was incorrectly suppressed');
  const ck=spawnSync(process.execPath,['--check',path.join(dir,'TrackerWorkflow.js')],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr);
  console.log(JSON.stringify({status:'PASS',contract:'RENDER-CAREERBREAK-PROJECT-DEDUPE-001',duplicateProjectsSuppressed:true,standaloneProjectsPreserved:true}));
}finally{fs.rmSync(dir,{recursive:true,force:true});}
