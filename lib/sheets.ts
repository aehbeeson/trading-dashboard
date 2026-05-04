import { SheetData } from './types';
import { thisWeekDeals, lastWeekDeals } from './mockData';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwchrLZsUlIAHCVm7bV3orxCXHzxnodFeoDl3svh4jQNUFje6bz2KwtuySdV0mgVKl0Lg/exec';

export type { SheetData };

export async function fetchDashboardData(): Promise<SheetData> {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?format=json`, {
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    if (text.trim().startsWith('<')) {
      throw new Error('Apps Script returned HTML instead of JSON');
    }

    return JSON.parse(text);
  } catch (err) {
    console.error('fetchDashboardData failed, using mock data:', err);
    return { thisWeek: thisWeekDeals, lastWeek: lastWeekDeals, fetchedAt: new Date().toISOString() };
  }
}
