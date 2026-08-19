import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const input=process.argv[2]||'.janu-live';
const expectedVersion=process.env.EXPECTED_VERSION||'1.3.7';
const expectedSuite=process.env.EXPECTED_SUITE||'p0-regression-v18';
let files=[];
if(fs.existsSync(input)&&fs.statSync(input).isDirectory())files=fs.readdirSync(input).filter(f=>f.endsWith('.gs')||f.endsWith('.js')).sort().map(f=>path.join(input,f));
else if(fs.existsSync(input))files=[input];
if(!files.length)throw new Error(`No Apps Script .gs/.js source found at ${input}`);
const text=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
function fail(msg){console.error(`FAIL: ${msg}`);process.exitCode=1;}

const p12Version=text.match(/P12\s*=\s*Object\.freeze\(\{[\s\S]*?VERSION\s*:\s*'([^']+)'/);
const p12Suite=text.match(/P12\s*=\s*Object\.freeze\(\{[\s\S]*?SUITE\s*:\s*'([^']+)'/);
const verifyBlock=text.match(/function verifyReleaseIdentity\(\)\s*\{([\s\S]*?)\n\}/);
const releaseLine=text.split('\n').find(line=>line.includes("'RELEASE-001'"));
const headerVersion=text.match(/\/\/ RELEASE:\s*([^\n]+)/);
const headerSuite=text.match(/\/\/ REGRESSION SUITE:\s*([^\n]+)/);
if(!p12Version||p12Version[1]!==expectedVersion)fail(`P12 VERSION mismatch: ${p12Version?.[1]}`);
if(!p12Suite||p12Suite[1]!==expectedSuite)fail(`P12 SUITE mismatch: ${p12Suite?.[1]}`);
if(!headerVersion||headerVersion[1].trim()!==expectedVersion)fail(`header VERSION mismatch: ${headerVersion?.[1]}`);
if(!headerSuite||headerSuite[1].trim()!==expectedSuite)fail(`header SUITE mismatch: ${headerSuite?.[1]}`);
if(!verifyBlock||!verifyBlock[1].includes(`expectedVersion='${expectedVersion}'`)||!verifyBlock[1].includes(`expectedSuite='${expectedSuite}'`))fail('verifyReleaseIdentity is not bound to expected release');
if(!releaseLine||!releaseLine.includes(`P12.VERSION==='${expectedVersion}'`)||!releaseLine.includes(`P12.SUITE==='${expectedSuite}'`)||!releaseLine.includes(`'${expectedVersion}|${expectedSuite}'`))fail('RELEASE-001 is not bound to expected release');
for(const token of ['1.3.6','p0-regression-v17','1.3.5','p0-regression-v16','1.3.4','p0-regression-v15','1.3.3','p0-regression-v14','1.3.2','p0-regression-v13','1.3.1','p0-regression-v12','1.3.0','p0-regression-v11','1.2.9','p0-regression-v10'])if(text.includes(token))fail(`stale release identity literal present: ${token}`);

const fnNames=[...text.matchAll(/^function\s+([A-Za-z0-9_$]+)\s*\(/gm)].map(m=>m[1]);
const dup=[...new Set(fnNames.filter((n,i,a)=>a.indexOf(n)!==i))];
if(dup.length)fail(`duplicate top-level functions: ${dup.join(', ')}`);
for(const required of ['PACK-SAN-001','QA-REPAIR-001','BOOTSTRAP-003','BOOTSTRAP-004','BOOTSTRAP-005','BOOTSTRAP-006','BOOTSTRAP-007','CONTROL-001','CONTROL-002','RELEASE-001'])if(!text.includes(required))fail(`${required} missing`);
if(!text.includes("status:'LOCKED_RETRY_SAFE'"))fail('retry-safe closure lock collision guard missing');
if(!text.includes("function lockCollisionAction_(triggerCount){return 'SCHEDULE_REPLACEMENT';}"))fail('FL-031 unconditional replacement action missing');
if(!text.includes('replacementScheduled:true'))fail('FL-031 replacement scheduling evidence missing');
if(!text.includes("lockCollisionAction_(1)==='SCHEDULE_REPLACEMENT'"))fail('BOOTSTRAP-005 does not reject trusting the currently executing one-shot watchdog');
if(!text.includes('function processOperatorCommand_('))fail('operator-command dispatcher missing');
if(!text.includes("operatorCommandAction_('eval(1)')==='REJECT'"))fail('operator-command reject regression missing');
if(!text.includes('function phase1HealthTick(){const op=processOperatorCommand_();if(op)return op;'))fail('CONTROL-002 health-trigger operator fallback missing');
if(!text.includes("function p0PrepareAction_(){return 'DEFER_TO_STRICT_GATES';}"))fail('FL-033 bounded PREPARE helper missing');
if(!text.includes("p0PrepareAction_()==='DEFER_TO_STRICT_GATES'"))fail('BOOTSTRAP-006 bounded PREPARE regression missing');
if(!text.includes('function enablePreflightMode_('))fail('FL-034 enable preflight decision helper missing');
if(!text.includes('function closureAwareEnablePreflight_('))fail('FL-034 closure-aware enable preflight helper missing');
const enableBlock=text.match(/function enablePhase1_2Worker\(\)\s*\{([\s\S]*?)\n\}/);
if(!enableBlock||!enableBlock[1].includes('closureAwareEnablePreflight_('))fail('enablePhase1_2Worker is not wired to bounded closure-aware preflight');
if(!text.includes("enablePreflightMode_('ENABLE','PASS')==='REUSE_STRICT_PREFLIGHT'"))fail('BOOTSTRAP-007 does not prove closure ENABLE reuses durable strict PASS');
if(!text.includes("enablePreflightMode_('ENABLE','FAIL')==='RUN_PREFLIGHT'"))fail('BOOTSTRAP-007 does not prove failed strict preflight is never reused');
if(!text.includes("enablePreflightMode_('COMPLETE','PASS')==='RUN_PREFLIGHT'"))fail('BOOTSTRAP-007 does not preserve full standalone enable preflight');

const sha=crypto.createHash('sha256').update(text).digest('hex');
console.log(JSON.stringify({status:process.exitCode?'FAIL':'PASS',expectedVersion,expectedSuite,files:files.map(f=>path.basename(f)),functions:fnNames.length,sha,fixes:['FL-031','CONTROL-002','FL-033','FL-034']},null,2));
if(process.exitCode)process.exit(process.exitCode);
