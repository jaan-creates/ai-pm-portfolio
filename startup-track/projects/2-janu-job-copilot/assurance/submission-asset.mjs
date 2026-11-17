import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

// Read-only acceptance at the boundary between private evidence and the readiness projection.
export function requireApprovedContent(record, asOf) {
  const {app, vacancy, approval, registry, sections} = record;
  const now = Date.parse(asOf);
  if (!Number.isFinite(now) || !app?.id || app.decision !== 'Apply' || app.status === 'Closed' ||
      app.blocker || vacancy?.status !== 'OPEN' || vacancy.applicationId !== app.id ||
      !(Date.parse(vacancy.verifiedAt) <= now && now < Date.parse(vacancy.validUntil))) {
    throw new Error('Vacancy or application ineligible');
  }
  if (!Array.isArray(sections) || sections.length === 0 ||
      sections.some(s => typeof s.heading !== 'string' || !s.heading.trim() || !Array.isArray(s.lines) ||
        !s.lines.length || s.lines.some(line=>typeof line!=='string'||!line.trim()))) throw new Error('Missing approved content');
  const contentHash = sha256(JSON.stringify(sections));
  if (!approval?.actor || !app.version || app.review !== 'Approved' || approval.decision !== 'Approved' ||
      registry?.review !== 'Approved' || ![registry, approval].every(s=>s?.applicationId === app.id && s.version === app.version) ||
      approval.contentHash !== contentHash || !(Date.parse(approval.at) <= now)) throw new Error('Approval or version conflict');
  return contentHash;
}

export function verifySubmissionAsset(record, pdfPath, asOf) {
  const contentHash=requireApprovedContent(record,asOf);
  const {app,registry,asset,sections}=record;
  if (!asset || asset.applicationId!==app.id || asset.version!==app.version || asset.contentHash!==contentHash ||
      requireApprovedContent(record,asset.renderedAt)!==contentHash || !(Date.parse(asset.renderedAt)<=Date.parse(asOf)) ||
      !asset.templateId || !asset.templateVersion || !asset.rendererVersion || !asset.qaVersion || asset.qa !== 'Passed' || !asset.id ||
      !Array.isArray(registry.currentAssetIds) || registry.currentAssetIds.length !== 1 || registry.currentAssetIds[0] !== asset.id ||
      registry.assetId !== asset.id || !asset.pdfHash || registry.pdfHash !== asset.pdfHash) throw new Error('Incomplete asset provenance');
  const bytes=readFileSync(pdfPath);
  if (sha256(bytes) !== asset.pdfHash) throw new Error('PDF bytes changed');
  const extraction=spawnSync(process.env.JANU_PYTHON || 'python',[fileURLToPath(new URL('extract-pdf.py',import.meta.url))],{input:bytes,timeout:15000,maxBuffer:2500000});
  if (extraction.status!==0) throw new Error('PDF unreadable or text outside page bounds');
  const extracted=extraction.stdout.toString('utf8');
  const normalize=text=>text.normalize('NFC').replace(/\s+/gu,' ').trim();
  const expected=sections.flatMap(s=>[s.heading,...s.lines]).join(' ');
  if (normalize(extracted)!==normalize(expected)) throw new Error('Rendered text differs from approved content');
  return {ready:true,applicationId:app.id,version:app.version,assetId:asset.id,pdfHash:asset.pdfHash};
}
