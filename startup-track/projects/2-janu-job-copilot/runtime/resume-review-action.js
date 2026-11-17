function p1aMayRequestResumeReview_(app) {
  if (app.Decision !== 'Apply' || app.Status === 'Closed' || app['Vacancy Status'] === 'CLOSED') return false;
  const pending = value => ['', 'pending', 'pending review', 'not started'].includes(String(value || '').trim().toLowerCase());
  if (!pending(app['Resume Review Decision'])) return false;
  const id = app['Application ID'], version = app['Resume Version ID'];
  if (!id || !version) return false;
  const sheet = SpreadsheetApp.getActive().getSheetByName('Resume Registry');
  if (!sheet) return false;
  const [header, ...rows] = sheet.getDataRange().getDisplayValues();
  const ix = ['Application ID', 'Resume Version ID', 'Review Decision'].map(name => header.indexOf(name));
  if (ix.includes(-1)) throw new Error('Incomplete Resume Registry schema');
  const matches = rows.filter(row => row[ix[0]] === String(id) && row[ix[1]] === String(version));
  return matches.length === 1 && pending(matches[0][ix[2]]);
}

function p1aEnsureResumeReviewAction_(app) {
  if (!p1aMayRequestResumeReview_(app)) return {created:false, reason:'NO_VERIFIED_PENDING_REVIEW'};
  const sheet = SpreadsheetApp.getActive().getSheetByName('My Actions');
  if (!sheet) throw new Error('My Actions unavailable');
  const [header, ...rows] = sheet.getDataRange().getDisplayValues();
  const values = {
    'Record ID':app['Application ID'], 'Record Type':'Application', Company:app.Company || '', Role:app.Role || '',
    'Action Type':'Resume review', 'Exact Action Needed':'Review the tailored resume; choose Approved, Revision Needed, or Withdraw.',
    Urgency:'Normal', 'Workflow Status':'Open', 'Relevant Link':app['Tailored Resume Link'] || '',
    'Response Status':'Waiting for Janu', 'Last Updated':now_()
  };
  if (Object.keys(values).some(name => !header.includes(name))) throw new Error('Incomplete My Actions schema');
  const [id, type, status] = ['Record ID','Action Type','Workflow Status'].map(name=>header.indexOf(name));
  const exists = rows.some(row => row[id] === String(app['Application ID']) && row[type] === 'Resume review' &&
    !['closed','completed','cancelled','resolved'].includes(String(row[status]).toLowerCase()));
  if (exists) return {created:false,reason:'ALREADY_OPEN'};
  sheet.appendRow(header.map(name=>values[name] === undefined ? '' : values[name]));
  return {created:true,applicationId:app['Application ID']};
}
