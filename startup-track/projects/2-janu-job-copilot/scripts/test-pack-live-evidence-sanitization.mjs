import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const project=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patch=path.join(project,'scripts','patch-pack-live-evidence-sanitization.mjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pack-live-san-'));
const f=path.join(dir,'TrackerWorkflow.js');
fs.writeFileSync(f,`function stripInternalEvidenceTags_(s){return String(s||'').replace(/\\bsee\\s+EV-[A-Z0-9_-]+(?:\\/[A-Z0-9_-]+)?\\b/gi,'').replace(/\\bEV-[A-Z0-9_-]+(?:\\/[A-Z0-9_-]+)?\\b/g,'').replace(/\\s+/g,' ').trim();}
function assertExternalTextClean_(txt){if(/\\bEV-[A-Z0-9_-]+\\b/.test(String(txt||'')))throw new Error('DETERMINISTIC:INTERNAL_TAG_LEAK');return true;}
function pack_(){const b={getText(){return''}};assertExternalTextClean_(b.getText());doc.saveAndClose();}
`);
const r=spawnSync(process.execPath,[patch,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);
const s=fs.readFileSync(f,'utf8');
for(const t of ['PACK-SAN-LIVE-EVIDENCE-001','function sanitizePackComposedBody_(','sanitizePackComposedBody_(b)','assertExternalTextClean_(finalText)'])if(!s.includes(t))throw new Error('Missing '+t);
const start=s.indexOf('function sanitizePackComposedBody_('),end=s.indexOf('\nfunction pack_(',start);const helper=s.slice(start,end);
const context={stripInternalEvidenceTags_:x=>String(x||'').replace(/\bsee\s+EV-[A-Z0-9_-]+(?:\/[A-Z0-9_-]+)?\b/gi,'').replace(/\bEV-[A-Z0-9_-]+(?:\/[A-Z0-9_-]+)?\b/g,'').replace(/\s+/g,' ').trim(),assertExternalTextClean_:txt=>{if(/\bEV-[A-Z0-9_-]+\b/.test(String(txt||'')))throw new Error('LEAK');}};vm.createContext(context);vm.runInContext(helper,context);
function child(text){return{value:text,editAsText(){const self=this;return{getText(){return self.value},setText(v){self.value=v;return this}}}};}
const children=[child('Strong platform ownership EV-GLOROOTS-004'),child('see EV-BREAK-001 Career break narrative'),child('Clean text')];
const body={getNumChildren(){return children.length},getChild(i){return children[i]},getText(){return children.map(x=>x.value).join('\n')}};
const out=context.sanitizePackComposedBody_(body);
if(/\bEV-[A-Z0-9_-]+\b/.test(out))throw new Error('Live evidence token survived sanitization: '+out);
if(!out.includes('Strong platform ownership')||!out.includes('Career break narrative'))throw new Error('User-facing content damaged: '+out);
const ck=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr);
console.log(JSON.stringify({status:'PASS',contract:'PACK-SAN-LIVE-METAFORMS-001',fixture:'EV-GLOROOTS-004',postCompositionSanitization:true,assertAfterSanitize:true,contentPreserved:true}));
