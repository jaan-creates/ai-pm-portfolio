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
function candidateReusableResume_(reuse,approvedBase,registry){
  if(!reuse)return null;
  try{
    validateEvidence_(reuse.doc,registry);
    candidateSourceGuard_(reuse.doc,approvedBase,registry);
    return reuse;
  }catch(e){
    const message=String((e&&e.message)||e);
    if(/CANDIDATE_(?:CLAIM|PROSE)|Unknown evidence ID|Bullet lacks evidence ID/.test(message))return null;
    throw e;
  }
}
function candidatePackGuard_(drafts,approvedBase,registry,jd,company,contacts){
  if(!drafts||typeof drafts!=='object')throw new Error('DETERMINISTIC:CANDIDATE_PACK_MISSING');
  const entries=candidateApprovedWording_(registry),approved=[];
  Object.keys(entries).forEach(id=>approved.push(...(entries[id].safe.length?entries[id].safe:entries[id].claim)));
  const base=candidateClaimNorm_(approvedBase),role=candidateClaimNorm_(JSON.stringify(jd||{})),context=candidateClaimNorm_(JSON.stringify(company||{})+' '+JSON.stringify(contacts||[]));
  const proof=(value,allowRole)=>{
    const text=candidateClaimNorm_(value);
    if(!text)return true;
    if(approved.includes(text)||base.includes(text)&&text.length>=12)return true;
    return !!allowRole&&text.length>=12&&(role.includes(text)||context.includes(text));
  };
  for(const key of ['why_role','why_company'])if(!proof(drafts[key],true))throw new Error('DETERMINISTIC:CANDIDATE_PACK_UNVERIFIED:'+key);
  for(const key of ['recruiter_message','hiring_manager_message'])if(!proof(drafts[key],false))throw new Error('DETERMINISTIC:CANDIDATE_PACK_UNVERIFIED:'+key);
  if(!['','yes','no','not requested','draft only'].includes(candidateClaimNorm_(drafts.cover_letter_decision)))throw new Error('DETERMINISTIC:CANDIDATE_PACK_UNVERIFIED:cover_letter_decision');
  if(!Array.isArray(drafts.submission_answers)||!Array.isArray(drafts.interview_questions))throw new Error('DETERMINISTIC:CANDIDATE_PACK_SCHEMA');
  if(drafts.submission_answers.length)throw new Error('DETERMINISTIC:CANDIDATE_PACK_FORM_NOT_CAPTURED');
  for(const question of drafts.interview_questions)if(!proof(question,true))throw new Error('DETERMINISTIC:CANDIDATE_PACK_UNVERIFIED:interview_questions');
  return {checked:true};
}
