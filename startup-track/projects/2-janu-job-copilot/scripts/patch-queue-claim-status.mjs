import fs from 'node:fs';import path from 'node:path';
const root=process.argv[2];if(!root)throw new Error('Source directory required');
const files=fs.readdirSync(root).filter(n=>/\.(js|gs)$/.test(n)).map(n=>path.join(root,n)).filter(f=>fs.readFileSync(f,'utf8').includes('function verifyReleaseIdentity()'));
if(files.length!==1)throw new Error('Expected one product runtime');
const file=files[0],original=fs.readFileSync(file,'utf8');let source=original;
const marker="if(String(SH_(JC.S.Q).getRange(r,4).getDisplayValue())!=='queued')return 0;/* P04-QUEUE-TERMINAL-REPLAY-001 */";
if(!source.includes(marker)){
  const anchor=/function runQ_\(r\)\{\r?\n  if\(circuitOpen_/;
  if(!anchor.test(source))throw new Error('Unknown queue runner claim boundary');
  source=source.replace(anchor,'function runQ_(r){\n  '+marker+'\n  if(circuitOpen_');
}
if(source!==original)fs.writeFileSync(file,source);
console.log(JSON.stringify({changed:source!==original,contract:'P04-QUEUE-TERMINAL-REPLAY-001'}));
