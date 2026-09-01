import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target)throw new Error('TrackerWorkflow source not found');
const file=path.join(root,target);const s=fs.readFileSync(file,'utf8');

// Compatibility shim only. The authoritative downstream recovery contract is
// owned by patch-p1a-e2e-continuation.mjs. This shim must accept the current
// authoritative continuation contract and must never force a downgrade.
for(const token of ['function p1aQueueWorkerState_(','function p1aTailoringNeedsResume_('])if(!s.includes(token))throw new Error('Authoritative E2E continuation helper missing before compatibility shim: '+token);
const authoritative=s.includes('P1-A-E2E-CONTINUATION-3')?'P1-A-E2E-CONTINUATION-3':(s.includes('P1-A-E2E-CONTINUATION-2')?'P1-A-E2E-CONTINUATION-2':'');
if(!authoritative)throw new Error('Authoritative E2E continuation contract missing before compatibility shim');
if(s.includes('function p1eDownstreamContinuationTick_(')||s.includes('function p1eContinueTailoringForApp_('))throw new Error('Legacy duplicate P1-E continuation functions still present in transformed source');
console.log(JSON.stringify({status:'PASS',file:target,changed:false,contract:'P1-E-SHIM-3',authoritativeContract:authoritative,acceptsV3:true,downgrade:false,duplicateHook:false,orchestratorDependency:false},null,2));
