function candidateClaimNorm_(value){return String(value||'').normalize('NFKC').replace(/[\u2018\u2019]/g,"'").replace(/[\u2013\u2014]/g,'-').replace(/^\s*[•\-*]\s*/,'').replace(/\s+/g,' ').trim().replace(/[.;]+$/,'').toLowerCase();}
function candidateApprovedWording_(registry){
  const approved={};let current='';
  for(const raw of String(registry||'').split(/\r?\n/)){
    const line=raw.trim(),id=line.match(/^(EV-[A-Z0-9-]+)$/);
    if(id){current=id[1];approved[current]={safe:[],claim:[]};continue;}
    if(!current)continue;
    const safe=line.match(/^Safe wording:\s*(.+)$/i),claim=line.match(/^Claim:\s*(.+)$/i);
    if(safe)approved[current].safe.push(candidateClaimNorm_(safe[1]));
    if(claim)approved[current].claim.push(candidateClaimNorm_(claim[1]));
  }
  return approved;
}
function candidateClaimGuard_(resume,registry){
  const approved=candidateApprovedWording_(registry),bullets=[];
  (resume.experiences||[]).forEach(e=>(e.bullets||[]).forEach(b=>bullets.push(b)));
  (resume.projects||[]).forEach(b=>bullets.push(b));
  (resume.leadership||[]).forEach(b=>bullets.push(b));
  for(const bullet of bullets){
    const ids=bullet.evidence_ids||[],text=candidateClaimNorm_(bullet.text);
    if(!text||!ids.length)throw new Error('DETERMINISTIC:CANDIDATE_CLAIM_EVIDENCE_MISSING');
    let supported=false;
    for(const id of ids){
      const entry=approved[String(id)];
      if(!entry)throw new Error('DETERMINISTIC:CANDIDATE_CLAIM_ID_UNKNOWN');
      const phrases=entry.safe.length?entry.safe:entry.claim;
      if(phrases.includes(text))supported=true;
    }
    if(!supported)throw new Error('DETERMINISTIC:CANDIDATE_CLAIM_UNSUPPORTED_BY_ID');
  }
  return {checked:bullets.length};
}
