// anthropic.mjs — Claude provider. Caches the identical critic-prompt+rubric in
// the system block (cache_control), streams (avoids HTTP timeouts on long
// thinking+JSON), and captures usage. Also exports buildParams for the batch
// path (Message Batches API is Anthropic-only). Opus 4.8 / Sonnet 5 reject
// temperature/top_p/top_k — none are sent.

import Anthropic from '@anthropic-ai/sdk';
import { RUBRIC_HEADER, jdResumeBlock, normalizeResult } from './_shared.mjs';

export const client = new Anthropic(); // reads ANTHROPIC_API_KEY / ant profile

export function buildParams({ criticPrompt, rubric, jd, resume, probeMode, cfg }) {
  return {
    model: cfg.model,
    max_tokens: cfg.max_tokens,
    thinking: { type: cfg.thinking || 'adaptive' },
    output_config: { effort: cfg.effort || 'high' },
    system: [
      { type: 'text', text: criticPrompt },
      { type: 'text', text: RUBRIC_HEADER + rubric, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: jdResumeBlock({ jd, resume, probeMode }) }],
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

// Normalize a completed (or batch-result) Anthropic Message.
export function parseResult(message) {
  const usage = usageOf(message);
  if (message.stop_reason === 'refusal') {
    return normalizeResult({ text: '', usage, refusal: message.stop_details?.category || 'unknown' });
  }
  const text = (message.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  return normalizeResult({ text, usage });
}

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
