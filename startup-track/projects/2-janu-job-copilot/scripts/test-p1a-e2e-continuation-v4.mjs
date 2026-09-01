import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const projectDir=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patcher=path.join(projectDir,'scripts','patch-p1a-e2e-continuation-v4.mjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'janu-e2e-v4-'));
const file=path.join(dir,'TrackerWorkflow.js');
const fixture=`const P12={};
// P1-A-E2E-CONTINUATION-3
function p1aQueueWorkerState_(){return {state:'NONE'};}
function p1aTailoringNeedsResume_(){return false;}
function p1aVerifiedJdReady_(){return false;}
function p1aQaNeedsRepair_(){return false;}
function p1aE2EContinuationTick_(){return {status:'V3'};}
function p1aE2EContinuationSelfTest_(){return {pass:true,contract:'P1-A-E2E-CONTINUATION-3'};}
function runP1AE2EContinuationSelfTest(){return p1aE2EContinuationSelfTest_();}
`;
fs.writeFileSync(file,fixture);
function apply(){const r=spawnSync(process.execPath,[patcher,dir],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout||'v4 patch failed');return r.stdout;}
function fnSource(text,name){const start=text.indexOf('function '+name+'(');if(start<0)throw new Error(name+' missing');const open=text.indexOf('{',start);let d=0,q=null,e=false,line=false,block=false;for(let i=open;i<text.length;i++){const c=text[i],n=text[i+1]||'';if(line){if(c==='\n')line=false;continue;}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}if(q){if(e){e=false;continue;}if(c==='\\'){e=true;continue;}if(c===q)q=null;continue;}if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(start,i+1);}throw new Error('unterminated '+name);}
apply();
const once=fs.readFileSync(file,'utf8');
apply();
const out=fs.readFileSync(file,'utf8');
if(once!==out)throw new Error('P1-A-E2E-CONTINUATION-4 patch is not idempotent');
for(const token of ['P1-A-E2E-CONTINUATION-4','E2E-CURSOR-FAIRNESS-001','E2E-STRANDED-JD-001','STRANDED_VERIFYING_JD_ENQUEUED','p1a_e2e_scan_cursor_row'])if(!out.includes(token))throw new Error('missing '+token);
if(!out.includes('P1-A-E2E-CONTINUATION-3'))throw new Error('V3 compatibility marker lost');
const pure=['p1aE2EScanRows_','p1aE2ENextCursor_','p1aTrustedJdRecoverySource_','p1aVerifyingJdNeedsRetrieve_'].map(n=>fnSource(out,n)).join('\n');
const ctx={};vm.createContext(ctx);vm.runInContext(pure,ctx);
const latest=ctx.p1aE2EScanRows_(1004,0,250);
if(latest.length!==250||latest[0]!==755||!latest.includes(1004)||latest.includes(2))throw new Error('latest-window fairness regression');
const wrap=ctx.p1aE2EScanRows_(1004,995,20);
if(wrap[0]!==995||!wrap.includes(1004)||!wrap.includes(2))throw new Error('cursor wrap regression');
if(ctx.p1aE2ENextCursor_([1003,1004],1004)!==2)throw new Error('next cursor wrap regression');
const trusted={Decision:'New',Status:'Verifying JD','JD Snapshot Status':'Not Started','JD Completeness %':0,'Source Reliability':'Official ATS','Canonical Apply URL':'https://jobs.example/x'};
if(ctx.p1aVerifyingJdNeedsRetrieve_(trusted)!==true)throw new Error('trusted stranded JD must be recoverable');
if(ctx.p1aVerifyingJdNeedsRetrieve_({...trusted,'Source Reliability':'Unverified'})!==false)throw new Error('untrusted stranded JD must not auto-enqueue');
if(ctx.p1aVerifyingJdNeedsRetrieve_({...trusted,'Vacancy Status':'CLOSED'})!==false)throw new Error('closed vacancy must not auto-enqueue JD');
const tick=fnSource(out,'p1aE2EContinuationTick_');
if(tick.includes('Math.min(aSheet.getLastRow(),250)'))throw new Error('fixed first-250 starvation cap remains');
if(!tick.includes("p1aE2EScanRows_(last,cursor,250)"))throw new Error('bounded fair scan missing');
if((tick.match(/return out;/g)||[]).length<5)throw new Error('expected one-mutation early-return paths missing');
const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr);
console.log(JSON.stringify({status:'PASS',contract:'P1-A-E2E-CONTINUATION-4',cursor:'E2E-CURSOR-FAIRNESS-001',strandedJd:'E2E-STRANDED-JD-001',latestWindow:true,wrapAround:true,trustedSourceGuard:true,closedVacancyGuard:true,maxScan:250,idempotent:true,syntax:true},null,2));
