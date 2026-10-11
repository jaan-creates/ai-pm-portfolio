import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const PROJECT_REL = 'startup-track/projects/2-janu-job-copilot';

const CATALOG = [
  {
    id: 'governance',
    match: p => p.includes('.github/workflows/') || /prechange-risk-manifest|validate-.*governance/i.test(p),
    priorIncidents: ['PRECHANGE-RISK-GATE'],
    failureClasses: ['known-failure-retrieval-missing', 'policy-without-enforcement'],
    fixtures: ['exact escaped fixture or target canary'],
    siblingRisks: ['release validator', 'source hash/readback', 'rollback'],
    enforcement: 'pre-change manifest must pass before deployment',
    tests: ['test-prechange-risk-manifest.mjs'],
    containment: 'fail closed; no promotion when a material file is unmapped',
    proof: 'manifest artifact plus deployment provenance and source hash',
    unlock: 'all mapped files have evidence, tests, containment, and rollback criteria',
    uncertainty: 'private tracker evidence remains a live readback responsibility',
    evidence: ['Required pre-change pass', 'Acceptance invariant'],
  },
  {
    id: 'renderer',
    match: p => /renderer|canary|resume|artifact-proof/i.test(p),
    priorIncidents: ['FL-045', 'FL-060', 'FL-078'],
    failureClasses: ['renderer bullet loss', 'duplicate canary enqueue', 'artifact/QA handoff mismatch'],
    fixtures: ['RENDER-CAREERBREAK-V3 exact artifact proof'],
    siblingRisks: ['queue replay/idempotency', 'artifact/version registry', 'QA', 'health publisher'],
    enforcement: 'renderer quarantine and exact canary gate',
    tests: ['test-renderer-careerbreak.mjs', 'test-renderer-release-gate.mjs', 'test-canary-scheduler-handoff.mjs'],
    containment: 'one changed-deployment canary; normal RESUME_GENERATE remains blocked',
    proof: 'exact canary queue, artifact readback, QA readback, live health closure',
    unlock: 'renderer recurrence and replay gates are CANARY_PASS',
    uncertainty: 'backlog replay remains a separate governed action',
    evidence: ['renderer fix → queue replay/idempotency', 'FL-045'],
  },
  {
    id: 'runtime',
    match: p => /runtime|queue|worker|one-job|nojob|reserve/i.test(p),
    priorIncidents: ['FL-080', 'FL-072'],
    failureClasses: ['no-runnable queue selection', 'execution/readback unavailable'],
    fixtures: ['QUEUE-NOJOB-BUDGET-001', 'RUNTIME-ONEJOB-RESERVE-001'],
    siblingRisks: ['terminal-row scan behavior', 'latest-attempt semantics', 'duplicate enqueue', 'health aggregation'],
    enforcement: 'bounded queue selection with execution reserve',
    tests: ['test-runtime-queue-quarantine-order.mjs', 'test-health-runtime-liveness.mjs'],
    containment: 'bounded slice and fail-closed runtime health',
    proof: 'target liveness readback, source identity, and health tick duration',
    unlock: 'clean target cycle completes within the runtime budget',
    uncertainty: 'provider and scheduler timing can still vary by cycle',
    evidence: ['FL-080', 'no-runnable'],
  },
  {
    id: 'health',
    match: p => /health|release-gate|regression/i.test(p),
    priorIncidents: ['FL-078'],
    failureClasses: ['blocker-aware health overwrite', 'regression gate closes around open blocker'],
    fixtures: ['REGRESSION-HEALTH-BLOCKER-JOIN-001'],
    siblingRisks: ['recurring publisher overwrite', 'blocker precedence', 'post-write readback', 'downstream scheduler consumption'],
    enforcement: 'health aggregation preserves material blocker precedence',
    tests: ['test-health-control-plane-isolation.mjs', 'test-health-owner-validation-starvation.mjs', 'test-renderer-release-gate.mjs'],
    containment: 'keep circuit open until the specific blocker has current proof',
    proof: 'system-health row readback after the target control tick',
    unlock: 'affected count is zero and circuit state is CLOSED',
    uncertainty: 'health rows are current-state evidence, not historical proof',
    evidence: ['FL-078', 'state/health fix'],
  },
  {
    id: 'sourcing',
    match: p => /sourcing|scheduler/i.test(p),
    priorIncidents: ['SOURCING-SCHEDULER'],
    failureClasses: ['scheduled success misclassified as stale', 'recovery mistaken for liveness'],
    fixtures: ['SOURCING-DATE-GAP-001'],
    siblingRisks: ['schedule label', 'date-gap calculation', 'health blocker precedence'],
    enforcement: 'scheduled success and expected gap dates are evaluated separately',
    tests: ['test-sourcing-scheduler-health.mjs'],
    containment: 'keep sourcing health fail-closed when scheduled proof is absent',
    proof: 'Daily Sourcing health row with current scheduled-success evidence',
    unlock: 'weekday cycle succeeds within policy threshold',
    uncertainty: 'weekend/holiday expected-gap policy can mask elapsed age by design',
    evidence: ['SOURCING-DATE-GAP-001', 'scheduled success'],
  },
  {
    id: 'trace',
    match: p => /trace|golden|continuation|e2e/i.test(p),
    priorIncidents: ['TRACE-GOLDEN-V0-2'],
    failureClasses: ['trace publication durability', 'fixture identity drift', 'stranded continuation'],
    fixtures: ['TRACE-GOLDEN-01'],
    siblingRisks: ['publication durability', 'privacy', 'readback consistency', 'duplicate continuation enqueue'],
    enforcement: 'trace completeness and continuation gates',
    tests: ['test-trace-golden-v0-patch.mjs', 'test-p1a-e2e-continuation-v4.mjs'],
    containment: 'hold golden-path promotion when trace is incomplete',
    proof: 'fixture identity, trace status, and downstream state readback',
    unlock: 'trace is complete for the exact promoted release',
    uncertainty: 'golden trace may remain stale while other release gates are healthy',
    evidence: ['TRACE-GOLDEN-V0-2', 'publication durability'],
  },
  {
    id: 'evidence',
    match: p => /candidate-evidence|evidence-capture/i.test(p),
    priorIncidents: ['CANDIDATE-EVIDENCE-CAPTURE-FIRST-001'],
    failureClasses: ['candidate claim not canonical', 'source disagreement silently reconciled'],
    fixtures: ['candidate evidence capture self-test'],
    siblingRisks: ['source registry', 'resume claims', 'privacy/readback'],
    enforcement: 'canonical candidate evidence registry and source-claim separation',
    tests: ['test-candidate-evidence-capture-first.mjs'],
    containment: 'do not promote unverified claims into resume output',
    proof: 'candidate evidence capture and readback self-tests',
    unlock: 'canonical source claims are captured and read back',
    uncertainty: 'conflicting source dates/metrics remain separate until verified',
    evidence: ['CANDIDATE-EVIDENCE-CAPTURE-FIRST-001', 'canonical'],
  },
  {
    id: 'release',
    match: p => /release|provenance|deployment-manifest|oauth|scope/i.test(p),
    priorIncidents: ['FL-072'],
    failureClasses: ['source transport success mistaken for execution success', 'transform/validator drift'],
    fixtures: ['DEPLOY-ATOMIC-READBACK-001'],
    siblingRisks: ['transform/validator version drift', 'semantic CLI success', 'source hash/readback', 'rollback'],
    enforcement: 'exact transformed source hash and connected provenance',
    tests: ['validate-release.mjs', 'test-release-provenance-patch.mjs'],
    containment: 'rollback on hash mismatch; fail closed on semantic execution failure',
    proof: 'deployment provenance and exact source hash readback',
    unlock: 'provenance status is PASS for the promoted commit',
    uncertainty: 'CI identity and owner runtime have separate authority boundaries',
    evidence: ['DEPLOY-ATOMIC-READBACK-001', 'source hash/readback'],
  },
];

function projectDirFor(root) {
  const candidate = path.join(root, 'PRECHANGE_RISK_GATE.md');
  return fs.existsSync(candidate) ? root : path.join(root, PROJECT_REL);
}

function changedFiles(root) {
  const run = args => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  let out = '';
  try {
    const base = process.env.GITHUB_BASE_REF;
    out = base ? run(['diff', '--name-only', `origin/${base}...HEAD`]) : '';
  } catch {}
  if (!out) {
    try {
      const before = process.env.GITHUB_EVENT_BEFORE;
      out = before && !/^0+$/.test(before) ? run(['diff', '--name-only', before, 'HEAD']) : '';
    } catch {}
  }
  if (!out) {
    try { out = run(['diff', '--name-only', 'HEAD^', 'HEAD']); } catch {}
  }
  return out.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
}

function catalogFor(file) {
  return CATALOG.find(entry => entry.match(file.replaceAll('\\', '/').toLowerCase())) || null;
}

function isMaterial(file) {
  const p = file.replaceAll('\\', '/');
  return p.startsWith(PROJECT_REL + '/scripts/') ||
    p.startsWith('.github/workflows/') ||
    /\.(gs|js|mjs|yml|yaml)$/.test(p);
}

function buildManifest({ root, files }) {
  const project = projectDirFor(root);
  const material = files.filter(isMaterial);
  if (!material.length) throw new Error('No material changed files were found');
  const unmapped = material.filter(file => !catalogFor(file));
  if (unmapped.length) throw new Error('Material change has no risk mapping: ' + unmapped.join(', '));
  const corpus = ['PRECHANGE_RISK_GATE.md', 'CURRENT_STATE.md', 'EXECUTION_ROADMAP.md']
    .map(name => fs.existsSync(path.join(project, name)) ? fs.readFileSync(path.join(project, name), 'utf8') : '')
    .join('\n');
  if (!corpus.includes('Acceptance invariant')) throw new Error('Pre-change gate reference is missing its acceptance invariant');
  const components = [...new Map(material.map(file => {
    const e = catalogFor(file);
    return [e.id, e];
  }).values())].map(e => {
    const missing = e.evidence.filter(token => !corpus.toLowerCase().includes(token.toLowerCase()));
    if (missing.length) throw new Error(`Risk evidence missing for ${e.id}: ${missing.join(', ')}`);
    return {
      component: e.id,
      changedFiles: material.filter(file => catalogFor(file)?.id === e.id),
      priorIncidentsRetrieved: e.priorIncidents,
      relevantFailureClasses: e.failureClasses,
      exactEscapedFixtures: e.fixtures,
      predictedSiblingRisks: e.siblingRisks,
      executableEnforcementPoint: e.enforcement,
      targetedRegressionAndE2E: e.tests,
      rolloutContainment: e.containment,
      deploymentAndReadbackProof: e.proof,
      rollbackAndUnlockCriteria: e.unlock,
      openUncertainty: e.uncertainty,
    };
  });
  return {
    schema: 'PRECHANGE-RISK-MANIFEST-001',
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || 'local',
    changedFiles: material,
    components,
  };
}

function validateManifest(manifest) {
  if (manifest.schema !== 'PRECHANGE-RISK-MANIFEST-001') throw new Error('Wrong manifest schema');
  if (!manifest.changedFiles.length || !manifest.components.length) throw new Error('Manifest is empty');
  for (const component of manifest.components) {
    for (const key of ['priorIncidentsRetrieved','relevantFailureClasses','exactEscapedFixtures','predictedSiblingRisks','targetedRegressionAndE2E','rolloutContainment','deploymentAndReadbackProof','rollbackAndUnlockCriteria']) {
      if (!Array.isArray(component[key]) && !component[key]) throw new Error(`Missing ${key} for ${component.component}`);
    }
    if (!component.executableEnforcementPoint) throw new Error(`Missing enforcement point for ${component.component}`);
  }
  return true;
}

function selfTest() {
  const mapped = catalogFor('.github/workflows/janu-job-copilot.yml');
  if (!mapped || mapped.id !== 'governance') throw new Error('workflow mapping failed');
  if (!catalogFor('startup-track/projects/2-janu-job-copilot/scripts/patch-renderer-careerbreak.mjs')) throw new Error('renderer mapping failed');
  if (!catalogFor('startup-track/projects/2-janu-job-copilot/scripts/patch-owner-canary-lock.mjs')) throw new Error('runtime mapping failed');
  if (catalogFor('startup-track/projects/2-janu-job-copilot/scripts/unknown-material-change.mjs')) throw new Error('unknown mapping did not fail closed');
  console.log(JSON.stringify({ pass: true, contract: 'PRECHANGE-RISK-MANIFEST-001' }));
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  const root = path.resolve(process.argv[2] || process.cwd());
  const files = changedFiles(root);
  const manifest = buildManifest({ root, files });
  validateManifest(manifest);
  manifest.manifestSha256 = crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
  console.log(JSON.stringify(manifest, null, 2));
}

export { CATALOG, buildManifest, catalogFor, changedFiles, validateManifest };
