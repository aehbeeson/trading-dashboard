import { Deal, SDForecastEntry, PipelineGenDeal, PipelineGenForecastEntry, OverviewComment, MastersheetForecast, GuildFunnelData } from './types';
import { thisWeekDeals, lastWeekDeals, mastersheetForecasts as mockMastersheetForecasts, monthsMForecasts as mockMonthsMForecasts, guildFunnelData as mockGuildFunnelData } from './mockData';

export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwchrLZsUlIAHCVm7bV3orxCXHzxnodFeoDl3svh4jQNUFje6bz2KwtuySdV0mgVKl0Lg/exec';

export interface SheetData {
  thisWeek:             Deal[];
  lastWeek:             Deal[];
  sdForecasts:          SDForecastEntry[];
  pipelineGen:          PipelineGenDeal[];
  pipelineGenLastWeek:  PipelineGenDeal[];
  pipelineGenForecasts: PipelineGenForecastEntry[];
  overviewComments:     OverviewComment[];
  mastersheetForecasts: MastersheetForecast[];
  monthsMForecasts:     MastersheetForecast[];
  guildFunnel:          GuildFunnelData[];
  dataDownloadedAt:     string;
  fetchedAt:            string;
}

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

    const data = JSON.parse(text);
    return {
      thisWeek:            data.thisWeek            ?? [],
      lastWeek:            data.lastWeek            ?? [],
      sdForecasts:         data.sdForecasts         ?? [],
      pipelineGen:          data.pipelineGen          ?? [],
      pipelineGenLastWeek:  data.pipelineGenLastWeek  ?? [],
      pipelineGenForecasts: data.pipelineGenForecasts ?? [],
      overviewComments:     data.overviewComments     ?? [],
      mastersheetForecasts: data.mastersheetForecasts ?? mockMastersheetForecasts,
      monthsMForecasts:     data.monthsMForecasts     ?? mockMonthsMForecasts,
      guildFunnel:          data.guildFunnel          ?? mockGuildFunnelData,
      dataDownloadedAt:     data.dataDownloadedAt     ?? '',
      fetchedAt:            data.fetchedAt            ?? new Date().toISOString(),
    };
  } catch (err) {
    console.error('fetchDashboardData failed, using mock data:', err);
    return { thisWeek: thisWeekDeals, lastWeek: lastWeekDeals, sdForecasts: [], pipelineGen: [], pipelineGenLastWeek: [], pipelineGenForecasts: [], overviewComments: [], mastersheetForecasts: mockMastersheetForecasts, monthsMForecasts: mockMonthsMForecasts, guildFunnel: mockGuildFunnelData, dataDownloadedAt: '', fetchedAt: new Date().toISOString() };
  }
}
