import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {sha256,verifySubmissionAsset} from './submission-asset.mjs';

// Tiny synthetic PDF with a real cross-reference table. Poppler independently parses its bytes.
function pdf(lines) {
  const text='BT /F1 12 Tf 50 750 Td 16 TL '+lines.map((s,i)=>(i?"T* ":"")+'('+s+') Tj').join('\n')+' ET';
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Length '+text.length+' >>\nstream\n'+text+'\nendstream'];
  let out='%PDF-1.4\n';const starts=[0];for(const [i,obj] of objects.entries()){starts.push(out.length);out+=(i+1)+' 0 obj\n'+obj+'\nendobj\n';}
  const offset=out.length;out+='xref\n0 6\n0000000000 65535 f \n'+starts.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');
  return Buffer.from(out+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+offset+'\n%%EOF\n','ascii');
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-asset-'));
const asOf='2026-11-16T13:00:00Z';
function fixture(renderedLines) {
  const sections=[{heading:'Career Break',lines:['Planned personal break','Built a morning brief','Built a job copilot']}];
  const bytes=pdf(renderedLines??[sections[0].heading,...sections[0].lines]);
  const pathname=path.join(dir,sha256(bytes)+'.pdf');fs.writeFileSync(pathname,bytes);
  const ids={applicationId:'synthetic',version:'v1'},contentHash=sha256(JSON.stringify(sections)),pdfHash=sha256(bytes);
  const record={app:{id:ids.applicationId,version:ids.version,decision:'Apply',status:'Prepared',review:'Approved'},
    vacancy:{applicationId:ids.applicationId,status:'OPEN',verifiedAt:'2026-11-15T13:00:00Z',validUntil:'2026-11-20T13:00:00Z'},
    approval:{...ids,decision:'Approved',actor:'fixture-reviewer',contentHash,at:'2026-11-15T14:00:00Z'},
    registry:{...ids,assetId:'asset1',review:'Approved',pdfHash},sections,
    asset:{...ids,id:'asset1',pdfHash,contentHash,qa:'Passed',templateVersion:'t1',rendererVersion:'r1',renderedAt:'2026-11-15T15:00:00Z'}};
  return {record,pathname,run:()=>verifySubmissionAsset(record,pathname,asOf)};
}
test('verified frozen PDF matches all approved sections in order',()=>assert.equal(fixture().run().ready,true));
for(const [name,mutate] of [
  ['closed Skip with ready flag',r=>Object.assign(r.app,{decision:'Skip',status:'Closed',ready:'Yes'})],
  ['stale open vacancy',r=>r.vacancy.validUntil=r.vacancy.verifiedAt],
  ['pending projection despite registry approval',r=>r.app.review='Pending Review'],
  ['wrong approved version',r=>r.approval.version='old'],
  ['unapproved semantic change',r=>r.sections[0].lines[0]='Changed'],
  ['approval after render',r=>r.approval.at=asOf],
  ['file substitution',r=>r.registry.pdfHash=r.asset.pdfHash='a'.repeat(64)],
  ['missing QA',r=>r.asset.qa='Pending']
])test(name,()=>{const h=fixture();mutate(h.record);assert.throws(h.run);});
for(const lines of [
 ['Career Break','Planned personal break','Built a job copilot'],
 ['Career Break','Planned personal break','Built a morning brief','Built a morning brief','Built a job copilot'],
 ['Career Break','Built a job copilot','Built a morning brief','Planned personal break']
])test('reject changed text order or cardinality '+lines.join('/'),()=>assert.throws(fixture(lines).run,/Rendered text/));
