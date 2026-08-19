import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const input = process.argv[2] || '.janu-live';
const expectedVersion = process.env.EXPECTED_VERSION || '1.3.3';
const expectedSuite = process.env.EXPECTED_SUITE || 'p0-regression-v14';

let files = [];
if (fs.existsSync(input) && fs.statSync(input).isDirectory()) {
  files = fs.readdirSync(input).filter(f => f.endsWith('.gs') || f.endsWith('.js')).sort().map(f => path.join(input, f));
} else if (fs.existsSync(input)) {
  files = [input];
}
if (!files.length) throw new Error(`No Apps Script .gs/.js source found at ${input}`);

const text = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
function fail(msg) { console.error(`FAIL: ${msg}`); process.exitCode = 1; }

const p12Version = text.match(/P12\s*=\s*Object\.freeze\(\{[\s\S]*?VERSION\s*:\s*'([^']+)'/);
const p12Suite = text.match(/P12\s*=\s*Object\.freeze\(\{[\s\S]*?SUITE\s*:\s*'([^']+)'/);
const verifyBlock = text.match(/function verifyReleaseIdentity\(\)\s*\{([\s\S]*?)\n\}/);
const releaseTest = text.match(/RELEASE-001[\s\S]{0,1600}/);
const headerVersion = text.match(/\/\/ RELEASE:\s*([^\n]+)/);
const headerSuite = text.match(/\/\/ REGRESSION SUITE:\s*([^\n]+)/);

if (!p12Version || p12Version[1] !== expectedVersion) fail(`P12 VERSION mismatch: ${p12Version?.[1]}`);
if (!p12Suite || p12Suite[1] !== expectedSuite) fail(`P12 SUITE mismatch: ${p12Suite?.[1]}`);
if (!headerVersion || headerVersion[1].trim() !== expectedVersion) fail(`header VERSION mismatch: ${headerVersion?.[1]}`);
if (!headerSuite || headerSuite[1].trim() !== expectedSuite) fail(`header SUITE mismatch: ${headerSuite?.[1]}`);
if (!verifyBlock || !verifyBlock[1].includes(`expectedVersion='${expectedVersion}'`) || !verifyBlock[1].includes(`expectedSuite='${expectedSuite}'`)) fail('verifyReleaseIdentity is not bound to expected release');
if (!releaseTest || !releaseTest[0].includes(expectedVersion) || !releaseTest[0].includes(expectedSuite)) fail('RELEASE-001 is not bound to expected release');

const oldIdentities = ['1.3.2','p0-regression-v13','1.3.1','p0-regression-v12','1.3.0','p0-regression-v11','1.2.9','p0-regression-v10'];
for (const token of oldIdentities) if (text.includes(token)) fail(`stale release identity literal present: ${token}`);

const fnNames = [...text.matchAll(/^function\s+([A-Za-z0-9_$]+)\s*\(/gm)].map(m => m[1]);
const dup = [...new Set(fnNames.filter((n,i,a) => a.indexOf(n) !== i))];
if (dup.length) fail(`duplicate top-level functions: ${dup.join(', ')}`);

for (const required of ['PACK-SAN-001','QA-REPAIR-001','BOOTSTRAP-003','BOOTSTRAP-004','CONTROL-001','RELEASE-001']) {
  if (!text.includes(required)) fail(`${required} missing`);
}
if (!text.includes("status:'LOCKED_RETRY_SAFE'")) fail('retry-safe closure lock collision guard missing');
if (!text.includes('function processOperatorCommand_(')) fail('operator-command dispatcher missing');

const sha = crypto.createHash('sha256').update(text).digest('hex');
console.log(JSON.stringify({status: process.exitCode ? 'FAIL' : 'PASS', expectedVersion, expectedSuite, files: files.map(f => path.basename(f)), functions: fnNames.length, sha}, null, 2));
if (process.exitCode) process.exit(process.exitCode);
