import { Deal } from './types';
import { thisWeekDeals, lastWeekDeals } from './mockData';

export interface SheetData {
  thisWeek: Deal[];
  lastWeek: Deal[];
  fetchedAt: string;
}

export async function fetchDashboardData(): Promise<SheetData> {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) {
    return { thisWeek: thisWeekDeals, lastWeek: lastWeekDeals, fetchedAt: new Date().toISOString() };
  }

  const res = await fetch(`${url}?format=json`, {
    next: { revalidate: 300 },
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`Apps Script returned ${res.status}`);
  return res.json();
}
