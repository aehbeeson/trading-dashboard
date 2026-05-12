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
  const [activeArea,    setActiveArea]    = useState<AreaKey | 'summary'>('summary');
  const [activeSubTab,  setActiveSubTab]  = useState<SubTabKey>('results');
  const [filterFrom,    setFilterFrom]    = useState(defaultFrom);
  const [filterTo,      setFilterTo]      = useState(defaultTo);
  const [openDropdown,  setOpenDropdown]  = useState<'month' | 'quarter' | 'year' | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const filteredThisWeek = filterByDate(thisWeek, filterFrom, filterTo);
  const filteredLastWeek = filterByDate(lastWeek, filterFrom, filterTo);

  const activeAreaConfig = AREAS.find(a => a.key === activeArea);

  function handleAreaClick(area: AreaKey) {
    setActiveArea(area);
    setActiveSubTab('results');
    setMobileNavOpen(false);
  }

  function handleSubTabClick(area: AreaKey, sub: SubTabKey) {
    setActiveArea(area);
    setActiveSubTab(sub);
    setMobileNavOpen(false);
  }

  function handleOverviewClick() {
    setActiveArea('summary');
    setMobileNavOpen(false);
  }

  const now = new Date();

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

  const activeMonth   = monthOptions.find(o => o.from === filterFrom && o.to === filterTo);
  const activeQuarter = quarterOptions.find(o => o.from === filterFrom && o.to === filterTo);
  const activeYear    = yearOptions.find(o => o.from === filterFrom && o.to === filterTo);
  const isCustom      = !activeMonth && !activeQuarter && !activeYear;

  const fetchTime = new Date(fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const subTabsForActive: { key: SubTabKey; label: string }[] = activeAreaConfig
    ? [
        ...SUB_TABS,
        ...(activeArea === 'new-business'
          ? [{ key: 'pipeline-gen' as SubTabKey, label: 'Pipeline Generation' }]
          : []),
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-56 bg-slate-900 text-white flex-col transform transition-transform duration-200 md:static md:translate-x-0 md:flex ${
          mobileNavOpen ? 'flex translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-5 pt-5 pb-4 border-b border-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/busuu-logo.png" alt="Busuu" className="h-6 w-auto" />
          <p className="mt-2 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">B2B Trading</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 text-sm">
          <button
            onClick={handleOverviewClick}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-left transition-colors ${
              activeArea === 'summary'
                ? 'bg-slate-800 text-white font-medium'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Overview
          </button>

          <div className="mt-3 mb-1 px-3 text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
            Areas
          </div>

          {AREAS.map(area => {
            const isActive = activeArea === area.key;
            const tabs: { key: SubTabKey; label: string }[] = [
              ...SUB_TABS,
              ...(area.key === 'new-business'
                ? [{ key: 'pipeline-gen' as SubTabKey, label: 'Pipeline Generation' }]
                : []),
            ];
            return (
              <div key={area.key}>
                <button
                  onClick={() => handleAreaClick(area.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-left transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: area.accentColor }} />
                  <span className="truncate">{area.label}</span>
                </button>
                {isActive && (
                  <div className="mt-0.5 mb-1 ml-[18px] pl-3 border-l border-slate-800">
                    {tabs.map(t => {
                      const subActive = activeSubTab === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => handleSubTabClick(area.key, t.key)}
                          className={`w-full text-left px-2 py-1 rounded text-[12px] transition-colors ${
                            subActive ? 'font-medium' : 'text-slate-400 hover:text-white'
                          }`}
                          style={subActive ? { color: area.accentColor } : undefined}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 px-4 py-3 text-[11px] space-y-2">
          {dataDownloadedAt && (
            <div>
              <p className="text-slate-500">Data downloaded</p>
              <p className="text-slate-300">{dataDownloadedAt.replace(/^downloaded\s+/i, '')}</p>
            </div>
          )}
          <div>
            <p className="text-slate-500">Page fetched</p>
            <p className="text-slate-300">{fetchTime}</p>
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ── Main column ────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-white/85 backdrop-blur border-b border-gray-200">
          <div className="h-14 flex items-center gap-3 px-4 md:px-6">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 rounded text-slate-600 hover:bg-gray-100"
              aria-label="Open navigation"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M3 5h14v2H3zm0 4h14v2H3zm0 4h14v2H3z" />
              </svg>
            </button>

            <h1 className="text-sm font-medium text-slate-700 truncate flex items-center gap-2 min-w-0">
              {activeArea === 'summary' ? (
                'Overview'
              ) : (
                <>
                  {activeAreaConfig && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: activeAreaConfig.accentColor }}
                    />
                  )}
                  <span className="text-slate-500 truncate">{activeAreaConfig?.label}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-800 truncate">
                    {subTabsForActive.find(t => t.key === activeSubTab)?.label}
                  </span>
                </>
              )}
            </h1>

            <div className="flex-1" />

            {activeArea !== 'summary' && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {openDropdown && (
                  <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                )}
                <div className="flex items-center gap-0.5 bg-gray-100 rounded-md px-0.5 py-0.5 relative z-20">
                  {(
                    [
                      { key: 'month'   as const, options: monthOptions,   active: activeMonth   },
                      { key: 'quarter' as const, options: quarterOptions, active: activeQuarter },
                      { key: 'year'    as const, options: yearOptions,    active: activeYear    },
                    ] as const
                  ).map(({ key, options, active }) => (
                    <div key={key} className="relative">
                      <button
                        onClick={() => setOpenDropdown(o => o === key ? null : key)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          active
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {active ? active.label : options[0].label}
                        <span className="opacity-50 text-[10px]">▾</span>
                      </button>
                      {openDropdown === key && (
                        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px] z-30">
                          {options.map((o, i) => (
                            <button
                              key={o.from}
                              onClick={() => applyRange(o.from, o.to)}
                              className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between gap-3 ${
                                o.from === filterFrom && o.to === filterTo
                                  ? 'text-slate-900 font-semibold bg-gray-50'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-gray-50'
                              } ${i === 0 ? 'border-b border-gray-100 mb-0.5' : ''}`}
                            >
                              {o.label}
                              {o.from === filterFrom && o.to === filterTo && (
                                <span className="text-[10px] opacity-60">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {isCustom && (
                    <span className="px-2.5 py-1 rounded text-xs font-medium bg-white text-slate-900 shadow-sm">
                      Custom
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <input
                    type="date"
                    value={filterFrom}
                    onChange={e => setFilterFrom(e.target.value)}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <span className="text-slate-400 text-xs">–</span>
                  <input
                    type="date"
                    value={filterTo}
                    onChange={e => setFilterTo(e.target.value)}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 py-5 md:py-6 min-w-0">
          <div className="max-w-screen-xl mx-auto">
            {activeArea === 'summary' ? (
              <SummaryPage
                allThisWeek={thisWeek}
                allLastWeek={lastWeek}
                sdForecasts={sdForecasts}
                overviewComments={overviewComments}
                mastersheetForecasts={mastersheetForecasts}
                monthsMForecasts={monthsMForecasts}
                onAreaClick={handleAreaClick}
              />
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
          </div>
        </main>
      </div>
    </div>
  );
}
