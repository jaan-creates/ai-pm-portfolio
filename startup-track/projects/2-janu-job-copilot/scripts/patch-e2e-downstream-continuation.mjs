import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target)throw new Error('TrackerWorkflow source not found');
const file=path.join(root,target);const s=fs.readFileSync(file,'utf8');

// Compatibility shim only. Continuation v3 supersedes v2; older transformed
// sources may still carry v2. The shim must accept either recognized version,
// rather than blocking a valid v3 deployment solely because v2 was replaced.
// Neither version adds another health hook through this no-op.
for(const token of ['function p1aQueueWorkerState_(','function p1aTailoringNeedsResume_('])if(!s.includes(token))throw new Error('E2E continuation dependency missing before compatibility shim: '+token);
const authoritativeContract=s.includes('P1-A-E2E-CONTINUATION-3')?'P1-A-E2E-CONTINUATION-3':s.includes('P1-A-E2E-CONTINUATION-2')?'P1-A-E2E-CONTINUATION-2':'';
if(!authoritativeContract)throw new Error('Recognized authoritative E2E continuation contract v2/v3 missing before compatibility shim');
if(s.includes('function p1eDownstreamContinuationTick_(')||s.includes('function p1eContinueTailoringForApp_('))throw new Error('Legacy duplicate P1-E continuation functions still present in transformed source');
console.log(JSON.stringify({status:'PASS',file:target,changed:false,contract:'P1-E-SHIM-2',authoritativeContract,duplicateHook:false,orchestratorDependency:false},null,2));
