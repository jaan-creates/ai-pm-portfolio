// gemini.mjs — Google Gemini provider (free tier: Flash / Flash-Lite). Package
// @google/genai. The critic prompt goes in systemInstruction; rubric + JD +
// resume go in contents; responseMimeType JSON forces clean JSON out. Free tier
// is ~15 req/min, so calls are throttled and 429s are backed off. Usage is
// mapped into the shared shape (cost = $0 on the free tier).
//
// PRIVACY: the FREE tier may use inputs to train Google's models. Fine for the
// synthetic golden set; for real-resume runs switch to the paid tier (no
// training) or a local model — see docs/adr/ADR-005-model-providers.md.

import { GoogleGenAI } from '@google/genai';
import { RUBRIC_HEADER, jdResumeBlock, normalizeResult } from './_shared.mjs';

let _ai = null;
function ai() {
  if (!_ai) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set (put it in .env — free key at aistudio.google.com)');
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
}

// Simple module-level rate limiter: at most `rpm` calls/min, spaced evenly.
let lastCall = 0;
async function throttle(rpm) {
  const minGap = 60000 / (rpm || 15);
  const wait = lastCall + minGap - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}

function usageOf(r) {
  const u = r && r.usageMetadata;
  if (!u) return null;
  return {
    input_tokens: u.promptTokenCount || 0,
    output_tokens: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0),
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: u.cachedContentTokenCount || 0,
  };
}

export async function score({ criticPrompt, rubric, jd, resume, probeMode, cfg }) {
  const contents = RUBRIC_HEADER + rubric + '\n\n' + jdResumeBlock({ jd, resume, probeMode });
  const req = {
    model: cfg.model,
    contents,
    config: { systemInstruction: criticPrompt, responseMimeType: 'application/json' },
  };
  const maxRetries = 4;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await throttle(cfg.requests_per_min);
      const r = await ai().models.generateContent(req);
      return normalizeResult({ text: r.text, usage: usageOf(r) });
    } catch (err) {
      const msg = String(err?.message || err);
      const retriable = /\b429\b|RESOURCE_EXHAUSTED|quota|rate.?limit|unavailable|\b503\b/i.test(msg);
      if (retriable && attempt < maxRetries) {
        const backoff = Math.min(60000, 2000 * 2 ** attempt) * (0.8 + Math.random() * 0.4);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      return { ok: false, error: `api_error: ${msg}` };
    }
  }
}
