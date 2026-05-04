function doGet(e) {
  if (e && e.parameter) {
    if (e.parameter.action === 'saveForecast') {
      return handleSaveForecast(e.parameter.data);
    }
    if (e.parameter.format === 'json') {
      var data = getDashboardData();
      return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('B2B Trading Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {
    thisWeek:            readTab(ss, 'Clean Data'),
    lastWeek:            readTab(ss, 'Clean Data Last Week'),
    sdForecasts:         readSDForecast(ss),
    pipelineGen:         readPipelineGen(ss, 'Clean Data'),
    pipelineGenLastWeek: readPipelineGen(ss, 'Clean Data Last Week'),
    fetchedAt:           new Date().toISOString()
  };
  Logger.log('thisWeek count: ' + result.thisWeek.length);
  Logger.log('lastWeek count: ' + result.lastWeek.length);
  if (result.thisWeek.length > 0) Logger.log('First deal: ' + JSON.stringify(result.thisWeek[0]));
  return result;
}

// ── SD Forecast sheet ────────────────────────────────────────────────────────

function getOrCreateForecastSheet(ss) {
  var sheet = ss.getSheetByName('SD Forecast');
  if (!sheet) {
    sheet = ss.insertSheet('SD Forecast');
    sheet.getRange(1, 1, 1, 14).setValues([[
      'SubmittedAt', 'Area',
      'Month_ClosedWon', 'Month_Commit', 'Month_BestCase', 'Month_Pipeline', 'Month_Omitted',
      'Qtr_ClosedWon',   'Qtr_Commit',   'Qtr_BestCase',   'Qtr_Pipeline',   'Qtr_Omitted',
      'MainDeals', 'OtherDeals'
    ]]);
  }
  return sheet;
}

function handleSaveForecast(encodedData) {
  try {
    var data = JSON.parse(decodeURIComponent(encodedData));
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateForecastSheet(ss);

    // Always append — the full history is kept as a log.
    // readSDForecast picks the most recent row per area when displaying.
    var m = data.month   || {};
    var q = data.quarter || {};
    sheet.appendRow([
      new Date().toISOString(),
      String(data.area).trim(),
      Number(m.closedWon) || 0, Number(m.commit) || 0, Number(m.bestCase) || 0, Number(m.pipeline) || 0, Number(m.omitted) || 0,
      Number(q.closedWon) || 0, Number(q.commit) || 0, Number(q.bestCase) || 0, Number(q.pipeline) || 0, Number(q.omitted) || 0,
      String(data.mainDeals  || ''),
      String(data.otherDeals || ''),
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readSDForecast(ss) {
  var sheet = ss.getSheetByName('SD Forecast');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  // Rows are appended chronologically. Walk forward so the last entry
  // for each area wins — that becomes the "current" forecast.
  var latest = {}; // area → row
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var area = String(r[1] || '').trim();
    if (!area) continue;
    latest[area] = r; // later rows overwrite earlier ones
  }

  var result = [];
  for (var key in latest) {
    var r = latest[key];
    result.push({
      area: key,
      month: {
        closedWon: Number(r[2])  || 0,
        commit:    Number(r[3])  || 0,
        bestCase:  Number(r[4])  || 0,
        pipeline:  Number(r[5])  || 0,
        omitted:   Number(r[6])  || 0,
      },
      quarter: {
        closedWon: Number(r[7])  || 0,
        commit:    Number(r[8])  || 0,
        bestCase:  Number(r[9])  || 0,
        pipeline:  Number(r[10]) || 0,
        omitted:   Number(r[11]) || 0,
      },
      mainDeals:  String(r[12] || ''),
      otherDeals: String(r[13] || ''),
      updatedAt:  String(r[0]  || ''), // SubmittedAt timestamp
    });
  }
  return result;
}

// ── Pipeline Generation ──────────────────────────────────────────────────────
// Uses Amount in company currency (not splits), grouped by Source Type.
// Scoped to New Customer Pipeline only.

function readPipelineGen(ss, tabName) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 3) return [];

  var H = {};
  rows[1].forEach(function(h, i) { H[String(h).trim()] = i; });

  var C = {
    DEAL_ID:       findCol(H, ['Deal ID', 'Record ID'],                               0),
    COMPANY_NAME:  findCol(H, ['Company name', 'Company Name'],                       2),
    CLEAN_COMPANY: findCol(H, ['Clean Company Name', 'Clean Company'],               23),
    DEAL_OWNER:    findCol(H, ['Deal owner', 'Deal Owner'],                          12),
    AMOUNT:        findCol(H, ['Amount in company currency', 'Amount'],               6),
    PIPELINE:      findCol(H, ['Pipeline'],                                          13),
    CREATE_DATE_C: findCol(H, ['Create Date (excl time)'],                           24),
    CREATE_DATE:   findCol(H, ['Create Date'],                                       14),
    SOURCE_TYPE:   findCol(H, ['Source Type'],                                       36),
  };

  var tz   = Session.getScriptTimeZone();
  var out  = [];

  for (var i = 2; i < rows.length; i++) {
    var row = rows[i];

    if (String(row[C.PIPELINE] || '').trim() !== 'New Customer Pipeline') continue;

    var dealId = String(row[C.DEAL_ID] || '').trim();
    if (!dealId) continue;

    var amount = parseFloat(String(row[C.AMOUNT] || '0').replace(/[£$€,\s]/g, '')) || 0;
    if (amount <= 0) continue;

    var sourceType = String(row[C.SOURCE_TYPE] || '').trim();
    if (!sourceType || sourceType === '#N/A') continue;

    var cleanCompany = String(row[C.CLEAN_COMPANY] || '').trim();
    var company      = cleanCompany || String(row[C.COMPANY_NAME] || '').trim();
    var owner        = String(row[C.DEAL_OWNER] || '').trim();

    var rawDate = row[C.CREATE_DATE_C] || row[C.CREATE_DATE];
    var createDate = '';
    if (rawDate instanceof Date && !isNaN(rawDate)) {
      createDate = Utilities.formatDate(rawDate, tz, 'yyyy-MM-dd');
    } else if (rawDate) {
      var parsed = new Date(rawDate);
      createDate = isNaN(parsed) ? String(rawDate).trim() : Utilities.formatDate(parsed, tz, 'yyyy-MM-dd');
    }
    if (!createDate) continue;

    out.push({ id: dealId, company: company, owner: owner, amount: amount, sourceType: sourceType, createDate: createDate });
  }

  return out;
}

// ── Column helpers ───────────────────────────────────────────────────────────

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
    CLOSE_WEEK_NO:  findCol(H, ['Close Week No', 'Close Week Number', 'Week No'],                30),
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

    var closeWeekNo = C.CLOSE_WEEK_NO >= 0 ? String(row[C.CLOSE_WEEK_NO] || '').trim() : '';

    var base = { company: company, owner: owner, stage: stage, forecastCategory: forecastCategory, closeDate: closeDate, probability: prob, closeWeekNo: closeWeekNo };

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
