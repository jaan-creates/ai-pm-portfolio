import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const rows=[];
for(const f of files){const s=fs.readFileSync(path.join(root,f),'utf8');const re=/function\s+([A-Za-z0-9_$]+)\s*\(/g;let m;while((m=re.exec(s)))rows.push({file:f,name:m[1],line:s.slice(0,m.index).split('\n').length});}
const relevant=rows.filter(x=>/(jd|retriev|company|contact|queue|cost|cache|ai|source|vacan|resume|health)/i.test(x.name)).slice(0,120);
const names=new Set(rows.map(x=>x.name));
const anchors=['workerJD_','parseSaveJD_','aiJson_','workerCompany_','workerContact_','processQ_','runQ_','phase1HealthTick','upsertWorkerState_'];
console.log(JSON.stringify({status:'PASS',files,functions:rows.length,anchors:Object.fromEntries(anchors.map(x=>[x,names.has(x)])),relevant},null,2));
