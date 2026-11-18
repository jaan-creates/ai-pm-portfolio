import fs from 'node:fs';import path from 'node:path';
const root=process.argv[2];if(!root)throw new Error('Source directory required');
const sources=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(sources.length!==1)throw new Error('Expected one product runtime');
const file=sources[0],original=fs.readFileSync(file,'utf8');let s=original;
const helper=fs.readFileSync(new URL('../runtime/candidate-claim-guard.js',import.meta.url),'utf8').trim();
const marker='function validateEvidence_(r,ev){',call='candidateClaimGuard_(r,ev);';
if(!s.includes(marker))throw new Error('Unknown resume evidence validator');
const start=s.indexOf(marker)+marker.length;
if(!s.slice(start).trimStart().startsWith(call)){
  if(s.slice(start).trimStart().startsWith('candidateClaimGuard_('))throw new Error('Unknown candidate claim guard');
  s=s.slice(0,start)+call+s.slice(start);
}
const oldPrompt='Every bullet must cite evidence_ids. Preserve employers';
const newPrompt='Every bullet must use the exact Safe wording of its cited canonical EV evidence ID (or its exact Claim if Safe wording is absent). Do not paraphrase or combine claims. Every bullet must cite evidence_ids. Preserve employers';
if(s.includes(oldPrompt)&&!s.includes(newPrompt))s=s.replace(oldPrompt,newPrompt);
if(!s.includes(newPrompt))throw new Error('Resume prompt contract not recognized');
const proseCall='validateEvidence_(d,ev);candidateSourceGuard_(d,base,ev);';
if(!s.includes(proseCall)){
  const occur=s.split('validateEvidence_(d,ev);').length-1;
  if(occur!==2)throw new Error('Unexpected resume validation paths '+occur);
  s=s.replaceAll('validateEvidence_(d,ev);',proseCall);
}
if(s.split(proseCall).length-1!==2)throw new Error('Resume prose guard not wired at both validation paths');
const sourceHelper=helper.slice(helper.indexOf('function candidateSourceGuard_('));
if(!s.includes('function candidateClaimGuard_('))s+='\n'+helper+'\n';
else if(!s.includes('function candidateSourceGuard_('))s+='\n'+sourceHelper+'\n';
else if(!s.includes(sourceHelper))throw new Error('Unknown existing candidate source guard');
if(s!==original)fs.writeFileSync(file,s);
console.log(JSON.stringify({changed:s!==original,contract:'CANDIDATE-CLAIM-EXACT-WORDING-1'}));
