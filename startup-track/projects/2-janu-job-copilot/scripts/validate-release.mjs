import fs from 'node:fs';
import crypto from 'node:crypto';

const path = process.argv[2] || 'startup-track/projects/2-janu-job-copilot/apps-script/TrackerWorkflow.gs';
const expectedVersion = process.env.EXPECTED_VERSION || '1.3.2';
const expectedSuite = process.env.EXPECTED_SUITE || 'p0-regression-v13';
const text = fs.readFileSync(path, 'utf8');

function fail(msg) { console.error(`FAIL: ${msg}`); process.exitCode = 1; }

const p12Version = text.match(/P12\s*=\s*Object\.freeze\(\{[\s\S]*?VERSION\s*:\s*'([^']+)'/);
const p12Suite = text.match(/P12\s*=\s*Object\.freeze\(\{[\s\S]*?SUITE\s*:\s*'([^']+)'/);
const verifyBlock = text.match(/function verifyReleaseIdentity\(\)\s*\{([\s\S]*?)\n\}/);
const releaseTest = text.match(/RELEASE-001[\s\S]{0,1200}/);
const headerVersion = text.match(/\/\/ RELEASE:\s*([^\n]+)/);
const headerSuite = text.match(/\/\/ REGRESSION SUITE:\s*([^\n]+)/);

if (!p12Version || p12Version[1] !== expectedVersion) fail(`P12 VERSION mismatch: ${p12Version?.[1]}`);
if (!p12Suite || p12Suite[1] !== expectedSuite) fail(`P12 SUITE mismatch: ${p12Suite?.[1]}`);
if (!headerVersion || headerVersion[1].trim() !== expectedVersion) fail(`header VERSION mismatch: ${headerVersion?.[1]}`);
if (!headerSuite || headerSuite[1].trim() !== expectedSuite) fail(`header SUITE mismatch: ${headerSuite?.[1]}`);
if (!verifyBlock || !verifyBlock[1].includes(`expectedVersion='${expectedVersion}'`) || !verifyBlock[1].includes(`expectedSuite='${expectedSuite}'`)) fail('verifyReleaseIdentity is not bound to expected release');
if (!releaseTest || !releaseTest[0].includes(expectedVersion) || !releaseTest[0].includes(expectedSuite)) fail('RELEASE-001 is not bound to expected release');

const oldIdentities = ['1.3.1','p0-regression-v12','1.3.0','p0-regression-v11','1.2.9','p0-regression-v10'];
for (const token of oldIdentities) if (text.includes(token)) fail(`stale release identity literal present: ${token}`);

const fnNames = [...text.matchAll(/^function\s+([A-Za-z0-9_$]+)\s*\(/gm)].map(m=>m[1]);
const dup = [...new Set(fnNames.filter((n,i,a)=>a.indexOf(n)!==i))];
if (dup.length) fail(`duplicate top-level functions: ${dup.join(', ')}`);

if (!text.includes('PACK-SAN-001')) fail('PACK-SAN-001 missing');
if (!text.includes('QA-REPAIR-001')) fail('QA-REPAIR-001 missing');
if (!text.includes('BOOTSTRAP-003')) fail('BOOTSTRAP-003 missing');

const sha = crypto.createHash('sha256').update(text).digest('hex');
console.log(JSON.stringify({status: process.exitCode ? 'FAIL' : 'PASS', expectedVersion, expectedSuite, functions: fnNames.length, sha}, null, 2));
