import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2];if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8'),marker='P04-QUEUE-FAIR-AGING-001';let s=original;
if(!s.includes(marker)){
  if(!s.includes('P04-WORKER-OUTCOME-UNKNOWN-001'))throw new Error('Worker uncertainty patch required first');
  const lines=s.match(/^function nextQ_\(onlyApp\)\{[^\r\n]*\}$/gm);
  if(!lines||lines.length!==1||!lines[0].includes('QUEUE-NOJOB-QUARANTINE-001')||!lines[0].includes('qPriority_('))throw new Error('Queue selection anchor not recognized');
  const replacement=`/* ${marker}: age eligible work so a stream of newer high-priority jobs cannot indefinitely starve another application. */
function p04FairQueueScore_(priority,createdAt,nowMs){const born=createdAt instanceof Date?createdAt.getTime():new Date(createdAt).getTime();const waited=Number.isFinite(born)?Math.max(0,nowMs-born):0;return Number(priority||0)+Math.min(1000,Math.floor(waited/60000)*20);}
function nextQ_(onlyApp){const s=SH_(JC.S.Q);if(s.getLastRow()<2)return null;const v=s.getRange(2,1,s.getLastRow()-1,16).getValues(),t=now_().getTime();let best=null,bp=-1,birth=Infinity;for(let i=0;i<v.length;i++){const app=String(v[i][1]||''),nx=v[i][8]instanceof Date?v[i][8].getTime():0;if(onlyApp&&app!==onlyApp)continue;if(v[i][3]!=='queued'||(nx&&nx>t))continue;/* QUEUE-NOJOB-QUARANTINE-001 cheap local eligibility before sheet-backed quarantine */let qp={};try{qp=v[i][13]?JSON.parse(String(v[i][13])):{}}catch(e){qp={};}if(rendererQuarantineBlocks_(app,String(v[i][2]||''),qp))continue;const ts=v[i][14]instanceof Date?v[i][14].getTime():new Date(v[i][14]).getTime(),created=Number.isFinite(ts)?ts:Infinity,p=p04FairQueueScore_(qPriority_(app,String(v[i][2]||'')),v[i][14],t);if(p>bp||(p===bp&&created<birth)){bp=p;birth=created;best=i+2;}}return best;}`;
  s=s.replace(lines[0],replacement);
}
if(s!==original)fs.writeFileSync(file,s);
console.log(JSON.stringify({changed:s!==original,contract:marker}));
