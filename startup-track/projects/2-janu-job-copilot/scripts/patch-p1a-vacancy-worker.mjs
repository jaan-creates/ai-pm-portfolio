import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target)throw new Error('TrackerWorkflow source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;
const anchor='function verifyReleaseIdentity()';

// Health-tick vacancy verification must never spend money. Paid fallback is reserved for
// explicitly budget-gated call sites once P1-B runtime enforcement is wired.
s=s.replace(/if\(q&&cfg\.tavilyKey\)/g,'if(ctx.allowPaid!==false&&q&&cfg.tavilyKey)');
s=s.replace(/if\(q&&cfg\.serpApiKey\)/g,'if(ctx.allowPaid!==false&&q&&cfg.serpApiKey)');

// Re-resolve the insertion anchor after any source-length mutation above. Using an index
// captured before those replacements can splice the worker into the middle of live code.
const i=s.indexOf(anchor);if(i<0)throw new Error('release identity anchor missing');

const defs=[
['function p1aHeaderMap_(',`function p1aHeaderMap_(headers){const m={};(headers||[]).forEach((h,i)=>m[String(h||'').trim()]=i);return m;}`],
['function p1aVacancyTerminalStatus_(',`function p1aVacancyTerminalStatus_(status){return/^(closed|submitted|rejected|offer|withdrawn)$/i.test(String(status||'').trim());}`],
['function p1aVacancyCandidate_(',`function p1aVacancyCandidate_(row,h,nowMs){const decision=String(row[h['Decision']]||'').trim(),status=String(row[h['Status']]||'').trim(),url=String(row[h['Canonical Apply URL']]||row[h['Job URL']]||'').trim();if(decision!=='Apply'||!url||p1aVacancyTerminalStatus_(status))return false;const last=row[h['Last Vacancy Verified At']],submission=String(row[h['Submission Ready?']]||'').trim().toLowerCase()==='yes',stage=submission?'SUBMIT':'TAILOR';return vacancyRevalidationRequired_(last,stage,nowMs);}`],
['function p1aVacancyFromRetrieval_(',`function p1aVacancyFromRetrieval_(r){r=r||{};if(r.explicitClosed||Number(r.httpStatus)===404||Number(r.httpStatus)===410)return'CLOSED';if(r.ok&&r.content){try{const p=deterministicJobParse_(r.url||'',String(r.content||''));if(p&&(p.title||p.description||p.jobTitle))return'OPEN';}catch(e){}}return'UNKNOWN';}`],
['function p1aWriteVacancyEvidence_(',`function p1aWriteVacancyEvidence_(sheet,rowNum,h,r,state){const content=String((r&&r.content)||''),prov=retrievalProvenance_(String((r&&r.provider)||'UNAVAILABLE'),String((r&&r.url)||''),content,new Date(),Number((r&&r.confidence)||0));const vals=[[new Date(),state,String(prov.provider||''),String(prov.content_hash||''),String(prov.url||''),Number(prov.confidence||0)]];sheet.getRange(rowNum,h['Last Vacancy Verified At']+1,1,6).setValues(vals);return{row:rowNum,state:state,provider:prov.provider,url:prov.url,hash:prov.content_hash};}`],
['function p1aVacancyMaintenanceTick_(',`function p1aVacancyMaintenanceTick_(){const ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss&&ss.getSheetByName('Applications');if(!sheet)return{status:'NO_APPLICATIONS_SHEET'};const lastRow=sheet.getLastRow(),lastCol=sheet.getLastColumn();if(lastRow<2)return{status:'NO_ROWS'};const values=sheet.getRange(1,1,Math.min(lastRow,250),lastCol).getValues(),headers=values[0],h=p1aHeaderMap_(headers),required=['Decision','Status','Job URL','Canonical Apply URL','Submission Ready?','Last Vacancy Verified At','Vacancy Status','Vacancy Verification Source','Vacancy Evidence Hash','Vacancy Verification URL','Vacancy Verification Confidence'];for(const k of required)if(h[k]===undefined)return{status:'SCHEMA_MISSING',field:k};const now=Date.now();for(let i=1;i<values.length;i++){const row=values[i];if(!p1aVacancyCandidate_(row,h,now))continue;const url=String(row[h['Canonical Apply URL']]||row[h['Job URL']]||'').trim(),r=retrievalGatewayFetch_({officialUrl:url,query:url,allowPaid:false}),state=p1aVacancyFromRetrieval_(r),out=p1aWriteVacancyEvidence_(sheet,i+1,h,r,state);upsertWorkerState_('p1a_vacancy_last_result','PASS',JSON.stringify(out));return Object.assign({status:'VERIFIED'},out);}upsertWorkerState_('p1a_vacancy_last_result','NO_STALE_ACTIVE_ROWS','bounded scan complete');return{status:'NO_STALE_ACTIVE_ROWS'};}`],
['function p1aVacancyWorkerSelfTest_(',`function p1aVacancyWorkerSelfTest_(){const h=p1aHeaderMap_(['Decision','Status','Job URL','Canonical Apply URL','Submission Ready?','Last Vacancy Verified At']);const old=new Date(Date.now()-80*3600000),c=[];c.push(p1aVacancyTerminalStatus_('Closed')===true);c.push(p1aVacancyTerminalStatus_('Tailoring')===false);c.push(p1aVacancyCandidate_(['Apply','Tailoring','https://example.com','','No',old],h,Date.now())===true);c.push(p1aVacancyFromRetrieval_({explicitClosed:true,httpStatus:404})==='CLOSED');c.push(p1aVacancyFromRetrieval_({ok:false})==='UNKNOWN');if(c.some(x=>!x))throw new Error('P1-A vacancy worker self-test failed '+JSON.stringify(c));return{pass:true,total:c.length,contract:'P1-A-VACANCY-1'};}`],
['function runP1AVacancyWorkerSelfTest()',`function runP1AVacancyWorkerSelfTest(){const x=p1aVacancyWorkerSelfTest_();upsertWorkerState_('p1a_vacancy_self_test',x.pass?'PASS':'FAIL',JSON.stringify(x));upsertWorkerState_('p1a_vacancy_contract_version','P1-A-VACANCY-1','Bounded direct-official vacancy verification');return x;}`]
];
let block='// P1-A bounded vacancy verification worker\n';for(const [token,code] of defs)if(!s.includes(token))block+=code+'\n';if(block.trim()!=='// P1-A bounded vacancy verification worker')s=s.slice(0,i)+block+'\n'+s.slice(i);
const healthNeedle="try{runP1CContractSelfTest();}catch(e){upsertWorkerState_('p1c_self_test','FAIL',String((e&&e.stack)||e).slice(0,1500));}";
if(s.includes(healthNeedle)&&!s.includes('try{runP1AVacancyWorkerSelfTest();}'))s=s.replace(healthNeedle,healthNeedle+"try{runP1AVacancyWorkerSelfTest();}catch(e){upsertWorkerState_('p1a_vacancy_self_test','FAIL',String((e&&e.stack)||e).slice(0,1500));}try{p1aVacancyMaintenanceTick_();}catch(e){upsertWorkerState_('p1a_vacancy_last_result','FAIL',String((e&&e.stack)||e).slice(0,1500));}");
for(const token of defs.map(x=>x[0]).concat(['allowPaid!==false','p1a_vacancy_self_test','p1a_vacancy_last_result']))if(!s.includes(token))throw new Error('P1-A vacancy wiring missing '+token);
if(s!==before)fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,workstream:'P1-A-vacancy-worker',boundedRows:250,maxExternalCallsPerTick:1,paidFallbackAllowed:false},null,2));
