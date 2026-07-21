// score.mjs — one scoring call. Assembles CRITIC_MODE_PROMPT (system) +
// PM_RUBRIC + JD + resume (user), calls Opus 4.8 via the Anthropic SDK, and
// extracts the Score JSON from the response.
//
// Opus 4.8 notes (from the claude-api skill): NO temperature/top_p/top_k (400);
// adaptive thinking + effort:"high" for judgment quality; stream + finalMessage
// to avoid HTTP timeouts on a large thinking+JSON response. JSON is stripped of
// <think> spans and ```json fences, then sliced first{…}last (EDGE_CASES JD-28/29).

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY / ant profile from env

export function extractJson(text) {
  let t = String(text || '').trim();
  // Strip a <think>...</think> span if a reasoning model leaked one.
  const ts = t.indexOf('<think>');
  const te = t.indexOf('</think>');
  if (ts !== -1 && te !== -1) t = (t.slice(0, ts) + t.slice(te + 8)).trim();
  // Strip ```json fences.
  t = t.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  // Slice from first { to last }.
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a === -1 || b === -1 || b < a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

/**
 * @param {{criticPrompt:string, rubric:string, jd:string, resume:string,
 *          probeMode?:string, cfg:object}} args
 * @returns {Promise<{ok:boolean, score?:object, error?:string, raw?:string}>}
 */
export async function score({ criticPrompt, rubric, jd, resume, probeMode, cfg }) {
  const userParts = [
    '## PM_RUBRIC.md (authoritative for what to measure)',
    rubric,
    '',
    '## JOB DESCRIPTION (verbatim)',
    jd,
    '',
    `## CANDIDATE RESUME (${probeMode === 'logo_swap' ? 'un-anonymized; probe_mode: logo_swap' : 'anonymized'})`,
    resume,
    '',
    'Emit exactly the Score JSON described in your instructions. No prose outside the JSON.',
  ];
  if (probeMode === 'logo_swap') {
    userParts.unshift('probe_mode: logo_swap  (score normally; do NOT emit anonymization_failure)', '');
  }

  const req = {
    model: cfg.model,
    max_tokens: cfg.max_tokens,
    thinking: { type: cfg.thinking || 'adaptive' },
    output_config: { effort: cfg.effort || 'high' },
    system: criticPrompt,
    messages: [{ role: 'user', content: userParts.join('\n') }],
  };

  let message;
  try {
    if (cfg.stream) {
      const stream = client.messages.stream(req);
      message = await stream.finalMessage();
    } else {
      message = await client.messages.create(req);
    }
  } catch (err) {
    return { ok: false, error: `api_error: ${err?.message || err}` };
  }

  if (message.stop_reason === 'refusal') {
    return { ok: false, error: `refusal: ${message.stop_details?.category || 'unknown'}` };
  }
  const text = (message.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  const parsed = extractJson(text);
  if (!parsed) return { ok: false, error: 'parse_failure', raw: text.slice(0, 4000) };
  if (parsed.error === 'anonymization_failure') {
    return { ok: false, error: 'anonymization_failure', detail: parsed.detail };
  }
  return { ok: true, score: parsed };
}
