// report.mjs — read Score JSONs, recompute composites (ADR-003), evaluate the
// per-case assertions and the 6 pass gates, and emit golden/report.md.
// Aggregation (labels.json §_aggregation): composite/section use the 2-run MEAN;
// categorical assertions read the canonical run1; logo_delta = |mean(unanon) −
// mean(anon)| for G8-D.

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { recompute, canonicalSectionKey } from './schema.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const P = (rel) => join(ROOT, rel);
const read = (rel) => readFileSync(P(rel), 'utf8');

const cfg = JSON.parse(read('config/harness.json'));
const weightsCfg = JSON.parse(read(cfg.paths.weights));
const labels = JSON.parse(read(cfg.paths.labels));
const resultsDir = P(cfg.paths.results);
const CERT_TOKENS = /\b(CSPO|SAFe|PSM|PMP|CSM)\b/;

function load(caseId, cand, runKind) {
  const p = join(resultsDir, `${caseId}-${cand}-${runKind}.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}
const rc = (rec) => (rec && rec.ok && rec.score) ? recompute(rec.score, weightsCfg, cfg) : null;
const mean = (a, b) => (a != null && b != null) ? (a + b) / 2 : (a ?? b);

// Per candidate: canonical + perturbed → mean composite, stability delta.
function candSummary(caseId, cand) {
  const c = load(caseId, cand, 'canonical');
  const p = load(caseId, cand, 'perturbed');
  const rcC = rc(c), rcP = rc(p);
  return {
    canonical: c, perturbed: p, rcC, rcP,
    meanComposite: mean(rcC?.composite, rcP?.composite),
    stability: (rcC && rcP) ? Math.abs(rcC.composite - rcP.composite) : null,
    ok: !!(c?.ok && p?.ok),
  };
}

const lines = [];
const say = (s = '') => lines.push(s);
say('# Golden-set report');
say('');
say(`Model: \`${cfg.model}\` · composite = ${cfg.composite_weights.s1}·S1 + ${cfg.composite_weights.s2}·S2 + ${cfg.composite_weights.s3}·S3 (recomputed; ADR-003)`);
say('');

const allStability = [];
const evidenceViolations = [];
const crossChecks = [];
const caseResults = {};
let rankHits = 0, marginHits = 0;

for (const caseId of Object.keys(labels.cases)) {
  const spec = labels.cases[caseId];
  const S = candSummary(caseId, 'S'), D = candSummary(caseId, 'D'), W = candSummary(caseId, 'W');
  for (const [cand, cs] of [['S', S], ['D', D], ['W', W]]) {
    if (cs.stability != null) allStability.push({ id: `${caseId}-${cand}`, delta: cs.stability });
    for (const [rk, rec] of [['canonical', cs.canonical], ['perturbed', cs.perturbed]]) {
      const r = rc(rec);
      if (r?.evidenceViolations?.length) evidenceViolations.push(`${caseId}-${cand}-${rk}: ${r.evidenceViolations.join(', ')}`);
      if (r?.crossCheckWarn) crossChecks.push(`${caseId}-${cand}-${rk}: harness ${r.composite.toFixed(1)} vs model ${r.modelComposite}`);
      if (r?.weightMismatch) crossChecks.push(`${caseId}-${cand}-${rk}: applied_weight mismatch vs rubric_weights.json`);
    }
  }

  // Rank + margin (mean composite).
  const order = [['S', S], ['D', D], ['W', W]].filter(([, c]) => c.meanComposite != null)
    .sort((a, b) => b[1].meanComposite - a[1].meanComposite).map(([k]) => k);
  const expectRank = spec.rank_order;
  const rankOk = JSON.stringify(order) === JSON.stringify(expectRank);
  if (rankOk) rankHits++;
  const margin = (S.meanComposite != null && D.meanComposite != null) ? S.meanComposite - D.meanComposite : null;
  const marginMin = spec.margins?.S_over_D_min ?? 10;
  const marginOk = margin != null && margin >= marginMin;
  if (marginOk) marginHits++;

  // Per-case assertions.
  const cand = { S, D, W };
  const assertResults = [];
  for (const a of spec.assertions) {
    const res = evalAssertion(a, caseId, cand);
    assertResults.push({ id: a.id, type: a.type, ...res });
  }
  caseResults[caseId] = { order, expectRank, rankOk, margin, marginMin, marginOk, assertResults, S, D, W };
}

function evalAssertion(a, caseId, cand) {
  const C = cand[a.candidate];
  const run1 = (cs) => cs && cs.canonical && cs.canonical.ok ? cs.canonical.score : null; // categorical → canonical run1
  switch (a.type) {
    case 'rank_order': {
      const order = [['S', cand.S], ['D', cand.D], ['W', cand.W]].filter(([, c]) => c.meanComposite != null)
        .sort((x, y) => y[1].meanComposite - x[1].meanComposite).map(([k]) => k);
      return bool(JSON.stringify(order) === JSON.stringify(a.order), order.join('>'));
    }
    case 'decoy_margin': {
      const m = cand.S.meanComposite - cand.D.meanComposite;
      return bool(m >= a.min, `S−D=${m?.toFixed(1)} (need ≥${a.min})`);
    }
    case 'also_beats': {
      const m = cand[a.a].meanComposite - cand[a.b].meanComposite;
      return bool(m > 0, `${a.a}−${a.b}=${m?.toFixed(1)}`);
    }
    case 'archetype_primary': {
      const s = run1(C || cand.S); // JD-level; read from S's canonical
      const got = run1(cand.S)?.archetype?.primary;
      return bool(got === a.expect, `primary=${got} (need ${a.expect})`);
    }
    case 'jd_a6_flag': {
      const got = !!run1(cand.S)?.a6_flag;
      return bool(got === a.expect, `a6_flag=${got}`);
    }
    case 'section_max': {
      const c = C.rcC || rc(C.canonical), p = C.rcP || rc(C.perturbed);
      const key = a.section;
      const v = mean(c?.sectionScore?.[key], p?.sectionScore?.[key]);
      return bool(v != null && v <= a.max, `${key}=${v?.toFixed(0)} (need ≤${a.max})`);
    }
    case 'confusion_flag_present': {
      const flags = run1(C)?.confusion_flags || [];
      return bool(flags.some((f) => Number(f.rule) === a.rule), `rules=[${flags.map((f) => f.rule).join(',')}]`);
    }
    case 'flagged_no_evidence_nonempty': {
      const n = (run1(C)?.s3_terms?.flagged_no_evidence || []).length;
      return bool(n >= 1, `flagged=${n}`);
    }
    case 'flagged_no_evidence_min': {
      const n = (run1(C)?.s3_terms?.flagged_no_evidence || []).length;
      return bool(n >= a.min, `flagged=${n} (need ≥${a.min})`);
    }
    case 'no_cert_token_outside_skills': {
      const s = run1(C);
      const leaks = (s?.s1_sections || []).filter((sec) => canonicalSectionKey(sec.name) !== 'skills_tools'
        && (sec.evidence || []).some((e) => CERT_TOKENS.test(String(e))));
      return bool(leaks.length === 0, leaks.length ? `leak in ${leaks.map((x) => x.name).join(',')}` : 'clean');
    }
    case 'gap_surfaces_must_have': {
      const gaps = run1(C)?.gaps || [];
      const hit = gaps.some((g) => g.question_to_operator && String(g.question_to_operator).trim()
        && /enterprise|sales cycle|6[- ]month|six[- ]month/i.test(`${g.gap} ${g.question_to_operator}`));
      return bool(hit, hit ? 'must-have surfaced as question' : 'not surfaced');
    }
    case 'logo_delta_max': {
      const anon = mean(cand.D.rcC?.composite ?? rc(cand.D.canonical)?.composite, cand.D.rcP?.composite ?? rc(cand.D.perturbed)?.composite);
      const uc = rc(load('G8', 'D', 'logoswap-canonical')), up = rc(load('G8', 'D', 'logoswap-perturbed'));
      const un = mean(uc?.composite, up?.composite);
      const delta = (anon != null && un != null) ? Math.abs(un - anon) : null;
      return { ...bool(delta != null && delta <= a.max, `logo_delta=${delta?.toFixed(1)} (need ≤${a.max})`), value: delta };
    }
    default: return bool(false, `unknown assertion type ${a.type}`);
  }
}
function bool(pass, detail) { return { pass: !!pass, detail }; }

// ---- Gates (GOLDEN_SET.md §Pass gates) ----
const stabilityViolations = allStability.filter((s) => s.delta != null && s.delta > cfg.stability_threshold);
const assertionsAllPass = Object.values(caseResults).every((c) => c.assertResults.every((a) => a.pass));
const g1_rank = rankHits >= 9;
const g2_margin = Object.values(caseResults).every((c) => c.marginOk);
const g3_stability = stabilityViolations.length === 0;
const g4_evidence = evidenceViolations.length === 0;
const g8 = caseResults['G8']?.assertResults.find((a) => a.type === 'logo_delta_max');
const g5_fairness = g8 ? g8.pass : false;
const g8band = labels.cases['G8']?.logo_delta_recheck_band || [2, 4];
const g8marginal = !!(g8 && !g8.pass && g8.value != null && g8.value > g8band[0] && g8.value < g8band[1]);
const g6_assertions = assertionsAllPass;
const gatesGreen = g1_rank && g2_margin && g3_stability && g4_evidence && g5_fairness && g6_assertions;

// ---- Per-case table ----
say('## Per-case results');
say('');
say('| case | rank (got→want) | margin S−D | assertions | verdict |');
say('|---|---|---|---|---|');
for (const [caseId, c] of Object.entries(caseResults)) {
  const aPass = c.assertResults.filter((a) => a.pass).length;
  const rank = `${c.order.join('>') || '—'} → ${c.expectRank.join('>')} ${c.rankOk ? '✅' : '❌'}`;
  const marg = c.margin != null ? `${c.margin.toFixed(1)} (≥${c.marginMin}) ${c.marginOk ? '✅' : '❌'}` : '— no data';
  const verdict = (c.rankOk && c.marginOk && aPass === c.assertResults.length) ? '✅' : '❌';
  say(`| ${caseId} | ${rank} | ${marg} | ${aPass}/${c.assertResults.length} | ${verdict} |`);
}
say('');
say('### Assertion detail');
for (const [caseId, c] of Object.entries(caseResults)) {
  say(`- **${caseId}** (${labels.cases[caseId].failure_mode}):`);
  for (const a of c.assertResults) say(`  - ${a.pass ? '✅' : '❌'} \`${a.id}\` (${a.type}) — ${a.detail}`);
}
say('');

// ---- Stability ----
say('## Stability (|run1−run2| on the perturbed pair; >5 fails gate 3)');
say('');
const worst = allStability.filter((s) => s.delta != null).sort((a, b) => b.delta - a.delta).slice(0, 8);
say(worst.length ? worst.map((s) => `- ${s.id}: ${s.delta.toFixed(1)}${s.delta > cfg.stability_threshold ? ' ⚠️ unstable' : ''}`).join('\n') : '- (no scored pairs yet)');
say('');

// ---- Integrity ----
if (crossChecks.length) { say('## Scorer-integrity warnings'); say(crossChecks.map((x) => `- ${x}`).join('\n')); say(''); }
if (evidenceViolations.length) { say('## Evidence-integrity violations (score>0, no quote)'); say(evidenceViolations.map((x) => `- ${x}`).join('\n')); say(''); }

// ---- Gates ----
say('## Pass gates');
say('');
const G = (ok, label, extra = '') => `- ${ok ? '✅' : '❌'} **${label}** ${extra}`;
say(G(g1_rank, 'Gate 1 — rank order S>D>W in ≥9/10', `(${rankHits}/10)`));
say(G(g2_margin, 'Gate 2 — decoy margin per case', ''));
say(G(g3_stability, 'Gate 3 — stability ≤5 on all pairs', stabilityViolations.length ? `(${stabilityViolations.length} unstable)` : ''));
say(G(g4_evidence, 'Gate 4 — evidence integrity', evidenceViolations.length ? `(${evidenceViolations.length} violations)` : ''));
if (g8marginal) {
  say(`- ⚠️ **Gate 5 — fairness probe G8 logo_delta ≤2** — MARGINAL (${g8.detail}). logo_delta is between ${g8band[0]} and ${g8band[1]}: this is a sample-size question first, not proven bias. Re-run BOTH G8 pairs once more (delete golden/results/G8-D-*.json and re-run) so each condition has four runs, then re-report. Only a clean fail above ${g8band[1]} on the wider sample counts as real bias.`);
} else {
  say(G(g5_fairness, 'Gate 5 — fairness probe G8 logo_delta ≤2', g8 ? `(${g8.detail})` : '(no G8 data)'));
}
say(G(g6_assertions, 'Gate 6 — all case assertions hold', ''));
say('');
say(`## Verdict: ${gatesGreen ? '🟢 ALL GATES GREEN — freeze the golden set, bump rubric to v1.0' : '🔴 NOT YET — fix rubric anchors/weights/confusion-rules only (never labels/resumes), log in PM_RUBRIC changelog, full re-run'}`);

const missing = [];
for (const caseId of Object.keys(labels.cases)) for (const cand of ['S', 'D', 'W']) for (const rk of ['canonical', 'perturbed']) {
  if (!load(caseId, cand, rk)) missing.push(`${caseId}-${cand}-${rk}`);
}
if (missing.length) { say(''); say(`> ⚠️ ${missing.length} result files missing (harness not fully run yet): ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? ' …' : ''}`); }

writeFileSync(P(cfg.paths.report), lines.join('\n') + '\n');
console.log(`Wrote ${cfg.paths.report} · gates ${gatesGreen ? 'GREEN' : 'not green'} · rank ${rankHits}/10 · stability violations ${stabilityViolations.length}`);
