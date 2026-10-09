import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='CANDIDATE-EVIDENCE-CAPTURE-FIRST-001';
const CANONICAL='CANDIDATE-EVIDENCE-CANONICAL-ONLY-001';
const CAPTURE='Candidate Evidence Capture';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function workerScore_(')&&t.includes('function docText_(');});
if(!target)throw new Error('workerScore_/docText_ target not found');
const file=path.join(root,target);
let s=fs.readFileSync(file,'utf8');

function rangeOf(name){
  const start=s.indexOf('function '+name+'(');
  if(start<0)return null;
  const open=s.indexOf('{',start);
  let d=0,q=null,e=false,line=false,block=false;
  for(let i=open;i<s.length;i++){
    const c=s[i],n=s[i+1]||'';
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}
    if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='"'||c==="'"||c.charCodeAt(0)===96){q=c;continue;}
    if(c==='{')d++; else if(c==='}'&&--d===0)return{start,end:i+1};
  }
  throw new Error('Unterminated '+name);
}
function replaceFn(name,code){const r=rangeOf(name);if(!r)throw new Error('Missing '+name);s=s.slice(0,r.start)+code+s.slice(r.end);}
function putFn(name,code,anchor){const r=rangeOf(name);if(r){replaceFn(name,code);return;}const i=s.indexOf(anchor);if(i<0)throw new Error('Missing anchor '+anchor);s=s.slice(0,i)+code+'\n'+s.slice(i);}
function appendToFn(name,marker,code){const r=rangeOf(name);if(!r)throw new Error('Missing '+name);const body=s.slice(r.start,r.end);if(body.includes(marker))return;const close=r.end-1;s=s.slice(0,close)+code+s.slice(close);}

const decisionFn="function candidateEvidenceCaptureDecision_(rows){rows=rows||[];let captures=0,verify=0,conflicts=0;for(const x of rows){if(!x)continue;captures++;const cmp=String(x.comparison||''),need=String(x.needsVerification||'').toLowerCase();if(need==='yes')verify++;if(cmp==='CONFLICT'||cmp.indexOf('CONFLICT')>=0)conflicts++;}return{pass:true,contract:'"+CONTRACT+"',captures:captures,verifyCount:verify,conflictCount:conflicts,stagedOnly:true};}";
const canonicalFn="function candidateEvidenceCanonicalText_(){const text=docText_(JC.IDS.EV);if(!text||text.indexOf('JOB COPILOT — CANONICAL CANDIDATE EVIDENCE REGISTRY')<0)throw new Error('DETERMINISTIC:"+CANONICAL+":MISSING_CANONICAL_REGISTRY');return text;}";
const snapshotFn="function candidateEvidenceCaptureSnapshot_(){let sh;try{sh=SH_('"+CAPTURE+"')}catch(e){return{pass:false,contract:'"+CONTRACT+"',reason:'CAPTURE_SHEET_MISSING'}}const m=hm_(sh),req=['Capture ID','Comparison to Canonical Registry','Needs User Verification?'];for(const h of req)if(!m[h])return{pass:false,contract:'"+CONTRACT+"',reason:'CAPTURE_HEADER_MISSING:'+h};const rows=[];for(let r=2;r<=sh.getLastRow();r++){const id=String(sh.getRange(r,m['Capture ID']).getDisplayValue()||'').trim();if(!id)continue;rows.push({comparison:String(sh.getRange(r,m['Comparison to Canonical Registry']).getDisplayValue()||''),needsVerification:String(sh.getRange(r,m['Needs User Verification?']).getDisplayValue()||'')});}const d=candidateEvidenceCaptureDecision_(rows);d.schema='CAPTURE-STAGING-V1';return d;}";
const selfFn="function candidateEvidenceCaptureSelfTest_(){const a=candidateEvidenceCaptureDecision_([{comparison:'MATCH',needsVerification:'No'},{comparison:'CONFLICT',needsVerification:'Yes'}]);if(!a.pass||a.captures!==2||a.verifyCount!==1||a.conflictCount!==1||a.stagedOnly!==true)throw new Error('DETERMINISTIC:"+CONTRACT+"_SELF_TEST_FAILED');return{pass:true,total:4,contract:'"+CONTRACT+"',canonicalOnly:'"+CANONICAL+"'};}";
const runSelfFn="function runCandidateEvidenceCaptureSelfTest(){const x=candidateEvidenceCaptureSelfTest_();upsertWorkerState_('candidate_evidence_capture_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));upsertWorkerState_('candidate_evidence_capture_contract_version','"+CONTRACT+"','Staged source captures never become scoring evidence directly; workerScore_ reads canonical registry only.');return x;}";
const readbackFn="function runCandidateEvidenceCaptureReadback(){const canonical=candidateEvidenceCanonicalText_(),snap=candidateEvidenceCaptureSnapshot_();if(!snap.pass)throw new Error('DETERMINISTIC:"+CONTRACT+":'+String(snap.reason||'READBACK_FAILED'));upsertWorkerState_('candidate_evidence_capture_last_readback','PASS',JSON.stringify({contract:'"+CONTRACT+"',captures:snap.captures,verifyCount:snap.verifyCount,conflictCount:snap.conflictCount,canonicalChars:canonical.length}));return{pass:true,contract:'"+CONTRACT+"',captures:snap.captures,verifyCount:snap.verifyCount,conflictCount:snap.conflictCount,canonicalOnly:true};}";

putFn('candidateEvidenceCaptureDecision_',decisionFn,'function workNeeded_(');
putFn('candidateEvidenceCanonicalText_',canonicalFn,'function workNeeded_(');
putFn('candidateEvidenceCaptureSnapshot_',snapshotFn,'function workNeeded_(');
putFn('candidateEvidenceCaptureSelfTest_',selfFn,'function workNeeded_(');
putFn('runCandidateEvidenceCaptureSelfTest',runSelfFn,'function workNeeded_(');
putFn('runCandidateEvidenceCaptureReadback',readbackFn,'function workNeeded_(');

const wr=rangeOf('workerScore_');
let worker=s.slice(wr.start,wr.end);
if(worker.includes('docText_(JC.IDS.EV)'))worker=worker.replaceAll('docText_(JC.IDS.EV)','candidateEvidenceCanonicalText_()');
if(!worker.includes('candidateEvidenceCanonicalText_()'))throw new Error('workerScore_ does not consume canonical candidate evidence via supported path');
s=s.slice(0,wr.start)+worker+s.slice(wr.end);

if(rangeOf('phase1HealthTick'))appendToFn('phase1HealthTick','candidate_evidence_capture_self_test',"try{runCandidateEvidenceCaptureSelfTest();}catch(e){upsertWorkerState_('candidate_evidence_capture_self_test','FAIL',String((e&&e.stack)||e).slice(0,1500));}");

for(const token of [CONTRACT,CANONICAL,'function candidateEvidenceCanonicalText_(','function candidateEvidenceCaptureDecision_(','function candidateEvidenceCaptureSnapshot_(','function runCandidateEvidenceCaptureSelfTest()','function runCandidateEvidenceCaptureReadback()','candidate_evidence_capture_self_test'])if(!s.includes(token))throw new Error('capture-first contract missing '+token);
const finalWorker=s.slice(rangeOf('workerScore_').start,rangeOf('workerScore_').end);
if(finalWorker.includes('docText_(JC.IDS.EV)'))throw new Error('workerScore_ still bypasses canonical evidence wrapper');
if(!finalWorker.includes('candidateEvidenceCanonicalText_()'))throw new Error('workerScore_ canonical evidence wrapper missing');

fs.writeFileSync(file,s);
const ck=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
if(ck.status!==0)throw new Error(ck.stderr||'syntax failure');
console.log(JSON.stringify({status:'PASS',contract:CONTRACT,canonicalOnly:CANONICAL,file:target,workerScoreCanonicalOnly:true,captureSheet:CAPTURE},null,2));
