'use client';

import { useState } from 'react';
import { Deal, AreaKey, SubTabKey, AREAS, SUB_TABS, SDForecastEntry, PipelineGenDeal, PipelineGenForecastEntry } from '@/lib/types';
import SummaryPage from './SummaryPage';
import AreaPage from './AreaPage';

interface DashboardProps {
  thisWeek:            Deal[];
  lastWeek:            Deal[];
  sdForecasts:         SDForecastEntry[];
  pipelineGen:          PipelineGenDeal[];
  pipelineGenLastWeek:  PipelineGenDeal[];
  pipelineGenForecasts: PipelineGenForecastEntry[];
  dataDownloadedAt:     string;
  fetchedAt:           string;
}

// Build YYYY-MM-DD from local date components to avoid UTC timezone shifts
function localISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function monthRange(): [string, string] {
  const now  = new Date();
  const y    = now.getFullYear();
  const m    = now.getMonth() + 1; // 1-based
  const last = new Date(y, m, 0).getDate();
  return [localISO(y, m, 1), localISO(y, m, last)];
}

function quarterRange(): [string, string] {
  const now      = new Date();
  const y        = now.getFullYear();
  const qStart   = Math.floor(now.getMonth() / 3) * 3 + 1; // 1-based start month
  const qEnd     = qStart + 2;
  const lastDay  = new Date(y, qEnd, 0).getDate();
  return [localISO(y, qStart, 1), localISO(y, qEnd, lastDay)];
}

function yearRange(): [string, string] {
  const y = new Date().getFullYear();
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

export default function Dashboard({ thisWeek, lastWeek, sdForecasts, pipelineGen, pipelineGenLastWeek, pipelineGenForecasts, dataDownloadedAt, fetchedAt }: DashboardProps) {
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

  function applyPreset(preset: 'month' | 'quarter' | 'year') {
    if (preset === 'month')   { const [f, t] = monthRange();   setFilterFrom(f); setFilterTo(t); }
    if (preset === 'quarter') { const [f, t] = quarterRange(); setFilterFrom(f); setFilterTo(t); }
    if (preset === 'year')    { const [f, t] = yearRange();    setFilterFrom(f); setFilterTo(t); }
  }

  const [mFrom, mTo] = monthRange();
  const [qFrom, qTo] = quarterRange();
  const [yFrom, yTo] = yearRange();
  const isMonth   = filterFrom === mFrom && filterTo === mTo;
  const isQuarter = filterFrom === qFrom && filterTo === qTo;
  const isYear    = filterFrom === yFrom && filterTo === yTo;
  const isCustom  = !isMonth && !isQuarter && !isYear;

  const fetchTime = new Date(fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const weekLabel = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const presetBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
        active ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">B2B Trading Dashboard</h1>
            <p className="text-slate-400 text-sm mt-0.5">Week of {weekLabel}</p>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-1 py-1">
            {presetBtn('This Month',   isMonth,   () => applyPreset('month'))}
            {presetBtn('This Quarter', isQuarter, () => applyPreset('quarter'))}
            {presetBtn('This Year',    isYear,    () => applyPreset('year'))}
            {isCustom && presetBtn('Custom', true, () => {})}
          </div>

          {/* Date inputs */}
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
          <SummaryPage thisWeek={filteredThisWeek} lastWeek={filteredLastWeek} allThisWeek={thisWeek} onAreaClick={handleAreaClick} />
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
