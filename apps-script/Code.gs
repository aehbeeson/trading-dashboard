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

function parseSplit(val) {
  if (!val || val === '-') return 0;
  return parseFloat(String(val).replace(/[£$€,\s]/g, '')) || 0;
}

function readTab(ss, tabName) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) { Logger.log('Tab not found: ' + tabName); return []; }

  var rows = sheet.getDataRange().getValues();
  if (rows.length < 3) return [];

  // Row 0 = group headers (SPLITS, CLOSE DATES etc)
  // Row 1 = actual column names — this is the header row
  var H = {};
  rows[1].forEach(function(h, i) { H[String(h).trim()] = i; });

  var C = {
    DEAL_ID:        findCol(H, ['Deal ID', 'Record ID'],                                         0),
    COMPANY_NAME:   findCol(H, ['Company name', 'Company Name', 'Account Name'],                  2),
    DEAL_OWNER:     findCol(H, ['Deal owner', 'Deal Owner', 'Owner'],                            12),
    AMOUNT:         findCol(H, ['Amount in company currency', 'Amount', 'ARR'],                   6),
    FORECAST_CAT:   findCol(H, ['Forecast category', 'Forecast Category'],                       10),
    PIPELINE:       findCol(H, ['Pipeline'],                                                     13),
    CLOSE_DATE:     findCol(H, ['Close Date'],                                                   15),
    CLEAN_COMPANY:  findCol(H, ['Clean Company Name', 'Clean Company'],                          23),
    CLOSE_DATE_C:   findCol(H, ['Close Date (excl time)', 'Close Date Clean'],                   28),
    PIPELINE_STAGE: findCol(H, ['Pipeline Stage', 'Deal Stage'],                                 37),
    NB_SPLIT:       findCol(H, ['NB Split'],                                                     42),
    CS_SPLIT:       findCol(H, ['CS Split'],                                                     43),
    PROBABILITY:    findCol(H, ['Probability (%)', 'Deal probability', 'Probability'],           -1),
  };
  Logger.log(tabName + ' resolved columns: ' + JSON.stringify(C));

  var FORECAST_NORM = {
    'commit':     'Commit',
    'closed won': 'Commit',
    'best case':  'Best Case',
    'pipeline':   'Pipeline',
    'omitted':    'Omitted',
  };

  var tz = Session.getScriptTimeZone();

  var deals = [];

  // Data starts at row index 2 (skipping group header + column header rows)
  for (var i = 2; i < rows.length; i++) {
    var row = rows[i];

    var cleanCompany = C.CLEAN_COMPANY >= 0 ? String(row[C.CLEAN_COMPANY] || '').trim() : '';
    var company = cleanCompany || (C.COMPANY_NAME >= 0 ? String(row[C.COMPANY_NAME] || '').trim() : '');
    if (!company) continue;

    var dealId = C.DEAL_ID >= 0 ? String(row[C.DEAL_ID] || '').trim() : '';
    if (!dealId) continue;

    var pipeline = C.PIPELINE >= 0 ? String(row[C.PIPELINE] || '').trim() : '';
    var owner    = C.DEAL_OWNER >= 0 ? String(row[C.DEAL_OWNER] || '').trim() : '';
    var stage    = C.PIPELINE_STAGE >= 0 ? String(row[C.PIPELINE_STAGE] || '').trim() : '';

    var fcRaw = C.FORECAST_CAT >= 0 ? String(row[C.FORECAST_CAT] || '').toLowerCase().trim() : '';
    var forecastCategory = FORECAST_NORM[fcRaw] || 'Pipeline';

    // Format close date as YYYY-MM-DD
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

    var nbSplit = parseSplit(C.NB_SPLIT >= 0 ? row[C.NB_SPLIT] : null);
    var csSplit = parseSplit(C.CS_SPLIT >= 0 ? row[C.CS_SPLIT] : null);

    var prob = 0;
    if (C.PROBABILITY >= 0 && row[C.PROBABILITY] !== '') {
      prob = parseFloat(String(row[C.PROBABILITY] || '0').replace(/[%,\s]/g, '')) || 0;
      if (prob > 1) prob = prob / 100; // normalize percentage (0-100) to decimal (0-1)
    }

    var base = { company: company, owner: owner, stage: stage, forecastCategory: forecastCategory, closeDate: closeDate, probability: prob };

    if (pipeline === 'Resellers') {
      // Resellers: NB Split holds the reseller value (falls back to full Amount)
      var rValue = nbSplit || parseSplit(C.AMOUNT >= 0 ? row[C.AMOUNT] : null);
      if (rValue > 0) {
        deals.push(Object.assign({}, base, { id: dealId, value: rValue, area: 'resellers' }));
      }
    } else {
      // NB Split > 0 → New Business tab
      if (nbSplit > 0) {
        deals.push(Object.assign({}, base, { id: dealId + '-nb', value: nbSplit, area: 'new-business' }));
      }
      // CS Split > 0 → Customer Success tab (same deal can appear in both)
      if (csSplit > 0) {
        deals.push(Object.assign({}, base, { id: dealId + '-cs', value: csSplit, area: 'customer-success' }));
      }
    }
  }

  return deals;
}
