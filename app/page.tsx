import { fetchDashboardData } from '@/lib/sheets';
import Dashboard from '@/components/Dashboard';

export const dynamic = 'force-dynamic'; // Render on request, not at build time

export default async function Home() {
  const data = await fetchDashboardData();
  return <Dashboard thisWeek={data.thisWeek} lastWeek={data.lastWeek} sdForecasts={data.sdForecasts} pipelineGen={data.pipelineGen} pipelineGenLastWeek={data.pipelineGenLastWeek} pipelineGenForecasts={data.pipelineGenForecasts} overviewComments={data.overviewComments} mastersheetForecasts={data.mastersheetForecasts} dataDownloadedAt={data.dataDownloadedAt} fetchedAt={data.fetchedAt} />;
}
