'use client';

import { useState } from 'react';
import { Deal, AreaKey, SubTabKey, AREAS, SUB_TABS } from '@/lib/types';
import SummaryPage from './SummaryPage';
import AreaPage from './AreaPage';

interface DashboardProps {
  thisWeek: Deal[];
  lastWeek: Deal[];
  fetchedAt: string;
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

export default function Dashboard({ thisWeek, lastWeek, fetchedAt }: DashboardProps) {
  const [activeArea,   setActiveArea]   = useState<AreaKey | 'summary'>('summary');
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('results');
  const [filterFrom,   setFilterFrom]   = useState('');
  const [filterTo,     setFilterTo]     = useState('');

  const filteredThisWeek = filterByDate(thisWeek, filterFrom, filterTo);
  const filteredLastWeek = filterByDate(lastWeek, filterFrom, filterTo);

  const activeAreaConfig = AREAS.find(a => a.key === activeArea);

  function handleAreaClick(area: AreaKey) {
    setActiveArea(area);
    setActiveSubTab('results');
  }

  const fetchTime = new Date(fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const weekLabel = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center gap-6">
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">B2B Trading Dashboard</h1>
            <p className="text-slate-400 text-sm mt-0.5">Week of {weekLabel}</p>
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Close date</span>
            <input
              type="date"
              value={filterFrom}
              onChange={e => setFilterFrom(e.target.value)}
              className="text-sm bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-white"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              value={filterTo}
              onChange={e => setFilterTo(e.target.value)}
              className="text-sm bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-white"
            />
            {(filterFrom || filterTo) && (
              <button
                onClick={() => { setFilterFrom(''); setFilterTo(''); }}
                className="text-xs text-slate-400 hover:text-red-400 underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-right">
            <p className="text-slate-500 text-xs">Last updated</p>
            <p className="text-slate-300 text-sm font-medium">{fetchTime}</p>
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-6">
          <nav className="flex gap-1 pt-2">
            <button
              onClick={() => setActiveArea('summary')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeArea === 'summary'
                  ? 'bg-gray-50 text-slate-900'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Overview
            </button>
            {AREAS.map(area => (
              <button
                key={area.key}
                onClick={() => handleAreaClick(area.key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeArea === area.key
                    ? 'bg-gray-50 text-slate-900'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {area.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {activeArea !== 'summary' && activeAreaConfig && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-screen-xl mx-auto px-6">
            <nav className="flex gap-6">
              {SUB_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSubTab(tab.key)}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeSubTab === tab.key ? 'border-current' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  style={activeSubTab === tab.key ? { borderColor: activeAreaConfig.accentColor, color: activeAreaConfig.accentColor } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        {activeArea === 'summary' ? (
          <SummaryPage thisWeek={filteredThisWeek} lastWeek={filteredLastWeek} onAreaClick={handleAreaClick} />
        ) : (
          <AreaPage
            area={activeArea}
            subTab={activeSubTab}
            thisWeek={filteredThisWeek.filter(d => d.area === activeArea)}
            lastWeek={filteredLastWeek.filter(d => d.area === activeArea)}
          />
        )}
      </main>
    </div>
  );
}
