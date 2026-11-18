import assert from 'node:assert/strict';
import {canonicalDeployment,createController} from './manage-canonical-pin.mjs';

const canonical='Job Copilot API — canonical account cutover';
const sha='a'.repeat(40);
function harness(){
  const records=new Map();
  let deployed=10, next=11, updates=0, failAfterUpdate=false;
  const invoke=(command,...args)=>{
    if(command==='list-deployments')return[
      {deploymentId:'other',versionNumber:9,description:'Job Copilot control API v17'},
      {deploymentId:'canonical-id',versionNumber:deployed,description:canonical},
    ];
    if(command==='create-version')return{versionNumber:next++};
    if(command==='update-deployment'){
      assert.equal(args[0],'canonical-id');
      assert.equal(args[1],'--versionNumber');
      assert.equal(args[3],'--description');
      assert.equal(args[4],canonical);
      updates++;
      deployed=Number(args[2]);
      if(failAfterUpdate)throw Error('lost update response');
      return{deploymentId:'canonical-id',versionNumber:deployed};
    }
    throw Error('Unexpected command '+command);
  };
  const controller=createController({invoke,read:p=>structuredClone(records.get(p)),write:(p,v)=>records.set(p,structuredClone(v))});
  return {controller,records,setVersion:v=>{deployed=v},loseUpdateResponse:()=>{failAfterUpdate=true},getVersion:()=>deployed,getUpdates:()=>updates};
}

assert.throws(()=>canonicalDeployment([]),/exactly one/);
assert.throws(()=>canonicalDeployment([{deploymentId:'x',versionNumber:1,description:canonical},{deploymentId:'y',versionNumber:2,description:canonical}]),/exactly one/);
const h=harness();
assert.equal(h.controller.snapshot('state').previousVersion,10);
assert.equal(h.controller.promote('state',sha,'123','1').newVersion,11);
assert.equal(h.controller.verify('state').version,11);
assert.equal(h.controller.rollback('state').version,10);
assert.equal(h.controller.rollback('state').status,'ALREADY_PREVIOUS');
assert.equal(h.getUpdates(),2);
const moved=harness();moved.controller.snapshot('state');moved.setVersion(12);
assert.throws(()=>moved.controller.promote('state',sha,'123','1'),/moved since snapshot/);
assert.equal(moved.getUpdates(),0);
const uncertain=harness();uncertain.controller.snapshot('state');uncertain.loseUpdateResponse();
assert.throws(()=>uncertain.controller.promote('state',sha,'123','1'),/lost update response/);
assert.equal(uncertain.getVersion(),11);
assert.throws(()=>uncertain.controller.rollback('state'),/lost update response/);
assert.equal(uncertain.getVersion(),10);
const external=harness();external.controller.snapshot('state');external.controller.promote('state',sha,'123','1');external.setVersion(12);
assert.throws(()=>external.controller.rollback('state'),/Unexpected external pin change/);
assert.equal(external.getVersion(),12);
console.log(JSON.stringify({status:'PASS',contract:'CANONICAL-PIN-ROLLBACK-001',checks:10}));
