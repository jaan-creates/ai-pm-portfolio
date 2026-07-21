// anonymize.mjs — strip candidate identity + alias employers/institutions.
// CRITIC_MODE_PROMPT.md requires the resume anonymized (names, employer &
// institution names) before scoring; the prompt itself errors on a leak, which
// the harness records as an anonymizer bug. For the G8 logo-swap probe we strip
// the name but keep real employers (aliasEmployers:false).

import { readFileSync } from 'fs';

export function loadAliases(path) {
  const j = JSON.parse(readFileSync(path, 'utf8'));
  return { employers: j.employers || {}, institutions: j.institutions || {} };
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Replace an exact proper-noun key only at token boundaries (so "Meta" never
// hits "metrics"/"Metadata"); works for multi-word keys with spaces/&/parens.
function replaceToken(text, key, value) {
  const re = new RegExp(`(?<![A-Za-z0-9])${esc(key)}(?![A-Za-z0-9])`, 'g');
  return text.replace(re, value);
}

/**
 * @param {string} resume raw markdown
 * @param {{employers:object,institutions:object}} aliases
 * @param {{stripName?:boolean, aliasEmployers?:boolean}} opts
 */
export function anonymize(resume, aliases, opts = {}) {
  const stripName = opts.stripName !== false;      // default true
  const aliasEmployers = opts.aliasEmployers !== false; // default true
  let out = resume;

  if (stripName) {
    // First H1 → "# Candidate"; strip email + linkedin slugs everywhere.
    out = out.replace(/^#\s+.+$/m, '# Candidate');
    out = out.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z.]+/g, '[email]');
    out = out.replace(/linkedin\.com\/in\/[A-Za-z0-9-]+/gi, '[linkedin]');
  }

  if (aliasEmployers) {
    // Longest keys first so a short key can't pre-empt a longer one.
    const pairs = [
      ...Object.entries(aliases.employers),
      ...Object.entries(aliases.institutions),
    ].sort((a, b) => b[0].length - a[0].length);
    for (const [key, value] of pairs) out = replaceToken(out, key, value);
  }
  return out;
}
