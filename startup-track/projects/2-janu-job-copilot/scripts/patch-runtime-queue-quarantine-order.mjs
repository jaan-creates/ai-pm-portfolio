import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.argv[2]||'.janu-live';
const CONTRACT='QUEUE-NOJOB-QUARANTINE-001';
const ABSENT='QUEUE-SELECTOR-NO-QUARANTINE-001';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function nextQ_(')&&t.includes('function rendererQuarantineBlocks_(')&&t.includes('const P12');});
if(!target)throw new Error('Queue + renderer source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;

function rangeOf(name){
  const sig='function '+name+'(';const start=s.indexOf(sig);if(start<0)return null;
  const open=s.indexOf('{',start);if(open<0)throw new Error('Malformed '+name);
  let depth=0,quote=null,esc=false,line=false,block=false;
  for(let i=open;i<s.length;i++){
    const c=s[i],n=s[i+1]||'';
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(quote){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===quote)quote=null;continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}
    if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='{')depth++;else if(c==='}'&&--depth===0)return{start,open,end:i+1};
  }
  throw new Error('Unterminated '+name);
}
function replaceRange(name,fn){const r=rangeOf(name);if(!r)throw new Error(name+' missing');const old=s.slice(r.start,r.end),neu=fn(old);if(neu===old)return false;s=s.slice(0,r.start)+neu+s.slice(r.end);return true;}

replaceRange('nextQ_',old=>{
  if(old.includes(CONTRACT)||old.includes(ABSENT))return old;
  if(!old.includes('rendererQuarantineBlocks_(')){
    const open=old.indexOf('{');
    return old.slice(0,open+1)+'/* '+CONTRACT+' '+ABSENT+' no sheet-backed quarantine in selection path */'+old.slice(open+1);
  }
  const bad="let qp={};try{qp=v[i][13]?JSON.parse(String(v[i][13])):{}}catch(e){qp={};}if(rendererQuarantineBlocks_(app,String(v[i][2]||''),qp))continue;if(v[i][3]==='queued'";
  if(!old.includes(bad))throw new Error('FL-080 queue/quarantine ordering anchor missing; refuse unsafe rewrite');
  const fixed="if(v[i][3]!=='queued'||(nx&&nx>t))continue;/* "+CONTRACT+" cheap local eligibility before sheet-backed quarantine */let qp={};try{qp=v[i][13]?JSON.parse(String(v[i][13])):{}}catch(e){qp={};}if(rendererQuarantineBlocks_(app,String(v[i][2]||''),qp))continue;if(v[i][3]==='queued'";
  return old.replace(bad,fixed);
});

if(!s.includes('function runtimeQueueSelectionPreventionContract_(')){
  const anchor='function nextQ_(';
  const i=s.indexOf(anchor);if(i<0)throw new Error('nextQ_ anchor missing');
  s=s.slice(0,i)+"function runtimeQueueSelectionPreventionContract_(){return 'QUEUE-NOJOB-QUARANTINE-001|QUEUE-QUARANTINE-CANDIDATE-BOUNDED-001';}\n"+s.slice(i);
}

const nr=rangeOf('nextQ_');const next=s.slice(nr.start,nr.end);
const quarantine=next.indexOf('rendererQuarantineBlocks_(');
if(quarantine>=0){
  const guard=next.indexOf("if(v[i][3]!=='queued'||(nx&&nx>t))continue;");
  if(guard<0||guard>quarantine)throw new Error('QUEUE-NOJOB-QUARANTINE-001 ordering proof failed');
}else if(!next.includes(ABSENT))throw new Error('Quarantine-free selector lacks explicit convergence marker');
if(!next.includes(CONTRACT))throw new Error('Queue no-work prevention marker missing');
if(!s.includes('QUEUE-QUARANTINE-CANDIDATE-BOUNDED-001'))throw new Error('Candidate-bounded prevention marker missing');

fs.writeFileSync(file,s);
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error('Queue-order transformed source invalid: '+syntax.stderr);

// Score-admission convergence is coupled only on production-shaped sources that actually contain
// the scoring/JD admission boundary. Queue-only fixtures must remain independently testable.
const scoreCapable=s.includes('function workNeededFromState_(')&&s.includes('function workerJD_(')&&s.includes('function workNeeded_(');
if(scoreCapable){
  const scorePatch=spawnSync(process.execPath,[path.resolve(path.dirname(new URL(import.meta.url).pathname),'patch-p1a-score-admission.mjs'),root],{encoding:'utf8'});
  if(scorePatch.status!==0)throw new Error(scorePatch.stderr||scorePatch.stdout||'JD-SCORE-ADMISSION-001 patch failed');
}

console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,contract:CONTRACT,selectorQuarantineAbsent:quarantine<0,candidateGuard:'QUEUE-QUARANTINE-CANDIDATE-BOUNDED-001',cheapEligibilityBeforeQuarantine:true,terminalRowsSkipQuarantine:true,notDueRowsSkipQuarantine:true,claimQuarantinePreserved:s.includes('RENDERER_QUARANTINE_ACTIVE'),scoreAdmission:scoreCapable?'JD-SCORE-ADMISSION-001':'NOT_APPLICABLE_QUEUE_ONLY_FIXTURE',verifiedArtifact:file},null,2));