import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2];
const sources=fs.readdirSync(root).filter(name=>/\.(gs|js)$/.test(name)).map(name=>path.join(root,name)).filter(file=>fs.readFileSync(file,'utf8').includes('function verifyReleaseIdentity()'));
if(sources.length!==1)throw new Error('Expected one product runtime');
const file=sources[0],original=fs.readFileSync(file,'utf8');let s=original;
const signature=/function enqueue_\(\s*([\w$]+)\s*,\s*([\w$]+)\s*,\s*([\w$]+)\s*,\s*([\w$]+)\s*(?:,\s*[\w$]+(?:\s*=\s*\{\})?\s*)?\)\s*\{/g;
const matches=[...s.matchAll(signature)];if(matches.length!==1)throw new Error('Unrecognized queue admission signature');
const [match,app,worker,payload,input]=matches[0];
const oldGuard=`assertRetryEligible_(${app}, ${worker}, ${input});`;
const guard=`assertRetryEligible_(${app}, ${worker}, ${input}||hash_(JSON.stringify(${payload}||{})));`;
const helper=fs.readFileSync(new URL('../runtime/retry-eligibility.js',import.meta.url),'utf8');
const oldHelper=`function assertRetryEligible_(application, worker, input) {
  if (!['JD_RETRIEVE', 'RESUME_GENERATE'].includes(String(worker))) return;
  if (!input) return; // The base runtime derives an input key for legacy callers.
  const sheet = SH_(JC.S.Q);
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const fields = ['Application ID', 'Worker Type', 'Input Hash', 'Status', 'Error Detail'];
  const columns = fields.map(name => headers.indexOf(name));
  if (columns.includes(-1)) throw new Error('QUEUE_QUARANTINE_SCHEMA_INCOMPLETE');
  const [appCol, workerCol, hashCol, stateCol, detailCol] = columns;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (String(row[appCol]) !== String(application) || String(row[workerCol]) !== String(worker) ||
        String(row[hashCol]) !== String(input)) continue;
    const state = String(row[stateCol]).toLowerCase();
    if (state === 'succeeded') return;
    if (state === 'failed' && /DETERMINISTIC:(?:P1A_JD_PERSISTENCE_OR_COMPLETENESS_FAILED|RENDER_CAREBREAK_(?:CANONICAL_MISSING|EXACT3))\\b/.test(String(row[detailCol]))) {
      throw new Error('DETERMINISTIC:UNCHANGED_INPUT_QUARANTINED');
    }
  }
}`;
const helperStart=s.indexOf('function assertRetryEligible_(');
if(helperStart>=0){
  const installed=[oldHelper,oldHelper.replace(/\n/g,'\r\n')].find(x=>s.includes(x));
  if(s.includes(helper)||s.includes(helper.replace(/\n/g,'\r\n'))){/* current version */}
  else if(installed)s=s.replace(installed,helper.trimEnd());
  else throw new Error('Unknown retry helper requires reviewed migration');
}else s+='\n'+helper;
const offset=matches[0].index+match.length;
const body=s.slice(offset);
if(body.trimStart().startsWith(guard)){/* already current */}
else if(body.trimStart().startsWith(oldGuard))s=s.replace(oldGuard,guard);
else if(!body.trimStart().startsWith('assertRetryEligible_('))s=s.slice(0,offset)+'\n  '+guard+'\n'+s.slice(offset);
else throw new Error('Unknown queue guard requires reviewed migration');
if(s!==original)fs.writeFileSync(file,s);
console.log(JSON.stringify({changed:s!==original,contract:'QUEUE-RETRY-ADMISSION-2'}));
