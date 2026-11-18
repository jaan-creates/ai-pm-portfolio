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
function candidateSourceGuard_(resume,approvedBase,registry){
  const source=candidateClaimNorm_(approvedBase),entries=candidateApprovedWording_(registry),phrases=[];
  Object.keys(entries).forEach(id=>phrases.push(...(entries[id].safe.length?entries[id].safe:entries[id].claim)));
  const fields=[['headline',resume.headline],['summary',resume.summary],['career_break',resume.career_break],['education',resume.education]];
  (resume.core_skills||[]).forEach((v,i)=>fields.push(['core_skills_'+i,v]));
  (resume.remaining_gaps||[]).forEach((v,i)=>fields.push(['remaining_gaps_'+i,v]));
  (resume.experiences||[]).forEach((e,i)=>{fields.push(['experience_title_'+i,e.title_line]);fields.push(['experience_dates_'+i,e.date_line]);});
  for(const [field,value] of fields){
    const text=candidateClaimNorm_(value);
    if(!text)continue;
    if(!source || !(source.includes(text)||phrases.some(p=>p.includes(text))))throw new Error('DETERMINISTIC:CANDIDATE_PROSE_UNVERIFIED:'+field);
  }
  return {checked:fields.length};
}
