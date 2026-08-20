import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target)throw new Error('TrackerWorkflow source not found');
const file=path.join(root,target);const s=fs.readFileSync(file,'utf8');

// Compatibility shim only. The authoritative downstream recovery contract is now
// P1-A-E2E-CONTINUATION-2 in patch-p1a-e2e-continuation.mjs. Keeping this file as
// a no-op preserves deployment-chain compatibility while preventing a second health
// hook or any dependency on the private orchestrateOne_ call signature.
for(const token of ['function p1aQueueWorkerState_(','function p1aTailoringNeedsResume_(','P1-A-E2E-CONTINUATION-2'])if(!s.includes(token))throw new Error('Authoritative E2E continuation v2 contract missing before compatibility shim: '+token);
if(s.includes('function p1eDownstreamContinuationTick_(')||s.includes('function p1eContinueTailoringForApp_('))throw new Error('Legacy duplicate P1-E continuation functions still present in transformed source');
console.log(JSON.stringify({status:'PASS',file:target,changed:false,contract:'P1-E-SHIM-2',authoritativeContract:'P1-A-E2E-CONTINUATION-2',duplicateHook:false,orchestratorDependency:false},null,2));
