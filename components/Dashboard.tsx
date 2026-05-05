'use client';

import { useState } from 'react';
import { Deal, AreaKey, SubTabKey, AREAS, SUB_TABS, SDForecastEntry, PipelineGenDeal, PipelineGenForecastEntry, OverviewComment, MastersheetForecast } from '@/lib/types';
import SummaryPage from './SummaryPage';
import AreaPage from './AreaPage';

interface DashboardProps {
  thisWeek:             Deal[];
  lastWeek:             Deal[];
  sdForecasts:          SDForecastEntry[];
  pipelineGen:          PipelineGenDeal[];
  pipelineGenLastWeek:  PipelineGenDeal[];
  pipelineGenForecasts: PipelineGenForecastEntry[];
  overviewComments:     OverviewComment[];
  mastersheetForecasts: MastersheetForecast[];
  monthsMForecasts:     MastersheetForecast[];
  dataDownloadedAt:     string;
  fetchedAt:            string;
}

// Build YYYY-MM-DD from local date components to avoid UTC timezone shifts
function localISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function monthRange(offsetMonths = 0): [string, string] {
  const now  = new Date();
  const d    = new Date(now.getFullYear(), now.getMonth() - offsetMonths, 1);
  const y    = d.getFullYear();
  const m    = d.getMonth() + 1;
  const last = new Date(y, m, 0).getDate();
  return [localISO(y, m, 1), localISO(y, m, last)];
}

function quarterRange(offsetQuarters = 0): [string, string] {
  const now    = new Date();
  let   y      = now.getFullYear();
  let   q      = Math.ceil((now.getMonth() + 1) / 3) - offsetQuarters;
  while (q <= 0) { q += 4; y--; }
  const qStart = (q - 1) * 3 + 1;
  const qEnd   = q * 3;
  const last   = new Date(y, qEnd, 0).getDate();
  return [localISO(y, qStart, 1), localISO(y, qEnd, last)];
}

function yearRange(offsetYears = 0): [string, string] {
  const y = new Date().getFullYear() - offsetYears;
  return [localISO(y, 1, 1), localISO(y, 12, 31)];
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

const [defaultFrom, defaultTo] = monthRange();

export default function Dashboard({ thisWeek, lastWeek, sdForecasts, pipelineGen, pipelineGenLastWeek, pipelineGenForecasts, overviewComments, mastersheetForecasts, monthsMForecasts, dataDownloadedAt, fetchedAt }: DashboardProps) {
  const [activeArea,   setActiveArea]   = useState<AreaKey | 'summary'>('summary');
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('results');
  const [filterFrom,   setFilterFrom]   = useState(defaultFrom);
  const [filterTo,     setFilterTo]     = useState(defaultTo);

  const filteredThisWeek = filterByDate(thisWeek, filterFrom, filterTo);
  const filteredLastWeek = filterByDate(lastWeek, filterFrom, filterTo);

  const activeAreaConfig = AREAS.find(a => a.key === activeArea);

  function handleAreaClick(area: AreaKey) {
    setActiveArea(area);
    setActiveSubTab('results');
  }

  const [openDropdown, setOpenDropdown] = useState<'month' | 'quarter' | 'year' | null>(null);

  const now = new Date();

  // Build option lists
  const monthOptions = Array.from({ length: 7 }, (_, i) => {
    const [f, t] = monthRange(i);
    const d      = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label  = i === 0 ? 'This Month' : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    return { label, from: f, to: t };
  });

  const quarterOptions = Array.from({ length: 5 }, (_, i) => {
    const [f, t] = quarterRange(i);
    let   y      = now.getFullYear();
    let   q      = Math.ceil((now.getMonth() + 1) / 3) - i;
    while (q <= 0) { q += 4; y--; }
    const label  = i === 0 ? 'This Quarter' : `Q${q} ${y}`;
    return { label, from: f, to: t };
  });

  const yearOptions = Array.from({ length: 4 }, (_, i) => {
    const [f, t] = yearRange(i);
    const label  = i === 0 ? 'This Year' : String(now.getFullYear() - i);
    return { label, from: f, to: t };
  });

  function applyRange(from: string, to: string) {
    setFilterFrom(from);
    setFilterTo(to);
    setOpenDropdown(null);
  }

  // Determine which preset (if any) is active, for button label
  const activeMonth   = monthOptions.find(o => o.from === filterFrom && o.to === filterTo);
  const activeQuarter = quarterOptions.find(o => o.from === filterFrom && o.to === filterTo);
  const activeYear    = yearOptions.find(o => o.from === filterFrom && o.to === filterTo);
  const isCustom      = !activeMonth && !activeQuarter && !activeYear;

  const fetchTime = new Date(fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 flex flex-col gap-1 pt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/busuu-logo.png" alt="Busuu" className="h-8 w-auto self-start" />
            <h1 className="text-xl font-bold tracking-tight">B2B Trading Dashboard</h1>
          </div>

          {/* Quick presets + date inputs — hidden on Overview, wraps to second row on small screens */}
          {activeArea !== 'summary' && openDropdown && (
            <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
          )}
          {activeArea !== 'summary' && (
            <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto order-last lg:order-none">
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-1 py-1 relative z-20">
                {(
                  [
                    { key: 'month'   as const, options: monthOptions,   active: activeMonth   },
                    { key: 'quarter' as const, options: quarterOptions,  active: activeQuarter },
                    { key: 'year'    as const, options: yearOptions,     active: activeYear    },
                  ] as const
                ).map(({ key, options, active }) => (
                  <div key={key} className="relative">
                    <button
                      onClick={() => setOpenDropdown(o => o === key ? null : key)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        active ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {active ? active.label : options[0].label}
                      <span className="opacity-50 text-[10px]">▾</span>
                    </button>
                    {openDropdown === key && (
                      <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[160px]">
                        {options.map((o, i) => (
                          <button
                            key={o.from}
                            onClick={() => applyRange(o.from, o.to)}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between gap-3 ${
                              o.from === filterFrom && o.to === filterTo
                                ? 'text-white font-semibold bg-slate-700'
                                : 'text-slate-300 hover:text-white hover:bg-slate-700'
                            } ${i === 0 ? 'border-b border-slate-700 mb-0.5' : ''}`}
                          >
                            {o.label}
                            {o.from === filterFrom && o.to === filterTo && <span className="text-[10px] opacity-60">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isCustom && (
                  <span className="px-2.5 py-1 rounded text-xs font-medium bg-white text-slate-900">Custom</span>
                )}
              </div>
              <div className="flex items-center gap-2">
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
              </div>
            </div>
          )}

          {dataDownloadedAt && (
            <div className="text-right border-r border-slate-700 pr-4">
              <p className="text-slate-500 text-xs">Data downloaded</p>
              <p className="text-slate-300 text-sm font-medium">
                {dataDownloadedAt.replace(/^downloaded\s+/i, '')}
              </p>
            </div>
          )}
          <div className="text-right">
            <p className="text-slate-500 text-xs">Page fetched</p>
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
              {[
                ...SUB_TABS,
                ...(activeArea === 'new-business'
                  ? [{ key: 'pipeline-gen' as SubTabKey, label: 'Pipeline Generation' }]
                  : []),
              ].map(tab => (
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
          <SummaryPage allThisWeek={thisWeek} allLastWeek={lastWeek} sdForecasts={sdForecasts} overviewComments={overviewComments} mastersheetForecasts={mastersheetForecasts} monthsMForecasts={monthsMForecasts} onAreaClick={handleAreaClick} />
        ) : (
          <AreaPage
            area={activeArea}
            subTab={activeSubTab}
            thisWeek={filteredThisWeek.filter(d => d.area === activeArea)}
            lastWeek={filteredLastWeek.filter(d => d.area === activeArea)}
            allLastWeek={lastWeek.filter(d => d.area === activeArea)}
            allThisWeek={thisWeek.filter(d => d.area === activeArea)}
            sdForecast={sdForecasts.find(f => f.area === activeArea) ?? null}
            pipelineGen={pipelineGen}
            pipelineGenLastWeek={pipelineGenLastWeek}
            pipelineGenForecasts={pipelineGenForecasts}
          />
        )}
      </main>
    </div>
  );
}
