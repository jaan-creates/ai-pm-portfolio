import fs from 'node:fs';
import path from 'node:path';

const liveDir = process.argv[2];
if (!liveDir) throw new Error('Usage: node patch-renderer-artifact-proof-bullet-prefix.mjs <live-dir>');
const file = path.join(liveDir, 'TrackerWorkflow.js');
let source = fs.readFileSync(file, 'utf8');
const oldToken = "replace(/^[•●▪-][ ]*/,'')";
const newToken = "replace(/^(?:[•●▪*]|-)[ ]*/,'')";
const marker = 'RENDER-CAREERBREAK-ARTIFACT-PROOF-BULLET-PREFIX-001';
if (source.includes(marker)) {
  console.log(JSON.stringify({pass:true,changed:false,marker}));
  process.exit(0);
}
const count = source.split(oldToken).length - 1;
if (count !== 1) throw new Error(`Expected one artifact-proof bullet sanitizer, found ${count}`);
source = source.replace(oldToken, newToken);
source = source.replace(
  'function rendererCanaryArtifactProof_(link){',
  `function rendererCanaryArtifactProof_(link){/* ${marker}: canonical plain-text exports may use asterisk list prefixes. */`
);
fs.writeFileSync(file, source);
console.log(JSON.stringify({pass:true,changed:true,marker}));
