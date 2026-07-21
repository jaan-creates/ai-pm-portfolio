// run.mjs — 62 scoring runs, resumable. For each of the 10 cases × 3 candidates:
// run1 = canonical anonymized, run2 = perturbed anonymized (60). Plus the G8
// decoy un-anonymized pair (canonical + perturbed preserve_names) with
// probe_mode: logo_swap (2) = 62. Sequential (rate-limit friendly); skips any
// result file that already exists.

import './loadenv.mjs'; // FIRST: load ../.env into process.env before the SDK client is built
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { loadAliases, anonymize } from './anonymize.mjs';
import { perturb } from './perturb.mjs';
import { score } from './score.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url))); // Job-Copilot/
const P = (rel) => join(ROOT, rel);
const read = (rel) => readFileSync(P(rel), 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);

const cfg = JSON.parse(read('config/harness.json'));
const criticPrompt = read(cfg.paths.critic_prompt);
const rubric = read(cfg.paths.rubric);
const weightsRaw = read(cfg.paths.weights);
const aliases = loadAliases(P(cfg.paths.aliases));
const resultsDir = P(cfg.paths.results);
mkdirSync(resultsDir, { recursive: true });

const META = {
  model: cfg.model,
  critic_sha: sha(criticPrompt),
  rubric_sha: sha(rubric),
  weights_sha: sha(weightsRaw),
};
const CASES = Array.from({ length: 10 }, (_, i) => `G${i + 1}`);
const CANDS = ['S', 'D', 'W'];

function resultPath(caseId, cand, runKind) {
  return join(resultsDir, `${caseId}-${cand}-${runKind}.json`);
}

async function doRun(caseId, cand, runKind, resumeText, probeMode) {
  const out = resultPath(caseId, cand, runKind);
  if (existsSync(out)) {
    // Resume skips only SUCCESSFUL results; a previous failure is retried.
    try { if (JSON.parse(readFileSync(out, 'utf8')).ok) { console.log(`  skip ${caseId}-${cand}-${runKind} (ok)`); return; } } catch { /* corrupt → re-run */ }
  }
  const jd = read(`${cfg.paths.jds}/${caseId}.md`);
  process.stdout.write(`  run  ${caseId}-${cand}-${runKind} … `);
  const res = await score({ criticPrompt, rubric, jd, resume: resumeText, probeMode, cfg });
  const record = {
    _meta: { ...META, case: caseId, candidate: cand, run_kind: runKind, probe_mode: probeMode || null, scored_at: new Date().toISOString() },
    ok: res.ok,
    error: res.error || null,
    detail: res.detail || null,
    raw: res.raw || null,
    score: res.score || null,
  };
  writeFileSync(out, JSON.stringify(record, null, 2));
  console.log(res.ok ? 'ok' : `FAIL (${res.error})`);
}

async function main() {
  let n = 0;
  for (const caseId of CASES) {
    console.log(`${caseId}:`);
    for (const cand of CANDS) {
      const resume = read(`${cfg.paths.resumes}/${caseId}-${cand}.md`);
      const anon = anonymize(resume, aliases, { stripName: true, aliasEmployers: true });
      await doRun(caseId, cand, 'canonical', anon, null); n++;
      await doRun(caseId, cand, 'perturbed', perturb(anon, { preserveNames: false }), null); n++;
    }
    // G8 logo-swap probe: decoy un-anonymized (name stripped, employers kept).
    if (caseId === 'G8') {
      const resume = read(`${cfg.paths.resumes}/G8-D.md`);
      const unanon = anonymize(resume, aliases, { stripName: true, aliasEmployers: false });
      await doRun('G8', 'D', 'logoswap-canonical', unanon, 'logo_swap'); n++;
      await doRun('G8', 'D', 'logoswap-perturbed', perturb(unanon, { preserveNames: true }), 'logo_swap'); n++;
    }
  }
  console.log(`\nDone. ${n} runs attempted. Results in ${cfg.paths.results}. Now: node report.mjs`);
}

main().catch((e) => { console.error(e); process.exit(1); });
