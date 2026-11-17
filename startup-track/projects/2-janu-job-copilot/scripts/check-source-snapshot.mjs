import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export function sourceSnapshot(directory) {
  const names=fs.readdirSync(directory,{recursive:true}).filter(name=>/\.(gs|js|html)$/i.test(name) || name==='appsscript.json').sort();
  if (!names.includes('appsscript.json') || !names.some(name=>/\.(gs|js)$/i.test(name))) throw new Error('Incomplete Apps Script snapshot');
  return names.map(name=>[name,createHash('sha256').update(fs.readFileSync(path.join(directory,name))).digest('hex')]);
}
export function checkSnapshot(expected,actual) {
  if (JSON.stringify(sourceSnapshot(expected))!==JSON.stringify(sourceSnapshot(actual))) throw new Error('Independent source snapshot mismatch');
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  if (process.argv[2]==='--backup') {
    const [, , , source, backup]=process.argv;
    for (const [name] of sourceSnapshot(source)) {
      const target=path.join(backup,name);
      fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.copyFileSync(path.join(source,name),target,fs.constants.COPYFILE_EXCL);
    }
    checkSnapshot(source,backup);
  } else {
    checkSnapshot(process.argv[2],process.argv[3]);
  }
  console.log('Independent readback matches all script, HTML and manifest files');
}
