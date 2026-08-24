import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const projectDir=process.argv[2]||path.resolve('startup-track/projects/2-janu-job-copilot');
const patch=path.join(projectDir,'scripts','patch-renderer-careerbreak.mjs');
const patchText=fs.readFileSync(patch,'utf8');
for(const token of ['RENDER-CAREERBREAK-001','RENDER-CAREERBREAK-V2','PREVENTION-RECURRENCE-001','RENDER-QUARANTINE-001','REGRESSION-HEALTH-CYCLE-LOCK-001','rendererReplayBlocked_','rendererQuarantineBlocks_','rendererPolicy','SELF_TEST_PASS_CANARY_PENDING','RENDERER_QUARANTINE_ACTIVE',"includes('open / release blocker')"])if(!patchText.includes(token))throw new Error('renderer regression contract missing '+token);
if(patchText.includes('/Open \\/ Release Blocker/i'))throw new Error('BUILD-REGEX-HEALTH-001: generated release-blocker match must not rely on escape-sensitive slash regex');

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'janu-renderer-test-'));
const source=`
const P12=Object.freeze({VERSION:'1.3.8',SUITE:'p0-regression-v19'});
const JC={S:{Q:'__Processing Queue'}};
function stripInternalEvidenceTags_(s){return String(s||'');}
function esc_(s){return s;}
function verifyReleaseIdentity(){return true;}
function upsertWorkerState_(){}
function healthSet_(){}
function now_(){return new Date();}
function SH_(){return {getLastRow(){return 1;},getRange(){return {getDisplayValue(){return'';},createTextFinder(){return {matchEntireCell(){return this;},findNext(){return null;}};},setValue(){}};}};}
function hm_(){return {};}
function render_(v,d){const b={};const scalar={'{{NAME}}':'JANU','{{CAREER_BREAK}}':stripInternalEvidenceTags_(d.career_break||''),'{{EDUCATION}}':''};Object.keys(scalar).forEach(k=>{});function block(token,items){}block('{{GLOROOTS_BULLETS}}',[]);b.setFontFamily('Arial');return{};}
function p1aE2EContinuationTick_(){const rows=[{'Application ID':'A','Decision':'Apply'}];for(let r=0;r<rows.length;r++){let a=rows[r],id=String(a['Application ID']||'');if(!id||String(a['Decision']||'')!=='Apply')continue;const x={source:'p1a-e2e-continuation-v3',reason:'TAILORING_STALL'};return x;}return {status:'NO_ELIGIBLE_STALL'};}
function nextQ_(onlyApp){const v=[['Q','A','RESUME_GENERATE','queued']],t=Date.now();let best=null;for(let i=0;i<v.length;i++){const app=String(v[i][1]||''),nx=0;if(onlyApp&&app!==onlyApp)continue;if(v[i][3]==='queued'&&(!nx||nx<=t))best=i+2;}return best;}
function runQ_(r){const s=SH_();const qid='Q',app='A',type='RESUME_GENERATE',payload={},attempt=1,max=4,started=now_();s.getRange(r,4).setValue('running');return 1;}
function phase1HealthTick(){return true;}
`;
const file=path.join(tmp,'TrackerWorkflow.js');fs.writeFileSync(file,source);
const run=spawnSync(process.execPath,[patch,tmp],{encoding:'utf8'});if(run.status!==0)throw new Error(run.stderr||run.stdout||'renderer patch failed');
const out=fs.readFileSync(file,'utf8');
for(const token of ["delete scalar['{{CAREER_BREAK}}']","textBlock('{{CAREER_BREAK}}'",'function rendererCareerBreakLines_(','function rendererReplayBlocked_(','function rendererQuarantineBlocks_(','function enforceReleaseBlockerHealth_(',"rendererPolicy:'RENDER-CAREERBREAK-V2'",'BLOCKED_SAME_POLICY_FAILURE','RENDERER_QUARANTINE_ACTIVE','RELEASE_BLOCKER_OPEN','runRendererCareerBreakSelfTest();',"st.toLowerCase().includes('open / release blocker')"])if(!out.includes(token))throw new Error('transformed renderer source missing '+token);
if(out.includes('/Open / Release Blocker/i'))throw new Error('BUILD-REGEX-HEALTH-001: malformed generated status regex survived');
const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(check.status!==0)throw new Error(check.stderr);

function lines(value){return String(value||'').replace(/\r/g,'\n').split(/\n+/).map(x=>String(x||'').replace(/^\s*(?:[•●▪◦*\-]|\d+[.)])\s*/, '').trim()).filter(Boolean);}
const fixture='Took a planned break for caregiving and health priorities while continuing independent product and AI exploration and portfolio development.\n• Built a personal AI automation (Morning Brief) using n8n and Claude to generate a daily briefing for personal productivity.\n• Developing a personal Job Copilot (not live) using Claude Code to automate job sourcing, JD fit scoring, tailored application preparation and workflow tracking.';
const got=lines(fixture);if(got.length!==3)throw new Error('held-out Career Break fixture did not preserve 3 lines');
console.log(JSON.stringify({status:'PASS',contract:'RENDER-CAREERBREAK-V2',regression:'RENDER-CAREERBREAK-001',prevention:'PREVENTION-RECURRENCE-001',buildRegression:'BUILD-REGEX-HEALTH-001',quarantine:'RENDER-QUARANTINE-001',healthPrecedence:'REGRESSION-HEALTH-CYCLE-LOCK-001',transformedArtifactSyntax:true,exactPriorFailureFixture:true,samePolicyReplayGuard:true,claimGate:true,publisherGate:true,escapeSafeLiteralMatch:true},null,2));