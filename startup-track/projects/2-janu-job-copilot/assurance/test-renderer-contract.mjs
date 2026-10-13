import assert from 'node:assert/strict';

const rendererResult = (s) => ({
  valid: Boolean(
    s.rendererVersion &&
    s.inputContentHash &&
    s.outputPdfHash &&
    s.qaPassed === true &&
    s.careerBreakIntegrity === 'PASS' &&
    s.pageCount > 0
  )
});

const good = {
  rendererVersion:'renderer-v1', inputContentHash:'sha256:content-v1',
  outputPdfHash:'sha256:pdf-v1', qaPassed:true, careerBreakIntegrity:'PASS', pageCount:2
};
assert.equal(rendererResult(good).valid, true);
assert.equal(rendererResult({...good, careerBreakIntegrity:'FAIL'}).valid, false);
assert.equal(rendererResult({...good, outputPdfHash:''}).valid, false);
assert.equal(rendererResult({...good, pageCount:0}).valid, false);
assert.equal(rendererResult({...good, qaPassed:false}).valid, false);
console.log(JSON.stringify({
  status:'PASS',
  contract:'JANU-RENDERER-INTEGRITY-1',
  checks:5,
  negative_controls_detected:4,
  evidence_boundary:'synthetic renderer/QA contract; no live Career Break canary'
}));