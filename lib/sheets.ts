import { google } from 'googleapis';
import { Deal, AreaKey, ForecastCategory } from './types';
import { thisWeekDeals, lastWeekDeals } from './mockData';

export interface SheetData {
  thisWeek: Deal[];
  lastWeek: Deal[];
  fetchedAt: string;
}

const SHEET_ID = '1BbovDgA7jcmvoocWXfFZGwonPq1yv7vtIM6CSKKombo';
const THIS_WEEK_TAB = 'Clean Data';
const LAST_WEEK_TAB = 'Clean Data Last Week';

// Column indices (0-based) matching the header row
const C = {
  DEAL_ID:       0,   // Deal ID
  COMPANY_NAME:  2,   // Company name
  DEAL_OWNER:    12,  // Deal owner
  AMOUNT:        6,   // Amount in company currency
  FORECAST_CAT:  10,  // Forecast category
  PIPELINE:      13,  // Pipeline  ← determines area tab
  CLOSE_DATE:    15,  // Close Date
  CLEAN_COMPANY: 23,  // Clean Company Name
  CLOSE_DATE_C:  28,  // Close Date (excl time)
  PIPELINE_STAGE:37,  // Pipeline Stage
  IN_FORECAST:   48,  // Is in forecast ADJUSTED?
};

// TODO: confirm these match the exact Pipeline names in your sheet
// Open the sheet, look at the Pipeline column and paste the exact values here
const PIPELINE_TO_AREA: Record<string, AreaKey> = {
  'New Business':     'new-business',
  'Customer Success': 'customer-success',
  'Resellers':        'resellers',
  'Guild':            'guild',
};

const FORECAST_NORM: Record<string, ForecastCategory> = {
  'commit':    'Commit',
  'best case': 'Best Case',
  'pipeline':  'Pipeline',
  'omitted':   'Omitted',
};

function parseAmount(val: unknown): number {
  if (!val) return 0;
  return parseFloat(String(val).replace(/[£$€,\s]/g, '')) || 0;
}

function normaliseForecast(val: unknown): ForecastCategory {
  return FORECAST_NORM[String(val ?? '').toLowerCase().trim()] ?? 'Pipeline';
}

function normaliseArea(pipeline: unknown): AreaKey {
  return PIPELINE_TO_AREA[String(pipeline ?? '').trim()] ?? 'new-business';
}

async function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set');
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

async function fetchTab(tabName: string): Promise<Deal[]> {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${tabName}'!A:BJ`,
  });

  const rows = res.data.values ?? [];
  if (rows.length < 2) return [];

  const [, ...data] = rows; // drop header row

  return data
    .map((row, i): Deal | null => {
      const company = String(row[C.CLEAN_COMPANY] || row[C.COMPANY_NAME] || '').trim();
      const value = parseAmount(row[C.AMOUNT]);
      if (!company || value <= 0) return null;

      return {
        id:               String(row[C.DEAL_ID] ?? `row-${i}`),
        company,
        owner:            String(row[C.DEAL_OWNER] ?? '').trim(),
        value,
        stage:            String(row[C.PIPELINE_STAGE] ?? '').trim(),
        forecastCategory: normaliseForecast(row[C.FORECAST_CAT]),
        closeDate:        String(row[C.CLOSE_DATE_C] || row[C.CLOSE_DATE] || '').trim(),
        area:             normaliseArea(row[C.PIPELINE]),
      };
    })
    .filter((d): d is Deal => d !== null);
}

export async function fetchDashboardData(): Promise<SheetData> {
  // Falls back to mock data locally until credentials are configured
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return { thisWeek: thisWeekDeals, lastWeek: lastWeekDeals, fetchedAt: new Date().toISOString() };
  }

  const [thisWeek, lastWeek] = await Promise.all([
    fetchTab(THIS_WEEK_TAB),
    fetchTab(LAST_WEEK_TAB),
  ]);

  return { thisWeek, lastWeek, fetchedAt: new Date().toISOString() };
}
