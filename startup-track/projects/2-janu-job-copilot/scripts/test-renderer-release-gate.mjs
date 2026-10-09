import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-renderer-release-gate-'));
try{
 const src=[
  "function rendererQuarantineBlocks_(){}",
  "function unresolvedReleaseBlockerIds_(){return [];}",
  "function rendererWorkerStateValue_(){return '';}",
  "function healthComponentSnapshot_(){return {found:true,status:'HEALTHY',circuit:'CLOSED'};}",
  "function upsertWorkerState_(){}",
  "function healthSet_(){}",
  "function enforceReleaseBlockerHealth_(){return {blocked:true,ids:['FL-060']};}",
  "function verifyReleaseIdentity(){}"
 ].join('\n');
 fs.writeFileSync(path.join(dir,'TrackerWorkflow.js'),src);
 const p=path.resolve(path.dirname(new URL(import.meta.url).pathname),'patch-renderer-release-gate.mjs');
 const r=spawnSync(process.execPath,[p,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);
 const out=fs.readFileSync(path.join(dir,'TrackerWorkflow.js'),'utf8');
 const start=out.indexOf('function rendererReleaseGateDecision_('),end=out.indexOf('function rendererReleaseGateEvidence_(');
 const decisionSource=out.slice(start,end);const ctx={};vm.createContext(ctx);vm.runInContext(decisionSource+';this.f=rendererReleaseGateDecision_;',ctx);
 const base={rawIds:['FL-060','FL-099'],regressionPass:true,runtimeHealthy:true,provenancePass:true,rendererExact3Pass:true,tracePass:true,ownerClaimed:true,quarantineActive:true,recurrence:'SELF_TEST_PASS_CANARY_PENDING',replay:'BLOCKED_FL060_QUARANTINE_BREACH'};
 const a=ctx.f(base);if(a.global.length||a.contained.length!==2||!a.rendererPending)throw new Error('contained renderer fixture failed '+JSON.stringify(a));
 const b=ctx.f({...base,rawIds:['FL-060','FL-X']});if(b.global.length!==1||b.global[0]!=='FL-X')throw new Error('global blocker escaped '+JSON.stringify(b));
 const c=ctx.f({...base,regressionPass:false,rawIds:['FL-060']});if(c.ready||c.global.length!==1)throw new Error('incomplete evidence did not fail closed '+JSON.stringify(c));
 const d=ctx.f({...base,quarantineActive:false,recurrence:'CANARY_PASS',replay:'CANARY_PASS'});if(!d.ready||!d.verifiedCanary||d.rendererPending||d.global.length||d.contained.length!==2)throw new Error('verified canary did not close renderer release '+JSON.stringify(d));
 for(const token of ['RENDERER-RELEASE-GATE-SPLIT-001','Renderer Release','renderer_release_containment'])if(!out.includes(token))throw new Error('missing '+token);
 console.log(JSON.stringify({status:'PASS',contract:'RENDERER-RELEASE-GATE-SPLIT-001',containedRenderer:true,globalStillBlocks:true,incompleteEvidenceBlocks:true,verifiedCanaryCloses:true}));
}finally{fs.rmSync(dir,{recursive:true,force:true});}
