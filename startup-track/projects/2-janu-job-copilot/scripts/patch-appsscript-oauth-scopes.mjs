import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const checkOnly=process.argv.includes('--check');
const manifestPath=path.join(root,'appsscript.json');
if(!fs.existsSync(manifestPath)) throw new Error('appsscript.json missing');

const CORE_SCOPES=[
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/script.external_request',
  'https://www.googleapis.com/auth/script.scriptapp'
];

const SERVICE_SCOPES=[
  ['GmailApp','https://mail.google.com/'],
  ['MailApp','https://www.googleapis.com/auth/script.send_mail'],
  ['CalendarApp','https://www.googleapis.com/auth/calendar'],
  ['SlidesApp','https://www.googleapis.com/auth/presentations'],
  ['FormApp','https://www.googleapis.com/auth/forms']
];

const source=fs.readdirSync(root)
  .filter(f=>f.endsWith('.gs')||f.endsWith('.js'))
  .map(f=>fs.readFileSync(path.join(root,f),'utf8'))
  .join('\n');

const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const existing=Array.isArray(manifest.oauthScopes)?manifest.oauthScopes:[];
const required=[...CORE_SCOPES];
for(const [token,scope] of SERVICE_SCOPES) if(source.includes(token)) required.push(scope);
if(/Session\.[\s\S]{0,120}getEmail\s*\(/.test(source)) required.push('https://www.googleapis.com/auth/userinfo.email');

const next=[...new Set([...existing,...required])].sort();
const missing=required.filter(scope=>!existing.includes(scope));

if(checkOnly){
  const absent=required.filter(scope=>!next.includes(scope));
  if(absent.length) throw new Error('OAuth scope contract missing: '+absent.join(', '));
  const current=Array.isArray(manifest.oauthScopes)?[...manifest.oauthScopes].sort():[];
  const notPersisted=required.filter(scope=>!current.includes(scope));
  if(notPersisted.length) throw new Error('Persisted OAuth scopes missing: '+notPersisted.join(', '));
  console.log(JSON.stringify({status:'PASS',contract:'OWNER-SCOPE-FRESHNESS-002',requiredCount:required.length,scopeCount:current.length},null,2));
  process.exit(0);
}

manifest.oauthScopes=next;
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({
  status:'PASS',
  contract:'OWNER-SCOPE-FRESHNESS-002',
  existingExplicitScopes:existing.length,
  addedScopes:missing,
  totalScopes:next.length
},null,2));
