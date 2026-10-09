import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-candidate-evidence-'));
try{
  const src=[
    "const JC={IDS:{EV:'EV_DOC'}};",
    "function docText_(id){return 'JOB COPILOT — CANONICAL CANDIDATE EVIDENCE REGISTRY';}",
    "function upsertWorkerState_(){}",
    "function SH_(){throw new Error('not used in source test')}",
    "function hm_(){return {}}",
    "function workerScore_(){const ev=docText_(JC.IDS.EV);return ev;}",
    "function phase1HealthTick(){}",
    "function workNeeded_(){}"
  ].join('\n');
  fs.writeFileSync(path.join(dir,'TrackerWorkflow.js'),src);
  const patch=path.resolve(path.dirname(new URL(import.meta.url).pathname),'patch-candidate-evidence-capture-first.mjs');
  for(let i=0;i<2;i++){
    const r=spawnSync(process.execPath,[patch,dir],{encoding:'utf8'});
    if(r.status!==0)throw new Error(r.stderr||r.stdout);
  }
  const out=fs.readFileSync(path.join(dir,'TrackerWorkflow.js'),'utf8');
  for(const token of ['CANDIDATE-EVIDENCE-CAPTURE-FIRST-001','CANDIDATE-EVIDENCE-CANONICAL-ONLY-001','function runCandidateEvidenceCaptureReadback()'])if(!out.includes(token))throw new Error('missing '+token);
  const a=out.indexOf('function workerScore_('),b=out.indexOf('function phase1HealthTick(');
  const worker=out.slice(a,b);
  if(worker.includes('docText_(JC.IDS.EV)'))throw new Error('workerScore bypass survived');
  if(!worker.includes('candidateEvidenceCanonicalText_()'))throw new Error('workerScore canonical wrapper missing');
  const ds=out.indexOf('function candidateEvidenceCaptureDecision_('),de=out.indexOf('function candidateEvidenceCanonicalText_(');
  const ctx={};
  vm.createContext(ctx);
  vm.runInContext(out.slice(ds,de)+';this.f=candidateEvidenceCaptureDecision_;',ctx);
  const d=ctx.f([{comparison:'MATCH',needsVerification:'No'},{comparison:'CONFLICT ON DATES',needsVerification:'Yes'}]);
  if(d.captures!==2||d.verifyCount!==1||d.conflictCount!==1||!d.stagedOnly)throw new Error('decision fixture failed '+JSON.stringify(d));
  console.log(JSON.stringify({status:'PASS',contract:'CANDIDATE-EVIDENCE-CAPTURE-FIRST-001',idempotent:true,canonicalOnly:true,conflictContained:true}));
}finally{
  fs.rmSync(dir,{recursive:true,force:true});
}
