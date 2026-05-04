function doGet(e) {
  if (e && e.parameter && e.parameter.format === 'json') {
    var data = getDashboardData();
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('B2B Trading Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {
    thisWeek:  readTab(ss, 'Clean Data'),
    lastWeek:  readTab(ss, 'Clean Data Last Week'),
    fetchedAt: new Date().toISOString()
  };
  Logger.log('thisWeek count: ' + result.thisWeek.length);
  Logger.log('lastWeek count: ' + result.lastWeek.length);
  if (result.thisWeek.length > 0) Logger.log('First deal: ' + JSON.stringify(result.thisWeek[0]));
  return result;
}

// Case-insensitive column finder — returns defaultIdx if no header matches
function findCol(H, candidates, defaultIdx) {
  for (var i = 0; i < candidates.length; i++) {
    var target = candidates[i].toLowerCase().trim();
    for (var key in H) {
      if (key.toLowerCase().trim() === target) return H[key];
    }
  }
  return defaultIdx !== undefined ? defaultIdx : -1;
}

function readTab(ss, tabName) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) { Logger.log('Tab not found: ' + tabName); return []; }

  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  // Build header name → column index map from row 0
  var H = {};
  rows[0].forEach(function(h, i) { H[String(h).trim()] = i; });
  Logger.log(tabName + ' headers: ' + JSON.stringify(Object.keys(H)));

  // Header name takes priority; hardcoded index is the fallback if name not found
  var C = {
    DEAL_ID:        findCol(H, ['Deal ID', 'Record ID', 'ID'],                                                              0),
    COMPANY_NAME:   findCol(H, ['Company Name', 'Company', 'Account Name'],                                                 2),
    DEAL_OWNER:     findCol(H, ['Deal Owner', 'Owner', 'Deal owner'],                                                      12),
    AMOUNT:         findCol(H, ['Amount', 'ARR', 'Annual Revenue'],                                                         6),
    FORECAST_CAT:   findCol(H, ['Forecast Category', 'Hubspot Forecast Category', 'Forecast category', 'HS Forecast Category'], 10),
    PIPELINE:       findCol(H, ['Pipeline'],                                                                               13),
    CLOSE_DATE:     findCol(H, ['Close Date', 'Close date', 'Closedate'],                                                  15),
    CLEAN_COMPANY:  findCol(H, ['Clean Company', 'Cleaned Company', 'clean_company'],                                      23),
    CLOSE_DATE_C:   findCol(H, ['Close Date Clean', 'Clean Close Date', 'Closedate Clean'],                                28),
    PIPELINE_STAGE: findCol(H, ['Pipeline Stage', 'Deal Stage', 'Stage', 'Lifecycle Stage'],                              37)
  };
  Logger.log('Resolved columns: ' + JSON.stringify(C));

  // TODO: match exactly what appears in your Pipeline column
  var PIPELINE_TO_AREA = {
    'New Business':     'new-business',
    'Customer Success': 'customer-success',
    'Resellers':        'resellers',
    'Guild':            'guild'
  };

  var FORECAST_NORM = {
    'commit':    'Commit',
    'best case': 'Best Case',
    'pipeline':  'Pipeline',
    'omitted':   'Omitted'
  };

  var tz = Session.getScriptTimeZone();

  var deals = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];

    var cleanCompany = C.CLEAN_COMPANY >= 0 ? String(row[C.CLEAN_COMPANY] || '').trim() : '';
    var company = cleanCompany || (C.COMPANY_NAME >= 0 ? String(row[C.COMPANY_NAME] || '').trim() : '');

    var rawAmount = C.AMOUNT >= 0 ? String(row[C.AMOUNT] || '0') : '0';
    var value = parseFloat(rawAmount.replace(/[£$€,\s]/g, '')) || 0;

    if (!company || value <= 0) continue;

    var pipeline = C.PIPELINE >= 0 ? String(row[C.PIPELINE] || '').trim() : '';
    var area = PIPELINE_TO_AREA[pipeline] || 'new-business';

    var fcRaw = C.FORECAST_CAT >= 0 ? String(row[C.FORECAST_CAT] || '').toLowerCase().trim() : '';
    var forecastCategory = FORECAST_NORM[fcRaw] || 'Pipeline';

    // Format close date as YYYY-MM-DD for easy filtering in the frontend
    var rawDate = '';
    if (C.CLOSE_DATE_C >= 0 && row[C.CLOSE_DATE_C]) rawDate = row[C.CLOSE_DATE_C];
    else if (C.CLOSE_DATE >= 0 && row[C.CLOSE_DATE]) rawDate = row[C.CLOSE_DATE];
    var closeDate = '';
    if (rawDate instanceof Date && !isNaN(rawDate)) {
      closeDate = Utilities.formatDate(rawDate, tz, 'yyyy-MM-dd');
    } else if (rawDate) {
      var parsed = new Date(rawDate);
      closeDate = isNaN(parsed) ? String(rawDate).trim() : Utilities.formatDate(parsed, tz, 'yyyy-MM-dd');
    }

    deals.push({
      id:               C.DEAL_ID >= 0 ? String(row[C.DEAL_ID] || 'row-' + i) : 'row-' + i,
      company:          company,
      owner:            C.DEAL_OWNER >= 0 ? String(row[C.DEAL_OWNER] || '').trim() : '',
      value:            value,
      stage:            C.PIPELINE_STAGE >= 0 ? String(row[C.PIPELINE_STAGE] || '').trim() : '',
      forecastCategory: forecastCategory,
      closeDate:        closeDate,
      area:             area
    });
  }
  return deals;
}
