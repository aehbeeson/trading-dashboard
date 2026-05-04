'use client';

import { useState } from 'react';
import { Deal, AreaKey, SubTabKey, AREAS } from '@/lib/types';
import ResultsView from './views/ResultsView';
import ForecastView from './views/ForecastView';
import WoWView from './views/WoWView';

interface AreaPageProps {
  area: AreaKey;
  subTab: SubTabKey;
  thisWeek: Deal[];
  lastWeek: Deal[];
}

function filterByDate(deals: Deal[], from: string, to: string): Deal[] {
  if (!from && !to) return deals;
  return deals.filter(d => {
    const dt = d.closeDate ? d.closeDate.substring(0, 10) : '';
    if (!dt) return true;
    if (from && dt < from) return false;
    if (to   && dt > to)   return false;
    return true;
  });
}

export default function AreaPage({ area, subTab, thisWeek, lastWeek }: AreaPageProps) {
  const config = AREAS.find(a => a.key === area)!;
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo,   setFilterTo]   = useState('');

  const filteredThisWeek = filterByDate(thisWeek, filterFrom, filterTo);
  const filteredLastWeek = filterByDate(lastWeek, filterFrom, filterTo);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: config.accentColor }} />
        <h2 className="text-xl font-bold text-slate-900">{config.label}</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">Close date</span>
          <input
            type="date"
            value={filterFrom}
            onChange={e => setFilterFrom(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-slate-700"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={filterTo}
            onChange={e => setFilterTo(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-slate-700"
          />
          {(filterFrom || filterTo) && (
            <button
              onClick={() => { setFilterFrom(''); setFilterTo(''); }}
              className="text-xs text-gray-400 hover:text-red-500 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {subTab === 'results'  && <ResultsView  deals={filteredThisWeek} accentColor={config.accentColor} />}
      {subTab === 'forecast' && <ForecastView deals={filteredThisWeek} accentColor={config.accentColor} />}
      {subTab === 'wow'      && <WoWView      thisWeek={filteredThisWeek} lastWeek={filteredLastWeek} accentColor={config.accentColor} />}
    </div>
  );
}
