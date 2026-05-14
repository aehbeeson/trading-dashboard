import { fetchDashboardData } from '@/lib/sheets';
import Dashboard from '@/components/Dashboard';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic'; // Render on request, not at build time

export default async function Home() {
  const [data, session] = await Promise.all([fetchDashboardData(), auth()]);
  return <Dashboard thisWeek={data.thisWeek} lastWeek={data.lastWeek} sdForecasts={data.sdForecasts} pipelineGen={data.pipelineGen} pipelineGenLastWeek={data.pipelineGenLastWeek} pipelineGenForecasts={data.pipelineGenForecasts} overviewComments={data.overviewComments} mastersheetForecasts={data.mastersheetForecasts} monthsMForecasts={data.monthsMForecasts} guildFunnel={data.guildFunnel} dataDownloadedAt={data.dataDownloadedAt} fetchedAt={data.fetchedAt} userEmail={session?.user?.email ?? null} />;
}
