import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-canary-artifact-qa-'));
try{
 const src=[
  "const JC={S:{Q:'Q'}};",
  "function rendererExactCanaryExecute_(){}",
  "function rendererCanaryQueueReadback_(){}",
  "function rendererCareerBreakApprovedLines_(){return ['A','B','C'];}",
  "function rendererWorkerStateValue_(){return '';}",
  "function SH_(){} function hm_(){} function now_(){return new Date();} function upsertWorkerState_(){} function hash_(){return 'H';} function enqueue_(){return 'Q-QA';} function runQ_(){return 1;}",
  "function verifyReleaseIdentity(){}"
 ].join('\n');
 fs.writeFileSync(path.join(dir,'TrackerWorkflow.js'),src);
 const p=path.resolve(path.dirname(new URL(import.meta.url).pathname),'patch-canary-artifact-qa.mjs');
 const r=spawnSync(process.execPath,[p,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);
 const out=fs.readFileSync(path.join(dir,'TrackerWorkflow.js'),'utf8');
 for(const token of ['CANARY-ARTIFACT-QA-PROOF-001','CANARY-QA-FINALIZE-001','function rendererCanaryArtifactProof_(','function runRendererCanaryQaEnqueue(','function runRendererCanaryQaExecute(','function runRendererCanaryReleaseFinalize(','renderer_recurrence_gate','CANARY_PASS'])if(!out.includes(token))throw new Error('missing '+token);
 function extract(name){const start=out.indexOf('function '+name+'('),open=out.indexOf('{',start);let d=0,q=null,e=false;for(let i=open;i<out.length;i++){const c=out[i];if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0)return out.slice(start,i+1);}throw new Error('unterminated '+name);}
 const docId=extract('rendererCanaryDocId_'),proof=extract('rendererCanaryArtifactProof_');
 function makeDoc(lines,allText){return{getBody(){return{getNumChildren(){return lines.length},getChild(i){const x=lines[i];return{getType(){return x.type},getText(){return x.text}}},getText(){return allText||lines.map(x=>x.text).join('\n')}}}}}
 const ElementType={LIST_ITEM:'LIST_ITEM',PARAGRAPH:'PARAGRAPH'};
 const good=[{type:'PARAGRAPH',text:'Independent Product Building & Career Break'},{type:'PARAGRAPH',text:'Sep 2024 – Present | Bengaluru, India'},{type:'LIST_ITEM',text:'A'},{type:'LIST_ITEM',text:'B'},{type:'LIST_ITEM',text:'C'},{type:'PARAGRAPH',text:'LEADERSHIP & COMMUNITY'}];
 const exportText=lines=>lines.map(x=>x.text).join('\n'); const ctx={canonicalEvidenceText_:()=>exportText(good),rendererCareerBreakApprovedLines_:()=>['A','B','C']};vm.createContext(ctx);vm.runInContext(docId+'\n'+proof+';this.proof=rendererCanaryArtifactProof_;',ctx);
 const g=ctx.proof('https://docs.google.com/document/d/DOC123/edit');if(!g.pass||g.careerBreakBulletCount!==3)throw new Error('known-good artifact proof failed');
 ctx.canonicalEvidenceText_=()=>exportText(good.slice(0,5).concat([{type:'LIST_ITEM',text:'DUP1'},{type:'LIST_ITEM',text:'DUP2'},{type:'PARAGRAPH',text:'LEADERSHIP & COMMUNITY'}]));
 let dup=false;try{ctx.proof('https://docs.google.com/document/d/DOC123/edit')}catch(e){dup=/EXACT3_MISMATCH/.test(String(e));}if(!dup)throw new Error('five-bullet duplicate artifact was not rejected');
 ctx.canonicalEvidenceText_=()=> 'Independent Product Building & Career Break\nSep 2024 – Present | Bengaluru, India\nA\nB\nC\nLEADERSHIP & COMMUNITY\nhello EV-GLOROOTS-004';
 let leak=false;try{ctx.proof('https://docs.google.com/document/d/DOC123/edit')}catch(e){leak=/INTERNAL_TAG_LEAK/.test(String(e));}if(!leak)throw new Error('internal evidence leak was not rejected');
 const ck=spawnSync(process.execPath,['--check',path.join(dir,'TrackerWorkflow.js')],{encoding:'utf8'});if(ck.status!==0)throw new Error(ck.stderr);
 console.log(JSON.stringify({status:'PASS',contract:'CANARY-ARTIFACT-QA-PROOF-001',exact3Accepted:true,fiveBulletsRejected:true,internalTagRejected:true,qaRequired:true}));
}finally{fs.rmSync(dir,{recursive:true,force:true});}
