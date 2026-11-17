import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2];
const sources=fs.readdirSync(root).filter(name=>/\.(gs|js)$/.test(name))
  .map(name=>path.join(root,name))
  .filter(file=>fs.readFileSync(file,'utf8').includes('function verifyReleaseIdentity()'));
if (sources.length !== 1) throw new Error('Expected one product runtime');
const file=sources[0];
const source=fs.readFileSync(file,'utf8');
const signature=/function enqueue_\(\s*([\w$]+)\s*,\s*([\w$]+)\s*,\s*[\w$]+\s*,\s*([\w$]+)\s*(?:,\s*[\w$]+(?:\s*=\s*\{\})?\s*)?\)\s*\{/g;
const matches=[...source.matchAll(signature)];
if (matches.length!==1) throw new Error('Unrecognized queue admission signature');
const [match,app,worker,input]=matches[0];
const guard='assertRetryEligible_('+app+', '+worker+', '+input+');';
const offset=matches[0].index+match.length;
if (source.slice(offset).trimStart().startsWith(guard) && source.includes('function assertRetryEligible_(')) {
  console.log('Queue quarantine already installed');
} else {
  if (source.includes('function assertRetryEligible_(')) throw new Error('Partial queue quarantine installation');
  const helper=fs.readFileSync(new URL('../runtime/retry-eligibility.js',import.meta.url),'utf8');
  const updated=source.slice(0,offset)+'\n  '+guard+'\n'+source.slice(offset);
  fs.writeFileSync(file,updated+'\n'+helper);
}
