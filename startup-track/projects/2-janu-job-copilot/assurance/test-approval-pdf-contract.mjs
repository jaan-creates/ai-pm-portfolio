import assert from 'node:assert/strict';

const canRenderOfficialPdf = (s) => Boolean(
  s.approved &&
  s.approvedContentHash &&
  s.approvalActor &&
  s.contentHash === s.approvedContentHash &&
  s.rendererVersion &&
  s.qaPassed === true &&
  s.pdfHash
);

const approved = {
  approved:true, approvedContentHash:'sha256:content-v1', approvalActor:'human-reviewer',
  contentHash:'sha256:content-v1', rendererVersion:'renderer-v1', qaPassed:true, pdfHash:'sha256:pdf-v1'
};
assert.equal(canRenderOfficialPdf(approved), true);
assert.equal(canRenderOfficialPdf({...approved, approved:false}), false);
assert.equal(canRenderOfficialPdf({...approved, contentHash:'sha256:unapproved'}), false);
assert.equal(canRenderOfficialPdf({...approved, qaPassed:false}), false);
assert.equal(canRenderOfficialPdf({...approved, pdfHash:''}), false);
console.log(JSON.stringify({
  status:'PASS',
  contract:'JANU-APPROVAL-FIRST-PDF-1',
  checks:5,
  negative_controls_detected:4,
  evidence_boundary:'synthetic approval/renderer contract; no official PDF rendered'
}));