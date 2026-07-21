// perturb.mjs (Rev 2) — build run 2 as a semantics-preserving perturbation, so
// the stability gate measures judgment robustness, not API nondeterminism.
// Two transforms: (a) shuffle bullet order within each Experience role
// (deterministic seeded, so runs are resumable); (b) relabel bracketed alias
// tokens to equivalent synonyms (surface change, same meaning). preserveNames
// (Fix 1) = bullet-shuffle only, used for the G8 un-anon probe so real logos
// survive. A robust rubric must land within 5 points; a scorer that swings on
// bullet order or alias wording is exactly what the gate exists to catch.

// Deterministic PRNG (mulberry32) seeded from a string, so the same input
// always perturbs the same way.
function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Equivalent surface synonyms for the alias VALUES used in golden/aliases.json.
// Identity fallback for anything not listed — meaning is always preserved.
const SYNONYMS = {
  '[Big Tech company]': '[large technology firm]',
  '[Late-stage fintech company]': '[late-stage fintech firm]',
  '[Seed-stage startup]': '[pre-Series-A startup]',
  '[Early-stage startup]': '[young startup]',
  '[B2B SaaS company]': '[B2B software-as-a-service firm]',
  '[E-commerce marketplace]': '[online marketplace]',
  '[Consumer subscription app]': '[subscription consumer app]',
  '[Consumer streaming app]': '[streaming consumer app]',
  '[NBFC lender]': '[non-bank lender]',
  '[Enterprise compliance software company]': '[enterprise compliance-software firm]',
  '[University]': '[university]',
  '[Engineering institute]': '[engineering school]',
};

/**
 * @param {string} resume anonymized (or, for the probe, un-anonymized) markdown
 * @param {{preserveNames?:boolean}} opts
 */
export function perturb(resume, opts = {}) {
  const preserveNames = !!opts.preserveNames;
  const lines = resume.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // At a role header inside Experience, collect the immediately-following
    // contiguous bullet block and shuffle just those bullets.
    if (/^###\s+/.test(line)) {
      out.push(line);
      i++;
      const start = i;
      const bullets = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) { bullets.push(lines[i]); i++; }
      if (bullets.length > 1) {
        const rng = seeded(line + '|' + bullets.length);
        out.push(...shuffle(bullets, rng));
      } else {
        out.push(...lines.slice(start, i));
      }
      continue;
    }
    out.push(line);
    i++;
  }
  let text = out.join('\n');
  if (!preserveNames) {
    for (const [from, to] of Object.entries(SYNONYMS)) {
      text = text.split(from).join(to);
    }
  }
  return text;
}
