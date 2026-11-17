import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export function createCareerBreakRenderer(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-render-'));
  const file=path.join(dir,'TrackerWorkflow.js');
  fs.writeFileSync(file,[
    'const P12={};','function verifyReleaseIdentity(){}','function phase1HealthTick(){}',
    "function rendererFreshCanaryEnqueue_(appId){if(!workNeeded_(appId,'RESUME_GENERATE'))throw new Error('DETERMINISTIC:CANARY_RESUME_WORK_NOT_NEEDED');}",
    'function rendererCareerBreakExperienceLines_(d){return [];}','function stripInternalEvidenceTags_(text){return text;}',
    "function render_(exp,fallback){const e=exp||null,bullets=e?(e.bullets||[]).map(x=>stripInternalEvidenceTags_(String(x&&x.text||'')).trim()).filter(Boolean):[],fallbackLines=e?[]:rendererCareerBreakLines_(fallback);return bullets;}"
  ].join('\n'));
  const patcher=fileURLToPath(new URL('../recovery/fl099/patch-fl099-exact3.mjs',import.meta.url));
  execFileSync(process.execPath,[patcher,dir]);const first=fs.readFileSync(file,'utf8');
  execFileSync(process.execPath,[patcher,dir]);assert.equal(fs.readFileSync(file,'utf8'),first);
  const ctx=vm.createContext({});vm.runInContext(first,ctx);
  return lines=>Array.from(ctx.render_({bullets:lines.map(text=>({text}))}));
}
