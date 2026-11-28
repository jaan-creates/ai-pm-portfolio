import fs from 'node:fs';import path from 'node:path';
const root=process.argv[2];if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8');let source=original;
const helper=fs.readFileSync(new URL('../runtime/approval-before-pdf.js',import.meta.url),'utf8').trim();
function replaceOnce(oldText,newText){if(source.includes(newText))return;if(source.split(oldText).length-1!==1)throw new Error('P06 source boundary not recognized: '+oldText.slice(0,100));source=source.replace(oldText,newText);}
replaceOnce("const pdf=f.createFile(copy.getAs(MimeType.PDF).setName('Janu_Balachandran_'+v+'.pdf'));",'/* P06: no PDF file before candidate approval. QA uses a transient PDF blob. */');
replaceOnce('pdfId:pdf.getId(),pdfUrl:pdf.getUrl()','pdfId:\'\',pdfUrl:\'\'');
replaceOnce("'PDF Resume Link':assets.pdfUrl","'PDF Resume Link':''");
replaceOnce("b.appendParagraph('Submission PDF: '+as.pdfUrl);","b.appendParagraph('Submission PDF: Pending candidate approval');");
replaceOnce("'Use the PDF linked above'","'After approval, use the PDF linked above'");
replaceOnce("const reg=obj_(SH_(JC.S.RR),rr);if(!reg['PDF Resume Link'])throw new Error('DETERMINISTIC:PDF missing');const docId=", "const reg=obj_(SH_(JC.S.RR),rr);if(reg['PDF Resume Link'])throw new Error('DETERMINISTIC:P06_PREAPPROVAL_PDF_LINK');const docId=");
replaceOnce("const pdf=DriveApp.getFileById(fileId_(reg['PDF Resume Link'])),fid=uploadAI_(pdf)","const pdf={getBlob:()=>DriveApp.getFileById(docId).getAs(MimeType.PDF),getName:()=> 'QA-preview-'+a['Resume Version ID']+'.pdf'},fid=uploadAI_(pdf)");
replaceOnce("  set_(JC.S.RR,rr,{'QA Status':'Passed','Review Decision':P12.RR_REVIEW_PENDING});", "  p06RecordQaPass_(appId,a['Resume Version ID'],docId,txt);set_(JC.S.RR,rr,{'QA Status':'Passed','Review Decision':P12.RR_REVIEW_PENDING});");
replaceOnce("    qa:a['ATS QA Status']==='Passed'&&reg&&reg['QA Status']==='Passed',review:a['Resume Review Decision']==='Approved',", "    qa:a['ATS QA Status']==='Passed'&&reg&&reg['QA Status']==='Passed',review:a['Resume Review Decision']==='Approved',approval:p06ReadyApproval_(appId,a['Resume Version ID'],reg),");
replaceOnce("if(v==='Approved'){const g=readyGate_(id);", "if(v==='Approved'){p06PublishApprovedPdf_(id,e);const g=readyGate_(id);");
const migrationStart=source.indexOf('function workerArtifactMigrate_('),migrationEnd=source.indexOf('function artifactHygieneAudit_(',migrationStart);
if(migrationStart<0||migrationEnd<0)throw new Error('P06 migration boundary missing');
if(!source.slice(migrationStart,migrationEnd).includes('P06_PREVIEW_MIGRATION')){
  source=source.slice(0,migrationStart)+"function workerArtifactMigrate_(appId,p){/* P06_PREVIEW_MIGRATION */const r=find_(JC.S.A,appId);if(!r)throw new Error('DETERMINISTIC:Application missing '+appId);const a=obj_(SH_(JC.S.A),r),did=fileId_(a['Tailored Resume Link']);if(!did)throw new Error('DETERMINISTIC:Legacy artifact missing editable resume');scrubDocInternalTags_(did);const pid=fileId_(a['Application Pack Link']||'');if(pid)updatePackRepresentation_(a['Application Pack Link'],appId,a['JD Fit Score'],a['Base Representation Score'],a['Tailored Resume Match Score'],a['Tailored Resume Link'],'Pending candidate approval');const rr=activeResumeRegistryRow_(appId,a['Resume Version ID']);if(!rr)throw new Error('DETERMINISTIC:Legacy artifact missing Resume Registry row');set_(JC.S.RR,rr,{'PDF Resume Link':'','QA Status':'Pending','Review Decision':'Not Ready'});set_(JC.S.A,r,{'Status':'QA','ATS QA Status':'Not Started','Resume Review Decision':'Not Ready','Submission Ready?':'No','Your Required Action':'No action','Next Action':'System-owned: legacy resume sanitized; PDF QA next, then candidate approval.','Last Operator Update':now_(),'State Consistency':'OK'});audit_(appId,'Resume','Artifact Migration','Legacy / dirty','Sanitized editable resume','Automation','Removed internal metadata; no official PDF before approval');return{appId:appId,doc:did};}\n"+source.slice(migrationEnd);
}
if(!source.includes('function p06Artifact_('))source+='\n'+helper+'\n';
else if(!source.includes(helper))throw new Error('Unknown existing P06 approval helper');
if(source!==original)fs.writeFileSync(file,source);
console.log(JSON.stringify({changed:source!==original,contract:'P06-APPROVAL-BEFORE-OFFICIAL-PDF-1'}));
