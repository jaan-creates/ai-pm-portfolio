import fs from 'node:fs';
import path from 'node:path';
const projectDir=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const file=path.join(projectDir,'scripts','patch-p1a-vacancy-lifecycle.mjs');
const s=fs.readFileSync(file,'utf8');
const checks=[
  ['version-aware replacement helper',s.includes('function replaceFunction(')],
  ['self-test upgraded by version',s.includes("replaceFunction('p1aVacancyLifecycleSelfTest_',lifecycleTest,'P1-A-VACANCY-LIFECYCLE-2')")],
  ['runner upgraded by version',s.includes("replaceFunction('runP1AVacancyLifecycleSelfTest',lifecycleRun,'P1-A-VACANCY-LIFECYCLE-2')")],
  ['repair mode telemetry',s.includes("repairMode:'per-function-version-convergent'")],
  ['closed reconcile remains additive',s.includes("add('function p1aClosedVacancyReconcileTick_('")]
];
const failed=checks.filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length)throw new Error('P1-A vacancy partial-install convergence guard failed: '+failed.join(', '));
console.log(JSON.stringify({status:'PASS',contract:'P1-A-VACANCY-PATCH-CONVERGENCE-1',checks:checks.length,partialInstallRepair:true},null,2));
