import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='RENDER-CAREERBREAK-PROJECT-DEDUPE-001';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function render_(')&&t.includes('function rendererCareerBreakExperienceLines_(');});
if(!target)throw new Error('Career-break renderer target missing');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');

function rangeOf(name){const start=s.indexOf('function '+name+'(');if(start<0)return null;const open=s.indexOf('{',start);let d=0,q=null,e=false,line=false,block=false;for(let i=open;i<s.length;i++){const c=s[i],n=s[i+1]||'';if(line){if(c==='\n')line=false;continue;}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0)return{start,end:i+1};}throw new Error('Unterminated '+name);}
function putFn(name,code,anchor){const r=rangeOf(name);if(r){s=s.slice(0,r.start)+code+s.slice(r.end);return;}const i=s.indexOf(anchor);if(i<0)throw new Error('Missing anchor '+anchor);s=s.slice(0,i)+code+'\n'+s.slice(i);}
function matchingParen(src,open){let d=0,q=null,e=false;for(let i=open;i<src.length;i++){const c=src[i];if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='(')d++;else if(c===')'&&--d===0)return i;}throw new Error('Unterminated PROJECT_BULLETS call');}
function topComma(src,open,close){let p=0,b=0,curl=0,q=null,e=false;for(let i=open+1;i<close;i++){const c=src[i];if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='(')p++;else if(c===')')p--;else if(c==='[')b++;else if(c===']')b--;else if(c==='{')curl++;else if(c==='}')curl--;else if(c===','&&p===0&&b===0&&curl===0)return i;}return -1;}

putFn('rendererCareerBreakProjectItems_',"function rendererCareerBreakProjectItems_(independentBreak,items){const xs=Array.isArray(items)?items:[];return independentBreak?[]:xs;/* RENDER-CAREERBREAK-PROJECT-DEDUPE-001 */}",'function render_(');
putFn('rendererRemovePlaceholderParagraph_',"function rendererRemovePlaceholderParagraph_(body,token){const f=body.findText(esc_(String(token||'')));if(!f)return false;let el=f.getElement();while(el&&el.getParent&&el.getParent()&&el.getType()!=DocumentApp.ElementType.PARAGRAPH&&el.getType()!=DocumentApp.ElementType.LIST_ITEM)el=el.getParent();if(el&&el.removeFromParent){el.removeFromParent();return true;}return false;/* RENDER-CAREERBREAK-PROJECT-DEDUPE-001 */}",'function render_(');

const rr=rangeOf('render_');if(!rr)throw new Error('render_ missing');let fn=s.slice(rr.start,rr.end);
if(!fn.includes(CONTRACT)){
  const needle="block('{{PROJECT_BULLETS}}'";
  const at=fn.indexOf(needle);if(at<0)throw new Error('PROJECT_BULLETS render call missing');
  const open=fn.indexOf('(',at),close=matchingParen(fn,open),comma=topComma(fn,open,close);if(comma<0)throw new Error('PROJECT_BULLETS argument separator missing');
  const arg=fn.slice(comma+1,close).trim();if(!arg)throw new Error('PROJECT_BULLETS source expression empty');
  const replacement="block('{{PROJECT_BULLETS}}',rendererCareerBreakProjectItems_(ex.independent_break,"+arg+"))/* "+CONTRACT+" */;if(ex.independent_break)rendererRemovePlaceholderParagraph_(b,'{{PROJECT_BULLETS}}')";
  fn=fn.slice(0,at)+replacement+fn.slice(close+1);
  s=s.slice(0,rr.start)+fn+s.slice(rr.end);
}
const fr=rangeOf('render_'),final=s.slice(fr.start,fr.end);
for(const token of [CONTRACT,"rendererCareerBreakProjectItems_(ex.independent_break","rendererRemovePlaceholderParagraph_(b,'{{PROJECT_BULLETS}}')"])if(!final.includes(token))throw new Error('Project dedupe render contract missing '+token);
if((final.match(/block\('\{\{PROJECT_BULLETS\}\}'/g)||[]).length!==1)throw new Error('Expected exactly one PROJECT_BULLETS block call');
fs.writeFileSync(file,s);
const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr||'syntax failure');
console.log(JSON.stringify({status:'PASS',contract:CONTRACT,file:target,independentBreakSuppressesProjectBlock:true},null,2));
