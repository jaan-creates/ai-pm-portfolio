// score.mjs — assemble + run one scoring call, and expose the pieces the batch
// path needs. The critic prompt + rubric are identical on every call, so they
// go in the system block with cache_control (prompt caching): charged full once,
// then ~10% on every later call within the 5-min TTL (calls are ~70s apart, so
// the cache stays warm across the whole run). Usage is captured on every result.
//
// Opus 4.8 / Sonnet 5: NO temperature/top_p/top_k (400). Adaptive thinking +
// effort for judgment. Live path streams (avoids HTTP timeouts); batch path is
// non-streaming (async, server-side). JSON stripped of <think>/```json fences,
// sliced first{…}last (EDGE_CASES JD-28/29).

import Anthropic from '@anthropic-ai/sdk';

export const client = new Anthropic(); // reads ANTHROPIC_API_KEY / ant profile

const RUBRIC_HEADER = '## PM_RUBRIC.md (authoritative for what to measure)\n';

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

// Build the Messages API params (shared by the live and batch paths).
// system = [critic prompt] + [rubric, cached]; user = JD + resume (the variable
// part). No `stream` key here — the live path adds it, batch must omit it.
export function buildParams({ criticPrompt, rubric, jd, resume, probeMode, cfg }) {
  const userParts = [];
  if (probeMode === 'logo_swap') userParts.push('probe_mode: logo_swap  (score normally; do NOT emit anonymization_failure)', '');
  userParts.push(
    '## JOB DESCRIPTION (verbatim)', jd, '',
    `## CANDIDATE RESUME (${probeMode === 'logo_swap' ? 'un-anonymized; probe_mode: logo_swap' : 'anonymized'})`, resume, '',
    'Emit exactly the Score JSON described in your instructions. No prose outside the JSON.',
  );
  return {
    model: cfg.model,
    max_tokens: cfg.max_tokens,
    thinking: { type: cfg.thinking || 'adaptive' },
    output_config: { effort: cfg.effort || 'high' },
    system: [
      { type: 'text', text: criticPrompt },
      { type: 'text', text: RUBRIC_HEADER + rubric, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: userParts.join('\n') }],
  };
}

function usageOf(message) {
  const u = message && message.usage;
  if (!u) return null;
  return {
    input_tokens: u.input_tokens ?? 0,
    output_tokens: u.output_tokens ?? 0,
    cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
  };
}

// Turn a completed Message into our result shape (used by live + batch).
export function parseResult(message) {
  const usage = usageOf(message);
  if (message.stop_reason === 'refusal') {
    return { ok: false, error: `refusal: ${message.stop_details?.category || 'unknown'}`, usage };
  }
  const text = (message.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  const parsed = extractJson(text);
  if (!parsed) return { ok: false, error: 'parse_failure', raw: text.slice(0, 4000), usage };
  if (parsed.error === 'anonymization_failure') return { ok: false, error: 'anonymization_failure', detail: parsed.detail, usage };
  return { ok: true, score: parsed, usage };
}

// Live single call (streaming so a long thinking+JSON response can't time out).
export async function score({ criticPrompt, rubric, jd, resume, probeMode, cfg }) {
  const params = buildParams({ criticPrompt, rubric, jd, resume, probeMode, cfg });
  let message;
  try {
    message = cfg.stream
      ? await client.messages.stream(params).finalMessage()
      : await client.messages.create(params);
  } catch (err) {
    return { ok: false, error: `api_error: ${err?.message || err}` };
  }
  return parseResult(message);
}
