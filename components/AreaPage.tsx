'use client';

import { Deal, AreaKey, SubTabKey, AREAS, GUILD_FUNNEL_AREAS, SDForecastEntry, PipelineGenDeal, PipelineGenForecastEntry, GuildFunnelData } from '@/lib/types';
import ResultsView from './views/ResultsView';
import ForecastView from './views/ForecastView';
import WoWView from './views/WoWView';
import PriorPeriodView from './views/PriorPeriodView';
import PipelineGenView from './views/PipelineGenView';
import GuildFunnelView from './views/GuildFunnelView';

interface AreaPageProps {
  area: AreaKey;
  subTab: SubTabKey;
  thisWeek: Deal[];
  lastWeek: Deal[];
  allLastWeek: Deal[];
  allThisWeek: Deal[];
  sdForecast: SDForecastEntry | null;
  pipelineGen:          PipelineGenDeal[];
  pipelineGenLastWeek:  PipelineGenDeal[];
  pipelineGenForecasts: PipelineGenForecastEntry[];
  guildFunnel:          GuildFunnelData | null;
}

export default function AreaPage({ area, subTab, thisWeek, lastWeek, allLastWeek, allThisWeek, sdForecast, pipelineGen, pipelineGenLastWeek, pipelineGenForecasts, guildFunnel }: AreaPageProps) {
  const config = AREAS.find(a => a.key === area)!;
  const usesFunnel = GUILD_FUNNEL_AREAS.includes(area);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span
          className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_0_4px_rgba(255,255,255,0.9)] ring-1 ring-black/5"
          style={{ backgroundColor: config.accentColor }}
        />
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{config.label}</h2>
      </div>

      {usesFunnel ? (
        guildFunnel && guildFunnel.periods.length > 0 ? (
          <GuildFunnelView key={area} data={guildFunnel} accentColor={config.accentColor} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card p-10 text-center text-slate-400 text-sm">
            No funnel data available for {config.label} yet.
          </div>
        )
      ) : (
        <>
          {subTab === 'results'  && <ResultsView      deals={thisWeek} accentColor={config.accentColor} />}
          {subTab === 'forecast' && <ForecastView     deals={allThisWeek} area={area} accentColor={config.accentColor} serverForecast={sdForecast} />}
          {subTab === 'wow'      && <WoWView          thisWeek={thisWeek} lastWeek={lastWeek} allLastWeek={allLastWeek} accentColor={config.accentColor} />}
          {subTab === 'prior'        && <PriorPeriodView  deals={allThisWeek} accentColor={config.accentColor} />}
          {subTab === 'pipeline-gen' && area === 'new-business' && (
            <PipelineGenView pipelineGen={pipelineGen} pipelineGenLastWeek={pipelineGenLastWeek} pipelineGenForecasts={pipelineGenForecasts} />
          )}
        </>
      )}
    </div>
  );
}
