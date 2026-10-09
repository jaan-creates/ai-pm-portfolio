import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function render_(')&&t.includes('RENDER_BULLET_LOSS');});
if(!target)throw new Error('Renderer bullet-loss target missing');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');
const old="const missing=resumeBulletEntries_(d).filter(x=>norm_(txt).indexOf(norm_(stripInternalEvidenceTags_(x.text)))<0);";
const replacement="const expectedEntries=resumeBulletEntries_(d).filter(x=>!(ex.independent_break&&/^(?:Morning Brief|Job Copilot)\\b/i.test(norm_(stripInternalEvidenceTags_(x.text)))));const missing=expectedEntries.filter(x=>norm_(txt).indexOf(norm_(stripInternalEvidenceTags_(x.text)))<0);/* RENDER-CAREERBREAK-PROJECT-DEDUPE-002 */";
if(!s.includes(replacement)){
  if(!s.includes(old))throw new Error('Renderer bullet-loss assertion anchor missing');
  s=s.replace(old,replacement);
}
if(!s.includes('RENDER-CAREERBREAK-PROJECT-DEDUPE-002'))throw new Error('Renderer bullet-loss dedupe contract missing');
fs.writeFileSync(file,s);
const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
if(ck.status!==0)throw new Error(ck.stderr||'syntax failure');
console.log(JSON.stringify({status:'PASS',file:target,contract:'RENDER-CAREERBREAK-PROJECT-DEDUPE-002',legacyProjectSummariesExcludedOnlyForIndependentBreak:true},null,2));
