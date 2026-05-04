import { Deal } from './types';
import { thisWeekDeals, lastWeekDeals } from './mockData';

export interface SheetData {
  thisWeek: Deal[];
  lastWeek: Deal[];
  fetchedAt: string;
}

// TODO: Replace this with a real Google Sheets fetch when the sheet is ready.
//
// Quickstart options:
//  A) Public sheet + API key:
//     const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/ThisWeek?key=${API_KEY}`;
//
//  B) Service account (better for private sheets):
//     Use google-auth-library to create a JWT client, then call the Sheets API with it.
//
// Set GOOGLE_SHEET_ID + GOOGLE_API_KEY (or service account creds) in Vercel environment variables.

export async function fetchDashboardData(): Promise<SheetData> {
  return {
    thisWeek: thisWeekDeals,
    lastWeek: lastWeekDeals,
    fetchedAt: new Date().toISOString(),
  };
}
