import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../runtime/resume-review-action.js',import.meta.url),'utf8');
const app={'Application ID':'fixture',Decision:'Apply',Status:'Resume Review','Resume Version ID':'v2','Resume Review Decision':'Pending Review','Vacancy Status':'OPEN'};
function fixture(decision='Pending Review'){
  const actions=[['Record ID','Record Type','Company','Role','Action Type','Exact Action Needed','Urgency','Workflow Status','Relevant Link','Your Response / Artifact Link','Response Status','Last Updated']];
  const records=[['Application ID','Resume Version ID','Review Decision'],['fixture','v1','Approved'],['fixture','v2',decision]];
  function sheet(rows){return {getDataRange:()=>({getDisplayValues:()=>rows}),appendRow:r=>rows.push(r)};}
  const ctx=vm.createContext({now_:()=>new Date(0),SpreadsheetApp:{getActive:()=>({getSheetByName:n=>sheet(n==='My Actions'?actions:records)})}});
  vm.runInContext(source,ctx);
  return {actions,records,request:(a=app)=>ctx.p1aEnsureResumeReviewAction_(a)};
}
test('approved current version cannot create obsolete review',()=>{
  const f=fixture('Approved');assert.equal(f.request().created,false);assert.equal(f.actions.length,1);
});
test('review current version once and ignore a closed older action',()=>{
  const f=fixture();f.actions.push(['fixture','Application','','','Resume review','','','Closed','https://example.invalid/old']);
  assert.equal(f.request().created,true);assert.equal(f.request().created,false);
});
test('a different action type cannot suppress review',()=>{
  const f=fixture();f.actions.push(['fixture','Application','','','JD capture','','','Open']);assert.equal(f.request().created,true);
});
test('ambiguous registry mapping is held',()=>{
  const f=fixture();f.records.push(['fixture','v2','Approved']);assert.equal(f.request().created,false);
});
test('closed Skip cannot be sent to review',()=>assert.equal(fixture().request({...app,Decision:'Skip',Status:'Closed'}).created,false));
