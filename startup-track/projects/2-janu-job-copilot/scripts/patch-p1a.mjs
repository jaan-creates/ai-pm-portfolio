import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const target=files.find(f=>{const t=fs.readFileSync(path.join(root,f),'utf8');return t.includes('function verifyReleaseIdentity()')&&t.includes('const P12');});
if(!target)throw new Error('TrackerWorkflow source not found');
const file=path.join(root,target);let s=fs.readFileSync(file,'utf8'),before=s;
const anchor='function verifyReleaseIdentity()';const i=s.indexOf(anchor);if(i<0)throw new Error('release identity anchor missing');
const p1a=`// P1-A Retrieval / Intake contracts
function retrievalProviderRoute_(ctx){ctx=ctx||{};if(ctx.cacheHit)return 'CACHE';if(ctx.officialUrl&&ctx.directAllowed!==false)return 'DIRECT_OFFICIAL';if(ctx.tavilyAvailable!==false)return 'TAVILY';if(ctx.serpApiAvailable!==false)return 'SERPAPI';return 'UNAVAILABLE';}
function retrievalProvenance_(provider,url,content,retrievedAt,confidence){const text=String(content||'');return{provider:String(provider||''),url:String(url||''),retrieved_at:String(retrievedAt||iso_()),content_hash:hash_(text),confidence:Number(confidence||0)};}
function parseJobPostingJsonLd_(html){const src=String(html||''),re=/<script[^>]+type=[\\"']application\\/ld\\+json[\\"'][^>]*>([\\s\\S]*?)<\\/script>/ig;let m;while((m=re.exec(src))){try{const raw=JSON.parse(m[1]),items=Array.isArray(raw)?raw:(raw&&raw['@graph']?raw['@graph']:[raw]);for(const x of items)if(x&&String(x['@type']||'').toLowerCase()==='jobposting')return{ok:true,parser:'JSON_LD_JOBPOSTING',job:x};}catch(e){}}return{ok:false,parser:'JSON_LD_JOBPOSTING',reason:'NO_VALID_JOBPOSTING'};}
function atsHostKind_(url){const h=String(url||'').toLowerCase();if(h.includes('greenhouse.io'))return 'GREENHOUSE';if(h.includes('lever.co'))return 'LEVER';if(h.includes('ashbyhq.com'))return 'ASHBY';if(h.includes('myworkdayjobs.com')||h.includes('workday.com'))return 'WORKDAY';return 'GENERIC';}
function deterministicJobParse_(url,html){const ld=parseJobPostingJsonLd_(html);return ld.ok?{ok:true,kind:atsHostKind_(url),parser:ld.parser,job:ld.job}:{ok:false,kind:atsHostKind_(url),parser:'NONE',reason:ld.reason};}
function vacancyRevalidationRequired_(lastVerifiedAt,stage,nowMs){const t=new Date(lastVerifiedAt||0).getTime();if(!isFinite(t)||t<=0)return true;const age=(Number(nowMs||Date.now())-t)/3600000,limit=String(stage||'TAILOR').toUpperCase()==='SUBMIT'?24:72;return age>limit;}
function vacancyStateDecision_(r){r=r||{};if(r.explicitClosed===true||[404,410].includes(Number(r.httpStatus||0)))return 'CLOSED';if(r.explicitOpen===true)return 'OPEN';return 'UNKNOWN';}
function sourcePromotionKey_(sourceUrl,contentHash){return hash_(String(sourceUrl||'').trim().toLowerCase()+'|'+String(contentHash||''));}
function sourcePromotionDecision_(priorKey,newKey,vacancyState){if(String(vacancyState||'').toUpperCase()==='CLOSED')return 'REJECT_CLOSED';if(priorKey&&String(priorKey)===String(newKey))return 'DUPLICATE_NOOP';return 'PROMOTE';}
function p1aContractSelfTest_(){const now=Date.now(),c=[];c.push(retrievalProviderRoute_({cacheHit:true})==='CACHE');c.push(retrievalProviderRoute_({officialUrl:'https://example.com/job'})==='DIRECT_OFFICIAL');c.push(retrievalProviderRoute_({directAllowed:false,tavilyAvailable:true})==='TAVILY');c.push(retrievalProviderRoute_({directAllowed:false,tavilyAvailable:false,serpApiAvailable:true})==='SERPAPI');const ld=deterministicJobParse_('https://jobs.lever.co/x','<script type=\\"application/ld+json\\">{\\"@type\\":\\"JobPosting\\",\\"title\\":\\"PM\\"}</script>');c.push(ld.ok&&ld.kind==='LEVER'&&ld.job.title==='PM');c.push(vacancyRevalidationRequired_(new Date(now-73*3600000).toISOString(),'TAILOR',now));c.push(!vacancyRevalidationRequired_(new Date(now-23*3600000).toISOString(),'SUBMIT',now));c.push(vacancyStateDecision_({httpStatus:410})==='CLOSED');const k=sourcePromotionKey_('HTTPS://EXAMPLE.COM/JOB','abc');c.push(sourcePromotionDecision_(k,k,'OPEN')==='DUPLICATE_NOOP');c.push(sourcePromotionDecision_('',k,'CLOSED')==='REJECT_CLOSED');if(c.some(x=>!x))throw new Error('P1-A contract self-test failed '+JSON.stringify(c));return{pass:true,total:c.length};}

`;
if(!s.includes('function retrievalProviderRoute_('))s=s.slice(0,i)+p1a+s.slice(i);
for(const token of ['function retrievalProviderRoute_(','function parseJobPostingJsonLd_(','function deterministicJobParse_(','function vacancyRevalidationRequired_(','function sourcePromotionDecision_(','function p1aContractSelfTest_('])if(!s.includes(token))throw new Error('P1-A contract missing '+token);
if(s!==before)fs.writeFileSync(file,s);
console.log(JSON.stringify({status:'PASS',file:target,changed:s!==before,workstream:'P1-A'},null,2));
