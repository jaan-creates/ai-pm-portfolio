// score.mjs — provider facade. Routes a scoring call to the right provider by
// model id (claude-* → Anthropic, gemini-* → Google), and re-exports the
// Anthropic-only pieces the batch path needs. Shared JSON/usage helpers live in
// providers/_shared.mjs; each provider owns its request shape.

import * as anthropic from './providers/anthropic.mjs';
import * as gemini from './providers/gemini.mjs';
export { extractJson } from './providers/_shared.mjs';

export function providerFor(model) {
  const m = String(model || '');
  if (m.startsWith('gemini')) return 'gemini';
  if (m.startsWith('claude')) return 'anthropic';
  return 'anthropic'; // default
}

export async function score(args) {
  return providerFor(args.cfg.model) === 'gemini' ? gemini.score(args) : anthropic.score(args);
}

// Anthropic-only exports for the Message Batches path in run.mjs (batch is
// Anthropic-only; run.mjs guards --batch to a claude model).
export const client = anthropic.client;
export const buildParams = anthropic.buildParams;
export const parseResult = anthropic.parseResult;
