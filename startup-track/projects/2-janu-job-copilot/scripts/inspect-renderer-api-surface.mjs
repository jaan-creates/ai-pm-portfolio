import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const s=fs.readFileSync(path.join(root,f),'utf8');return s.includes('function render_(')&&s.includes('function workerResume_(');});
if(!target)throw new Error('renderer surface missing');
const s=fs.readFileSync(path.join(root,target),'utf8');

function rangeOf(name){
 const start=s.indexOf('function '+name+'(');if(start<0)return null;
 const open=s.indexOf('{',start);let d=0,q=null,e=false,line=false,block=false;
 for(let i=open;i<s.length;i++){const c=s[i],n=s[i+1]||'';
  if(line){if(c==='\n')line=false;continue;}
  if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
  if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}
  if(c==='/'&&n==='/'){line=true;i++;continue;}
  if(c==='/'&&n==='*'){block=true;i++;continue;}
  if(c==='"'||c==="'"||c.charCodeAt(0)===96){q=c;continue;}
  if(c==='{')d++;else if(c==='}'&&--d===0)return{start,end:i+1};
 }
 throw new Error('unterminated '+name);
}
function analyze(name){
 const r=rangeOf(name);if(!r)return null;const body=s.slice(r.start,r.end);
 const calls=[...body.matchAll(/\b([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+)\s*\(/g)].map(m=>m[1]);
 const funcs=[...new Set(calls)].filter(x=>/DocumentApp|DriveApp|UrlFetchApp|ScriptApp|Utilities|render_|pack_|persist|find_|obj_|SH_|openById|makeCopy|replaceText|insert|append|set|saveAndClose|getBody|getId|getUrl|create|export/i.test(x));
 const identifiers=[...new Set((body.match(/\b(?:DocumentApp|DriveApp|UrlFetchApp|ScriptApp|MimeType|JC|P12)\b/g)||[]))];
 const returnExpr=[...body.matchAll(/return\s+([^;]{0,240});/g)].map(m=>m[1].replace(/(['"`])(?:\\.|(?!\1).)*\1/g,'<str>')).slice(-8);
 return{name,length:body.length,identifiers,calls:[...new Set(funcs)].slice(0,120),returnExpr,
  documentAppOps:[...new Set((body.match(/DocumentApp\.[A-Za-z_$][\w$]*/g)||[]))],
  driveAppOps:[...new Set((body.match(/DriveApp\.[A-Za-z_$][\w$]*/g)||[]))],
  urlFetchCount:(body.match(/UrlFetchApp\.fetch/g)||[]).length,
  literalTemplateTokens:[...new Set((body.match(/\{\{[A-Z0-9_]+\}\}/g)||[]))].slice(0,80)
 };
}
console.log(JSON.stringify({status:'PASS',contract:'RENDERER-SURFACE-DIAG-001',file:target,render:analyze('render_'),workerResume:analyze('workerResume_'),pack:analyze('pack_')},null,2));
