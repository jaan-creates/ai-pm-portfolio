function p06Artifact_(appId,version,type){
  const sheet=SH_(P12.SHEETS.ART),m=hm_(sheet),rows=sheet.getDataRange().getDisplayValues();
  for(let i=rows.length-1;i>=1;i--){
    const row=rows[i];
    if(String(row[m['Application ID']-1])===String(appId)&&String(row[m['Resume Version ID']-1])===String(version)&&String(row[m['Artifact Type']-1])===type&&String(row[m['Status']-1])==='Ready')return obj_(sheet,i+1);
  }
  return null;
}
function p06RecordQaPass_(appId,version,docId,text){
  const before=hash_(text),after=hash_(DocumentApp.openById(docId).getBody().getText());
  if(before!==after)throw new Error('DETERMINISTIC:P06_DOCUMENT_CHANGED_DURING_QA');
  append_(P12.SHEETS.ART,{'Application ID':appId,'Resume Version ID':version,'Artifact Type':'QaPassed','Drive File ID':docId,'Content Hash':before,'Created At':now_(),'Status':'Ready','Notes':'PDF blob QA passed; no submission PDF published'});
  const receipt=p06Artifact_(appId,version,'QaPassed');
  if(!receipt||receipt['Content Hash']!==before)throw new Error('DETERMINISTIC:P06_QA_RECEIPT_READBACK');
  return receipt;
}
function p06ApprovalActor_(event){
  const user=event&&event.user,actor=user&&typeof user.getEmail==='function'?String(user.getEmail()||'').trim():'';
  if(!actor)throw new Error('DETERMINISTIC:P06_APPROVER_IDENTITY_MISSING');
  return actor;
}
function p06ReadyApproval_(appId,version,reg){
  if(!version||!reg||!reg['PDF Resume Link'])return false;
  const qa=p06Artifact_(appId,version,'QaPassed'),approval=p06Artifact_(appId,version,'ApprovalReceipt'),official=p06Artifact_(appId,version,'OfficialPDF');
  if(!qa||!approval||!official||!approval['Input Hash']||!approval['Notes'])return false;
  if(qa['Content Hash']!==approval['Content Hash']||qa['Content Hash']!==official['Input Hash']||String(official['URL'])!==String(reg['PDF Resume Link']))return false;
  const app=obj_(SH_(JC.S.A),find_(JC.S.A,appId)),docId=fileId_(app['Tailored Resume Link']);
  return !!docId&&hash_(DocumentApp.openById(docId).getBody().getText())===approval['Content Hash'];
}
function p06PublishApprovedPdf_(appId,event){
  const appRow=find_(JC.S.A,appId);if(!appRow)throw new Error('DETERMINISTIC:P06_APPLICATION_MISSING');
  const app=obj_(SH_(JC.S.A),appRow),version=String(app['Resume Version ID']||''),rr=activeResumeRegistryRow_(appId,version);
  if(!version||!rr||app['Decision']!=='Apply'||!['Resume Review','Ready to Submit','Worker Error'].includes(app['Status'])||app['ATS QA Status']!=='Passed'||app['Resume Review Decision']!=='Approved')throw new Error('DETERMINISTIC:P06_APPROVAL_STATE_INVALID');
  const reg=obj_(SH_(JC.S.RR),rr),qa=p06Artifact_(appId,version,'QaPassed'),actor=p06ApprovalActor_(event),docId=fileId_(app['Tailored Resume Link']);
  if(!qa||reg['QA Status']!=='Passed'||![P12.RR_REVIEW_PENDING,'Approved'].includes(reg['Review Decision'])||!docId)throw new Error('DETERMINISTIC:P06_QA_OR_VERSION_MISSING');
  const contentHash=hash_(DocumentApp.openById(docId).getBody().getText());
  if(contentHash!==qa['Content Hash']||String(qa['Drive File ID'])!==docId)throw new Error('DETERMINISTIC:P06_APPROVED_CONTENT_CHANGED');
  if(reg['Review Decision']==='Approved'){
    const prior=p06Artifact_(appId,version,'ApprovalReceipt');
    if(!prior||prior['Input Hash']!==actor||!p06ReadyApproval_(appId,version,reg))throw new Error('DETERMINISTIC:P06_EXISTING_PUBLICATION_CONFLICT');
    return {version:version,pdfUrl:reg['PDF Resume Link'],contentHash:contentHash,approvalActor:actor,reused:true};
  }
  let approval=p06Artifact_(appId,version,'ApprovalReceipt');
  if(approval&&(approval['Content Hash']!==contentHash||approval['Input Hash']!==actor))throw new Error('DETERMINISTIC:P06_APPROVAL_CONFLICT');
  if(!approval){
    append_(P12.SHEETS.ART,{'Application ID':appId,'Resume Version ID':version,'Artifact Type':'ApprovalReceipt','Drive File ID':docId,'Content Hash':contentHash,'Input Hash':actor,'Created At':now_(),'Status':'Ready','Notes':'Candidate approved exact version and content at '+iso_()});
    approval=p06Artifact_(appId,version,'ApprovalReceipt');
    if(!approval||approval['Content Hash']!==contentHash||approval['Input Hash']!==actor||!approval['Notes'])throw new Error('DETERMINISTIC:P06_APPROVAL_READBACK');
  }
  let official=p06Artifact_(appId,version,'OfficialPDF');
  if(official&&official['Input Hash']!==contentHash)throw new Error('DETERMINISTIC:P06_OFFICIAL_VERSION_CONFLICT');
  if(!official){
    const folder=DriveApp.getFolderById(JC.IDS.ASSET),pdf=folder.createFile(DriveApp.getFileById(docId).getAs(MimeType.PDF).setName('Janu_Balachandran_'+version+'.pdf'));
    try{
      if(hash_(DocumentApp.openById(docId).getBody().getText())!==contentHash)throw new Error('DETERMINISTIC:P06_DOCUMENT_CHANGED_DURING_PUBLICATION');
      const pdfHash=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,pdf.getBlob().getBytes()).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
      append_(P12.SHEETS.ART,{'Application ID':appId,'Resume Version ID':version,'Artifact Type':'OfficialPDF','Drive File ID':pdf.getId(),'URL':pdf.getUrl(),'Content Hash':pdfHash,'Input Hash':contentHash,'Created At':now_(),'Status':'Ready','Notes':'Published only after approval receipt'});
      official=p06Artifact_(appId,version,'OfficialPDF');
      if(!official||official['Drive File ID']!==pdf.getId()||official['Content Hash']!==pdfHash)throw new Error('DETERMINISTIC:P06_PDF_READBACK');
    }catch(e){pdf.setTrashed(true);throw e;}
  }
  const reviewRow=find_(JC.S.RV,appId,'Application ID');if(reviewRow)set_(JC.S.RV,reviewRow,{'PDF / Submission Resume':official['URL'],'Review Decision':'Approved'});
  updatePackRepresentation_(app['Application Pack Link'],appId,reg['JD Fit Score'],reg['Base Representation Score'],reg['Tailored Representation Score'],app['Tailored Resume Link'],official['URL']);
  set_(JC.S.RR,rr,{'PDF Resume Link':official['URL'],'Review Decision':'Approved'});
  const reread=obj_(SH_(JC.S.RR),rr);
  if(!p06ReadyApproval_(appId,version,reread))throw new Error('DETERMINISTIC:P06_READY_READBACK');
  return {version:version,pdfUrl:official['URL'],contentHash:contentHash,approvalActor:actor};
}
