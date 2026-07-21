// schema.mjs — validate the v2.0 Score JSON and deterministically recompute
// S1/S2/S3 + composite from the model's emitted classifications (ADR-003).
// The model's own `composite` is a cross-check only; the canonical weights in
// config/rubric_weights.json drive S1 (the sole calibration tunable).

export const SECTION_KEYS = [
  'role_seniority', 'domain', 'product_sense', 'execution',
  'data_metrics', 'strategy', 'leadership', 'skills_tools',
];

// Match the model's section name to a canonical key by keyword, so we're robust
// to phrasing ("Data & metrics fluency", "Product sense & customer insight",
// "Skills / tools coverage", …) rather than requiring an exact tag. Order matters
// only in that the patterns are mutually exclusive across the 8 rubric sections.
const SECTION_MATCHERS = [
  ['role_seniority', /\brole\b|seniority/],
  ['data_metrics', /\bdata\b|metric/],
  ['product_sense', /product|customer\s*insight/],
  ['execution', /execution|delivery/],
  ['leadership', /leadership|stakeholder/],
  ['strategy', /strateg|vision/],
  ['domain', /domain/],
  ['skills_tools', /skill|tool/],
];

export function canonicalSectionKey(name) {
  const n = String(name || '').toLowerCase();
  for (const [key, re] of SECTION_MATCHERS) if (re.test(n)) return key;
  return null;
}

// Resolve per-archetype applied weights: base + shift, floor, normalize to 100.
export function resolveWeights(weightsCfg, archetypePrimary) {
  const base = weightsCfg.base;
  const shift = (weightsCfg.shifts && weightsCfg.shifts[archetypePrimary]) || {};
  const floor = weightsCfg.floor ?? 4;
  const raw = {};
  let sum = 0;
  for (const k of SECTION_KEYS) {
    raw[k] = Math.max(floor, (base[k] || 0) + (shift[k] || 0));
    sum += raw[k];
  }
  const applied = {};
  for (const k of SECTION_KEYS) applied[k] = (raw[k] / sum) * 100;
  return applied; // sums to 100
}

export function validate(score) {
  const errors = [];
  if (!score || typeof score !== 'object') return { ok: false, errors: ['not an object'] };
  if (score.error) return { ok: false, errors: [`model error: ${score.error}`], modelError: score.error };
  if (!score.archetype || !score.archetype.primary) errors.push('missing archetype.primary');
  if (!Array.isArray(score.s1_sections)) errors.push('missing s1_sections[]');
  else {
    const seen = new Set();
    for (const s of score.s1_sections) {
      const key = canonicalSectionKey(s.name);
      if (!key) errors.push(`unrecognized s1 section "${s.name}"`);
      else seen.add(key);
      if (typeof s.score !== 'number' || s.score < 0 || s.score > 100) errors.push(`s1 "${s.name}" score out of range`);
      if (!Array.isArray(s.evidence)) errors.push(`s1 "${s.name}" evidence not an array`);
    }
    for (const k of SECTION_KEYS) if (!seen.has(k)) errors.push(`s1 missing section ${k}`);
  }
  if (!Array.isArray(score.s2_requirements)) errors.push('missing s2_requirements[]');
  if (!score.s3_terms || typeof score.s3_terms !== 'object') errors.push('missing s3_terms');
  if (!Array.isArray(score.confusion_flags)) errors.push('missing confusion_flags[]');
  if (!Array.isArray(score.gaps)) errors.push('missing gaps[]');
  return { ok: errors.length === 0, errors };
}

// Deterministic recompute. Returns the authoritative signals + integrity checks.
export function recompute(score, weightsCfg, harnessCfg) {
  const cw = harnessCfg.composite_weights;
  const s2c = harnessCfg.s2_recompute;
  const s3c = harnessCfg.s3_recompute;
  const applied = resolveWeights(weightsCfg, score.archetype.primary);

  // S1 — Σ(section.score × applied_weight)/100, canonical weights.
  const sectionScore = {};
  for (const s of score.s1_sections) {
    const k = canonicalSectionKey(s.name);
    if (k) sectionScore[k] = s.score;
  }
  let s1 = 0;
  for (const k of SECTION_KEYS) s1 += (sectionScore[k] ?? 0) * applied[k] / 100;

  // applied_weight cross-check vs the model's emitted applied_weight.
  let weightMismatch = false;
  for (const s of score.s1_sections) {
    const k = canonicalSectionKey(s.name);
    if (k && typeof s.applied_weight === 'number' && Math.abs(s.applied_weight - applied[k]) > 0.6) weightMismatch = true;
  }

  // S2 — met=1/partial=0.5/missing=0, must-haves double-weighted.
  let num = 0, den = 0;
  for (const r of score.s2_requirements || []) {
    const w = (r.type === 'must') ? s2c.must_weight : s2c.nice_weight;
    const v = s2c.status_value[r.status] ?? 0;
    num += v * w; den += w;
  }
  const s2 = den > 0 ? (num / den) * 100 : 0;

  // S3 — (matched + synonym_matched)/(all four arrays) × 100.
  const t = score.s3_terms || {};
  const cnt = (a) => Array.isArray(a) ? a.length : 0;
  const total = cnt(t.matched) + cnt(t.synonym_matched) + cnt(t.flagged_no_evidence) + cnt(t.missing_terms);
  const s3 = total > 0
    ? (cnt(t.matched) * s3c.matched + cnt(t.synonym_matched) * s3c.synonym_matched) / total * 100
    : 0;

  const composite = cw.s1 * s1 + cw.s2 * s2 + cw.s3 * s3;

  const modelComposite = typeof score.composite === 'number' ? score.composite : null;
  const crossCheckWarn = modelComposite != null && Math.abs(composite - modelComposite) > harnessCfg.composite_cross_check_tolerance;

  // Evidence integrity: any nonzero S1 section with no verbatim quote.
  const evidenceViolations = [];
  for (const s of score.s1_sections) {
    if (s.score > 0 && (!Array.isArray(s.evidence) || s.evidence.filter((e) => String(e).trim()).length === 0)) {
      evidenceViolations.push(s.name);
    }
  }

  return {
    s1, s2, s3, composite, applied, sectionScore,
    modelComposite, crossCheckWarn, weightMismatch, evidenceViolations,
  };
}
