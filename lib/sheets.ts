import { Deal } from './types';
import { thisWeekDeals, lastWeekDeals } from './mockData';

export interface SheetData {
  thisWeek: Deal[];
  lastWeek: Deal[];
  fetchedAt: string;
}

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwchrLZsUlIAHCVm7bV3orxCXHzxnodFeoDl3svh4jQNUFje6bz2KwtuySdV0mgVKl0Lg/exec';

export async function fetchDashboardData(): Promise<SheetData> {
  const res = await fetch(`${APPS_SCRIPT_URL}?format=json`, {
    next: { revalidate: 300 },
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`Apps Script returned ${res.status}`);
  return res.json();
}
