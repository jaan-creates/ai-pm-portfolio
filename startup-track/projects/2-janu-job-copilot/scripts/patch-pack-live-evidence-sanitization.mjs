import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function pack_(')&&t.includes('function stripInternalEvidenceTags_(')&&t.includes('function assertExternalTextClean_(');});
if(!target)throw new Error('Pack live-evidence sanitization target not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8');
function rangeOf(name){const start=s.indexOf('function '+name+'(');if(start<0)return null;const open=s.indexOf('{',start);let d=0,q=null,e=false,line=false,block=false;for(let i=open;i<s.length;i++){const c=s[i],n=s[i+1]||'';if(line){if(c==='\n')line=false;continue;}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0)return{start,end:i+1,open};}throw new Error('Unterminated '+name);}
const pack=rangeOf('pack_');if(!pack)throw new Error('pack_ missing');
if(!s.includes('function sanitizePackComposedBody_(')){
 const helper=`function sanitizePackComposedBody_(body){for(let i=0;i<body.getNumChildren();i++){const child=body.getChild(i);let text=null;try{text=child.editAsText();}catch(e){text=null;}if(!text)continue;const raw=String(text.getText()||''),clean=stripInternalEvidenceTags_(raw);if(raw!==clean)text.setText(clean);}const finalText=String(body.getText()||'');assertExternalTextClean_(finalText);return finalText;/* PACK-SAN-LIVE-EVIDENCE-001 */}`;
 s=s.slice(0,pack.start)+helper+'\n'+s.slice(pack.start);
}
const p2=rangeOf('pack_');let body=s.slice(p2.start,p2.end);
const anchor='assertExternalTextClean_(b.getText());doc.saveAndClose();';
if(!body.includes('PACK-SAN-LIVE-EVIDENCE-001')){
 if(!body.includes(anchor))throw new Error('pack cleanliness anchor missing');
 body=body.replace(anchor,"sanitizePackComposedBody_(b);/* PACK-SAN-LIVE-EVIDENCE-001 */doc.saveAndClose();");
 s=s.slice(0,p2.start)+body+s.slice(p2.end);
}
for(const token of ['PACK-SAN-LIVE-EVIDENCE-001','function sanitizePackComposedBody_(','stripInternalEvidenceTags_(raw)','assertExternalTextClean_(finalText)','sanitizePackComposedBody_(b)'])if(!s.includes(token))throw new Error('Missing '+token);
fs.writeFileSync(file,s);const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr);console.log(JSON.stringify({status:'PASS',contract:'PACK-SAN-LIVE-EVIDENCE-001',file:target},null,2));
