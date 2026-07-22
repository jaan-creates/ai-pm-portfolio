// loadenv.mjs — tiny, dependency-free loader for ../.env. Must be imported
// FIRST in run.mjs so ANTHROPIC_API_KEY is in process.env before score.mjs
// constructs the Anthropic client at module load. (.env is gitignored.)
//
// Tolerant on purpose (the operator writes this file by hand on Windows):
//  - strips a leading UTF-8 BOM (PowerShell/Notepad add one);
//  - accepts NAME=value lines (optionally quoted), ignores # comments;
//  - accepts a bare `sk-ant-…` / `AIza…` key with no NAME= prefix and treats it
//    as ANTHROPIC_API_KEY / GEMINI_API_KEY (the most common hand-editing mistake).
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const envPath = join(dirname(dirname(fileURLToPath(import.meta.url))), '.env');
if (existsSync(envPath)) {
  let raw = readFileSync(envPath, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // strip BOM
  for (const line of raw.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const m = s.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[m[1]]) process.env[m[1]] = v;
    } else if (/^sk-ant-\S+$/.test(s) && !process.env.ANTHROPIC_API_KEY) {
      process.env.ANTHROPIC_API_KEY = s; // bare Anthropic key, no NAME= prefix
    } else if (/^AIza[0-9A-Za-z_-]{20,}$/.test(s) && !process.env.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = s; // bare Google/Gemini key, no NAME= prefix
    }
  }
}
