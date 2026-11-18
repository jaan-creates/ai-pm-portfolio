import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CANONICAL_DESCRIPTION = 'Job Copilot API — canonical account cutover';

export function canonicalDeployment(deployments) {
  if (!Array.isArray(deployments)) throw new Error('Deployment list is not an array');
  const found = deployments.filter(d => d.description === CANONICAL_DESCRIPTION);
  if (found.length !== 1) throw new Error(`Expected exactly one canonical API executable; found ${found.length}`);
  const one = found[0];
  if (typeof one.deploymentId !== 'string' || !one.deploymentId || !Number.isSafeInteger(one.versionNumber) || one.versionNumber < 1) {
    throw new Error('Canonical deployment identity or version is invalid');
  }
  return one;
}

export function createController({ invoke, read, write }) {
  const deployments = () => canonicalDeployment(invoke('list-deployments'));
  const state = file => {
    const value = read(file);
    if (!value || value.description !== CANONICAL_DESCRIPTION || !value.deploymentId || !Number.isSafeInteger(value.previousVersion)) {
      throw new Error('Canonical pin snapshot invalid');
    }
    return value;
  };
  const same = (actual, saved) => {
    if (actual.deploymentId !== saved.deploymentId || actual.description !== saved.description) throw new Error('Canonical deployment identity changed');
  };
  return {
    snapshot(file) {
      const current = deployments();
      const saved = {deploymentId:current.deploymentId,description:current.description,previousVersion:current.versionNumber};
      write(file,saved);
      return {status:'SNAPSHOTTED',previousVersion:saved.previousVersion};
    },
    promote(file, revision, run, attempt) {
      const saved = state(file), current = deployments();
      same(current,saved);
      if (current.versionNumber !== saved.previousVersion) throw new Error('Canonical pin moved since snapshot');
      if (!/^[a-f0-9]{40}$/.test(revision) || !/^[1-9][0-9]*$/.test(run) || !/^[1-9][0-9]*$/.test(attempt)) throw new Error('Release identity invalid');
      const result = invoke('create-version',`Janu ${revision} run ${run} attempt ${attempt}`);
      if (!Number.isSafeInteger(result?.versionNumber) || result.versionNumber <= saved.previousVersion) throw new Error('New immutable version invalid');
      saved.newVersion = result.versionNumber;
      write(file,saved); // Persist before attempting a network mutation whose response may be lost.
      invoke('update-deployment',saved.deploymentId,'--versionNumber',String(saved.newVersion),'--description',saved.description);
      const after = deployments();
      same(after,saved);
      if (after.versionNumber !== saved.newVersion) throw new Error('Canonical pin promotion readback mismatch');
      saved.promoted = true;
      write(file,saved);
      return {status:'PROMOTED',previousVersion:saved.previousVersion,newVersion:saved.newVersion};
    },
    verify(file) {
      const saved = state(file), current = deployments();
      same(current,saved);
      if (!Number.isSafeInteger(saved.newVersion) || current.versionNumber !== saved.newVersion) throw new Error('Canonical pin readback mismatch');
      return {status:'VERIFIED',version:current.versionNumber};
    },
    rollback(file) {
      const saved = state(file), current = deployments();
      same(current,saved);
      if (current.versionNumber === saved.previousVersion) return {status:'ALREADY_PREVIOUS',version:saved.previousVersion};
      if (!Number.isSafeInteger(saved.newVersion) || current.versionNumber !== saved.newVersion) throw new Error('Unexpected external pin change; manual recovery required');
      invoke('update-deployment',saved.deploymentId,'--versionNumber',String(saved.previousVersion),'--description',saved.description);
      const after = deployments();
      same(after,saved);
      if (after.versionNumber !== saved.previousVersion) throw new Error('Canonical pin rollback readback mismatch');
      return {status:'ROLLED_BACK',version:after.versionNumber};
    },
  };
}

function clasp(...args) {
  const cli=process.env.JANU_CLASP_CLI;
  if (cli && !path.isAbsolute(cli)) throw new Error('JANU_CLASP_CLI must be an absolute local path');
  const result = spawnSync(cli ? process.execPath : 'clasp',cli ? [cli,'--json',...args] : ['--json',...args],{encoding:'utf8',timeout:120000,maxBuffer:1024*1024});
  if (result.error || result.status !== 0) throw new Error(`clasp ${args[0]} failed`);
  try { return JSON.parse(result.stdout); } catch { throw new Error(`clasp ${args[0]} returned invalid JSON`); }
}

if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
  const [command,file,...rest] = process.argv.slice(2);
  if (!['snapshot','promote','verify','rollback'].includes(command) || !file) throw new Error('Usage: manage-canonical-pin.mjs snapshot|promote|verify|rollback state.json [sha run attempt]');
  const controller=createController({
    invoke:clasp,
    read:p=>JSON.parse(fs.readFileSync(p,'utf8')),
    write:(p,v)=>fs.writeFileSync(p,JSON.stringify(v),{encoding:'utf8',mode:0o600}),
  });
  console.log(JSON.stringify(controller[command](file,...rest)));
}
