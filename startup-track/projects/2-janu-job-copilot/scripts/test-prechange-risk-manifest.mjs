import assert from 'node:assert/strict';
import { buildManifest, catalogFor, validateManifest } from './prechange-risk-manifest.mjs';

assert.equal(catalogFor('.github/workflows/janu-job-copilot.yml')?.id, 'governance');
assert.equal(catalogFor('startup-track/projects/2-janu-job-copilot/scripts/patch-renderer-careerbreak.mjs')?.id, 'renderer');
assert.equal(catalogFor('startup-track/projects/2-janu-job-copilot/scripts/patch-runtime-queue-quarantine-order.mjs')?.id, 'runtime');
assert.equal(catalogFor('startup-track/projects/2-janu-job-copilot/scripts/patch-sourcing-scheduler-health.mjs')?.id, 'sourcing');
assert.equal(catalogFor('startup-track/projects/2-janu-job-copilot/scripts/patch-candidate-evidence-capture-first.mjs')?.id, 'evidence');
assert.equal(catalogFor('startup-track/projects/2-janu-job-copilot/scripts/patch-release-provenance.mjs')?.id, 'release');
assert.equal(catalogFor('startup-track/projects/2-janu-job-copilot/scripts/unknown-material-change.mjs'), null);
const fixture = {
  schema: 'PRECHANGE-RISK-MANIFEST-001',
  changedFiles: ['.github/workflows/janu-job-copilot.yml'],
  components: [{
    component: 'governance',
    priorIncidentsRetrieved: ['PRECHANGE-RISK-GATE'],
    relevantFailureClasses: ['known-failure-retrieval-missing'],
    exactEscapedFixtures: ['fixture'],
    predictedSiblingRisks: ['rollback'],
    executableEnforcementPoint: 'manifest',
    targetedRegressionAndE2E: ['test'],
    rolloutContainment: 'fail closed',
    deploymentAndReadbackProof: 'proof',
    rollbackAndUnlockCriteria: 'unlock',
  }],
};
assert.equal(validateManifest(fixture), true);
assert.throws(() => validateManifest({ ...fixture, components: [{ ...fixture.components[0], executableEnforcementPoint: '' }] }));
console.log(JSON.stringify({ pass: true, contract: 'PRECHANGE-RISK-MANIFEST-001', checks: 9 }));
