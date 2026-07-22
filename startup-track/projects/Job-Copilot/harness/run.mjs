import './loadenv.mjs'; // FIRST: load ../.env into process.env before the SDK client is built
import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { loadAliases, anonymize } from './anonymize.mjs';
import { perturb } from './perturb.mjs';
import { score, buildParams, parseResult, client, providerFor } from './score.mjs';

// run.mjs — score the golden set. Default = live (one streamed call per run,
// good for single-case debugging). `--batch` = Message Batches API (50% cost,
// async) for the full set. Both paths are resumable: a run whose result file is
// already ok:true is skipped and never re-billed; only prior failures are redone.

const ROOT = dirname(dirname(fileURLToPath(import.meta.url))); // Job-Copilot/
const P = (rel) => join(ROOT, rel);
const read = (rel) => readFileSync(P(rel), 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BATCH = process.argv.includes('--batch');

const cfg = JSON.parse(read('config/harness.json'));
const criticPrompt = read(cfg.paths.critic_prompt);
const rubric = read(cfg.paths.rubric);
const weightsRaw = read(cfg.paths.weights);
const aliases = loadAliases(P(cfg.paths.aliases));
const resultsDir = P(cfg.paths.results);
mkdirSync(resultsDir, { recursive: true });

const META = { model: cfg.model, critic_sha: sha(criticPrompt), rubric_sha: sha(rubric), weights_sha: sha(weightsRaw) };
const CASES = Array.from({ length: 10 }, (_, i) => `G${i + 1}`);
const CANDS = ['S', 'D', 'W'];

function outPath(caseId, cand, runKind) { return join(resultsDir, `${caseId}-${cand}-${runKind}.json`); }

// Enumerate all 62 jobs with their assembled (anonymized/perturbed) resumes.
function buildJobs() {
  const jobs = [];
  const mk = (caseId, cand, runKind, resumeText, probeMode) => ({
    caseId, cand, runKind, resumeText, probeMode,
    custom_id: `${caseId}-${cand}-${runKind}`,
    out: outPath(caseId, cand, runKind),
    jd: read(`${cfg.paths.jds}/${caseId}.md`),
  });
  for (const caseId of CASES) {
    for (const cand of CANDS) {
      const anon = anonymize(read(`${cfg.paths.resumes}/${caseId}-${cand}.md`), aliases, { stripName: true, aliasEmployers: true });
      jobs.push(mk(caseId, cand, 'canonical', anon, null));
      jobs.push(mk(caseId, cand, 'perturbed', perturb(anon, { preserveNames: false }), null));
    }
    if (caseId === 'G8') {
      const un = anonymize(read(`${cfg.paths.resumes}/G8-D.md`), aliases, { stripName: true, aliasEmployers: false });
      jobs.push(mk('G8', 'D', 'logoswap-canonical', un, 'logo_swap'));
      jobs.push(mk('G8', 'D', 'logoswap-perturbed', perturb(un, { preserveNames: true }), 'logo_swap'));
    }
  }
  return jobs;
}

// A job needs scoring unless its result is already ok:true AND was produced by
// the CURRENT model — so switching judges (e.g. Claude → Gemini) re-scores prior
// runs instead of leaving a mixed-model report.
function needs(job) {
  if (existsSync(job.out)) {
    try {
      const r = JSON.parse(readFileSync(job.out, 'utf8'));
      if (r.ok && r._meta && r._meta.model === cfg.model) return false;
    } catch { /* corrupt → redo */ }
  }
  return true;
}

function writeResult(job, res) {
  writeFileSync(job.out, JSON.stringify({
    _meta: { ...META, case: job.caseId, candidate: job.cand, run_kind: job.runKind, probe_mode: job.probeMode || null, scored_at: new Date().toISOString() },
    ok: res.ok, error: res.error || null, detail: res.detail || null, raw: res.raw || null,
    usage: res.usage || null, score: res.score || null,
  }, null, 2));
}

async function runLive(jobs) {
  let n = 0;
  for (const job of jobs) {
    if (!needs(job)) { console.log(`  skip ${job.custom_id} (ok)`); continue; }
    process.stdout.write(`  run  ${job.custom_id} … `);
    const res = await score({ criticPrompt, rubric, jd: job.jd, resume: job.resumeText, probeMode: job.probeMode, cfg });
    writeResult(job, res); n++;
    console.log(res.ok ? 'ok' : `FAIL (${res.error})`);
  }
  console.log(`\nLive done. ${n} runs attempted. Now: node report.mjs`);
}

async function runBatch(jobs) {
  if (providerFor(cfg.model) !== 'anthropic') {
    console.log(`--batch is Anthropic-only (Message Batches API). Model "${cfg.model}" isn't Claude — run WITHOUT --batch (the free Gemini tier needs no batch and is already ~free).`);
    return;
  }
  const todo = jobs.filter(needs);
  console.log(`${jobs.length - todo.length} already ok (skipped, not re-billed), ${todo.length} to score via batch.`);
  if (todo.length === 0) { console.log('Nothing to do. Now: node report.mjs'); return; }

  const statePath = join(resultsDir, '_batch.json');
  let batchId;
  if (existsSync(statePath)) {
    batchId = JSON.parse(readFileSync(statePath, 'utf8')).id;
    console.log(`Reconnecting to in-flight batch ${batchId} (not resubmitting — no double-bill).`);
  } else {
    const requests = todo.map((j) => ({ custom_id: j.custom_id, params: buildParams({ criticPrompt, rubric, jd: j.jd, resume: j.resumeText, probeMode: j.probeMode, cfg }) }));
    const batch = await client.messages.batches.create({ requests });
    batchId = batch.id;
    writeFileSync(statePath, JSON.stringify({ id: batchId, created_at: new Date().toISOString(), count: todo.length }, null, 2));
    console.log(`Submitted batch ${batchId} with ${todo.length} requests (50% cost, async). Polling…`);
  }

  let b;
  while (true) {
    b = await client.messages.batches.retrieve(batchId);
    if (b.processing_status === 'ended') break;
    console.log(`  status: ${b.processing_status} ${JSON.stringify(b.request_counts || {})}`);
    await sleep(20000);
  }

  const byId = new Map(todo.map((j) => [j.custom_id, j]));
  let ok = 0, fail = 0;
  for await (const r of await client.messages.batches.results(batchId)) {
    const job = byId.get(r.custom_id);
    if (!job) continue;
    const res = (r.result.type === 'succeeded')
      ? parseResult(r.result.message)
      : { ok: false, error: `batch_${r.result.type}: ${r.result.error?.type || ''}` };
    writeResult(job, res);
    res.ok ? ok++ : fail++;
  }
  rmSync(statePath, { force: true });
  console.log(`\nBatch done: ${ok} ok, ${fail} failed. Now: node report.mjs`);
}

async function main() {
  const jobs = buildJobs();
  if (BATCH) await runBatch(jobs);
  else await runLive(jobs);
}
main().catch((e) => { console.error(e); process.exit(1); });
