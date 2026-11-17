import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createJdWorker} from './jd-worker-fixture.mjs';
import {createCareerBreakRenderer} from './career-break-renderer-fixture.mjs';
import {fixturePdf} from './fixture-pdf.mjs';
import {requireApprovedContent,sha256,verifySubmissionAsset} from './submission-asset.mjs';

const renderLines=createCareerBreakRenderer();
const asOf='2026-11-17T10:30:00Z', renderedAt='2026-11-17T10:00:00Z';
function journey({persists=true,approved=true,damage=false}={}) {
  const applicationId='SYNTHETIC-001',version='content-v1';
  const jd=createJdWorker({applicationId,persists});
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'janu-journey-'));
  const pathname=path.join(directory,'asset.pdf');
  function run(){
    const receipt=jd.invoke();
    assert.equal(receipt.status,'RECOVERED');
    assert.deepEqual(jd.fixture.jobs,[[applicationId,'JD_PARSE_SCORE_MAP']]);
    // Scoring, tailoring and human judgment are supplied as controlled external inputs.
    const canonical=['Planned break','Morning Brief','Job Copilot'];
    const sections=[{heading:'Career Break',lines:canonical}];
    const ids={applicationId,version};
    const record={sections,app:{id:applicationId,version,decision:'Apply',review:'Approved',status:'Prepared'},
      vacancy:{applicationId,status:'OPEN',verifiedAt:'2026-11-17T07:00:00Z',validUntil:'2026-11-18T07:00:00Z'},
      approval:{...ids,actor:'fixture-approver',at:'2026-11-17T09:00:00Z',decision:approved?'Approved':'Pending Review',contentHash:sha256(JSON.stringify(sections))},
      registry:{...ids,review:'Approved'}};
    const contentHash=requireApprovedContent(record,renderedAt);
    const rendered=renderLines([...canonical,'Morning Brief','Job Copilot']);
    const bytes=fixturePdf(['Career Break',...rendered]);
    const pdfHash=sha256(bytes);
    fs.writeFileSync(pathname,damage?Buffer.concat([bytes,Buffer.from('changed')]):bytes);
    record.asset={...ids,id:'fixture-asset',contentHash,pdfHash,qa:'Passed',qaVersion:'fixture-qa',
      templateId:'fixture-template',templateVersion:'1',rendererVersion:'FL099-fixture',renderedAt};
    Object.assign(record.registry,{assetId:record.asset.id,currentAssetIds:[record.asset.id],pdfHash});
    return verifySubmissionAsset(record,pathname,asOf);
  }
  return {run,pathname};
}
test('one synthetic vacancy reaches independently verified PDF bytes',()=>assert.equal(journey().run().ready,true));
test('partial JD persistence cannot generate a PDF',()=>{const j=journey({persists:false});assert.throws(j.run,/PERSISTENCE/);assert.equal(fs.existsSync(j.pathname),false);});
test('pending approval cannot generate a PDF',()=>{const j=journey({approved:false});assert.throws(j.run,/Approval/);assert.equal(fs.existsSync(j.pathname),false);});
test('changed file cannot reach ready',()=>assert.throws(journey({damage:true}).run,/PDF bytes changed/));
