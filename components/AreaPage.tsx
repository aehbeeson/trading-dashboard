'use client';

import { Deal, AreaKey, SubTabKey, AREAS } from '@/lib/types';
import ResultsView from './views/ResultsView';
import ForecastView from './views/ForecastView';
import WoWView from './views/WoWView';

interface AreaPageProps {
  area: AreaKey;
  subTab: SubTabKey;
  thisWeek: Deal[];
  lastWeek: Deal[];
  allLastWeek: Deal[];
}

export default function AreaPage({ area, subTab, thisWeek, lastWeek, allLastWeek }: AreaPageProps) {
  const config = AREAS.find(a => a.key === area)!;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: config.accentColor }} />
        <h2 className="text-xl font-bold text-slate-900">{config.label}</h2>
      </div>

      {subTab === 'results'  && <ResultsView  deals={thisWeek} accentColor={config.accentColor} />}
      {subTab === 'forecast' && <ForecastView deals={thisWeek} accentColor={config.accentColor} />}
      {subTab === 'wow'      && <WoWView      thisWeek={thisWeek} lastWeek={lastWeek} allLastWeek={allLastWeek} accentColor={config.accentColor} />}
    </div>
  );
}
