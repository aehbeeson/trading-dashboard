import { fetchDashboardData } from '@/lib/sheets';
import Dashboard from '@/components/Dashboard';

export const revalidate = 300; // Re-fetch from Google Sheets every 5 minutes

export default async function Home() {
  const data = await fetchDashboardData();
  return <Dashboard thisWeek={data.thisWeek} lastWeek={data.lastWeek} fetchedAt={data.fetchedAt} />;
}
