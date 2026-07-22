// _shared.mjs — provider-agnostic helpers. No SDK imports here, so both
// providers and score.mjs can use them without circular deps.

export const RUBRIC_HEADER = '## PM_RUBRIC.md (authoritative for what to measure)\n';

// Strip <think> spans and ```json fences, then slice first{…}last (EDGE_CASES
// JD-28/29). Providers that return clean JSON (Gemini's responseMimeType mode)
// pass straight through.
export function extractJson(text) {
  let t = String(text || '').trim();
  const ts = t.indexOf('<think>');
  const te = t.indexOf('</think>');
  if (ts !== -1 && te !== -1) t = (t.slice(0, ts) + t.slice(te + 8)).trim();
  t = t.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a === -1 || b === -1 || b < a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

// The variable, model-visible part of the prompt (JD + resume). The rubric is
// added by each provider where it belongs (Anthropic: cached system block;
// Gemini: prepended to contents).
export function jdResumeBlock({ jd, resume, probeMode }) {
  const parts = [];
  if (probeMode === 'logo_swap') parts.push('probe_mode: logo_swap  (score normally; do NOT emit anonymization_failure)', '');
  parts.push(
    '## JOB DESCRIPTION (verbatim)', jd, '',
    `## CANDIDATE RESUME (${probeMode === 'logo_swap' ? 'un-anonymized; probe_mode: logo_swap' : 'anonymized'})`, resume, '',
    'Emit exactly the Score JSON described in your instructions. No prose outside the JSON.',
  );
  return parts.join('\n');
}

// Turn raw model output into our normalized result shape.
export function normalizeResult({ text, usage, refusal }) {
  if (refusal) return { ok: false, error: `refusal: ${refusal}`, usage };
  const parsed = extractJson(text);
  if (!parsed) return { ok: false, error: 'parse_failure', raw: String(text || '').slice(0, 4000), usage };
  if (parsed.error === 'anonymization_failure') return { ok: false, error: 'anonymization_failure', detail: parsed.detail, usage };
  return { ok: true, score: parsed, usage };
}
