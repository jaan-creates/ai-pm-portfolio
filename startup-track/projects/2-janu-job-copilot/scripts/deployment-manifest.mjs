import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const hashOnly = args.includes('--hash-only');
const rootArg = args.find(x => !x.startsWith('--')) || '.janu-live';
const root = path.resolve(rootArg);

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

const sourceFiles = fs.readdirSync(root)
  .filter(name => name.endsWith('.gs') || name.endsWith('.js'))
  .sort();

if (!sourceFiles.length) throw new Error(`No Apps Script source files found in ${root}`);

const files = sourceFiles.map(name => {
  const bytes = fs.readFileSync(path.join(root, name));
  return {name, bytes: bytes.length, sha256: sha256(bytes)};
});

// Aggregate only file names + individual hashes so the manifest never contains source text.
const aggregateInput = files.map(x => `${x.name}:${x.sha256}`).join('\n');
const sourceAggregateSha256 = sha256(Buffer.from(aggregateInput, 'utf8'));

if (hashOnly) {
  process.stdout.write(sourceAggregateSha256);
  process.exit(0);
}

const manifest = {
  schema: 'JANU-DEPLOYMENT-MANIFEST-1',
  generatedAt: new Date().toISOString(),
  gitCommit: process.env.GITHUB_SHA || null,
  gitRef: process.env.GITHUB_REF || null,
  expectedVersion: process.env.EXPECTED_VERSION || null,
  expectedSuite: process.env.EXPECTED_SUITE || null,
  sourceAggregateSha256,
  files
};

console.log(JSON.stringify(manifest, null, 2));