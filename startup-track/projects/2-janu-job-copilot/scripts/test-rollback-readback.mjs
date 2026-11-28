import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {checkSnapshot, fullProjectDigest} from './check-source-snapshot.mjs';
test('rollback is accepted only after a fresh pull matches the preimage',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'janu-rollback-'));
  const prior=path.join(root,'prior'),remote=path.join(root,'remote'),fresh=path.join(root,'fresh');
  fs.mkdirSync(prior);for(const [name,value] of Object.entries({'Runtime.js':'function version(){return 1;}','appsscript.json':'{}','View.html':'prior'}))fs.writeFileSync(path.join(prior,name),value);
  fs.mkdirSync(path.join(prior,'views'));fs.writeFileSync(path.join(prior,'views','panel.html'),'panel');
  fs.cpSync(prior,remote,{recursive:true});fs.writeFileSync(path.join(remote,'Runtime.js'),'changed');
  assert.throws(()=>checkSnapshot(prior,remote),/mismatch/);
  fs.cpSync(prior,remote,{recursive:true});fs.cpSync(remote,fresh,{recursive:true});checkSnapshot(prior,fresh);
  const originalDigest = fullProjectDigest(prior);
  assert.equal(fullProjectDigest(fresh), originalDigest);
  for(const [name,value] of [['appsscript.json','{"timeZone":"UTC"}'],['View.html','changed'],['views/panel.html','changed'],['Unexpected.js','extra']]){
    fs.writeFileSync(path.join(fresh,name),value);assert.throws(()=>checkSnapshot(prior,fresh),/mismatch/);
    assert.notEqual(fullProjectDigest(fresh), originalDigest);
    if(fs.existsSync(path.join(prior,name)))fs.copyFileSync(path.join(prior,name),path.join(fresh,name));else fs.unlinkSync(path.join(fresh,name));
  }
});
