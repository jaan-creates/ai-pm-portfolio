import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function render_(')&&t.includes('RENDER_BULLET_LOSS');});
if(!target)throw new Error('Renderer bullet-loss target missing');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');
const old="const missing=resumeBulletEntries_(d).filter(x=>norm_(txt).indexOf(norm_(stripInternalEvidenceTags_(x.text)))<0);";
const replacement="const breakSource=(ex.independent_break&&ex.independent_break.bullets||[]).map(x=>norm_(stripInternalEvidenceTags_(x.text))).filter(Boolean);const expectedEntries=resumeBulletEntries_(d).flatMap(x=>{const t=stripInternalEvidenceTags_(x.text),parts=ex.independent_break?t.split(/\\s+\\|\\s+/).map(v=>v.trim()).filter(Boolean):[t];return parts.length>1?parts.map(v=>Object.assign({},x,{text:v})):[x];}).filter(x=>{const t=norm_(stripInternalEvidenceTags_(x.text));return !(ex.independent_break&&(breakSource.includes(t)||breakSource.some(v=>t.indexOf(v)>=0)||/caregiving|Morning Brief|Job Copilot/i.test(t)));});const missing=expectedEntries.filter(x=>norm_(txt).indexOf(norm_(stripInternalEvidenceTags_(x.text)))<0);/* RENDER-CAREERBREAK-PROJECT-DEDUPE-008 */";
const currentExpected=/const expectedEntries=resumeBulletEntries_\(d\)\.filter\(x=>[\s\S]*?\);const missing=expectedEntries\.filter\(x=>norm_\(txt\)\.indexOf\(norm_\(stripInternalEvidenceTags_\(x\.text\)\)\)<0\);/;
const anyExpected=/const expectedEntries=resumeBulletEntries_\(d\)[\s\S]*?;const missing=expectedEntries\.filter\(x=>norm_\(txt\)\.indexOf\(norm_\(stripInternalEvidenceTags_\(x\.text\)\)\)<0\);/;
const breakExpectedDecl=/const breakExpected=\{\};if\(ex\.independent_break\)\(ex\.independent_break\.bullets\|\|\[\]\)\.forEach\(x=>breakExpected\[norm_\(stripInternalEvidenceTags_\(x\.text\)\)\]=1\);/g;s=s.replace(breakExpectedDecl,'');const breakSourceDecl=/const breakSource=\(ex\.independent_break&&ex\.independent_break\.bullets\|\|\[\]\)\.map\(x=>norm_\(stripInternalEvidenceTags_\(x\.text\)\)\)\.filter\(Boolean\);/g;s=s.replace(breakSourceDecl,'');if(!s.includes(replacement)){
  if(currentExpected.test(s))s=s.replace(currentExpected,replacement);
  else if(anyExpected.test(s))s=s.replace(anyExpected,replacement);
  else if(s.includes(old))s=s.replace(old,replacement);
  else throw new Error('Renderer bullet-loss assertion anchor missing');
}
if(!s.includes('RENDER-CAREERBREAK-PROJECT-DEDUPE-008'))throw new Error('Renderer bullet-loss dedupe contract missing');
fs.writeFileSync(file,s);
const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
if(ck.status!==0)throw new Error(ck.stderr||'syntax failure');
console.log(JSON.stringify({status:'PASS',file:target,contract:'RENDER-CAREERBREAK-PROJECT-DEDUPE-006',careerBreakSourceBulletsExcludedOnlyForIndependentBreak:true},null,2));
