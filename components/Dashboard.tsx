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

// ─── Icons — minimal Lucide-style strokes ──────────────────────────────────────

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const AREA_ICON: Record<AreaKey, string> = {
  'new-business':     'M12 2v20 M2 12h20 M5 5l14 14 M19 5L5 19',
  'customer-success': 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  'resellers':        'M17 1l4 4-4 4 M3 11V9a4 4 0 0 1 4-4h14 M7 23l-4-4 4-4 M21 13v2a4 4 0 0 1-4 4H3',
  'guild-fll':        'M3 21h18 M6 21V7l6-4 6 4v14 M9 9v.01 M9 12v.01 M9 15v.01 M9 18v.01 M15 9v.01 M15 12v.01 M15 15v.01 M15 18v.01',
  'guild-ell':        'M3 21h18 M5 21V5a2 2 0 0 1 2-2h7l2 2h3a2 2 0 0 1 2 2v14 M9 9h1 M9 13h1 M9 17h1 M14 13h1 M14 17h1',
  'partnerships':     'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
};

const ICON_OVERVIEW   = 'M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z';
const ICON_MENU       = 'M4 6h16 M4 12h16 M4 18h16';
const ICON_CALENDAR   = 'M8 2v4 M16 2v4 M3 9h18 M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z';
const ICON_CHEVRON    = 'M6 9l6 6 6-6';

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
    <div className="flex min-h-screen">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 flex-col transform transition-transform duration-200 md:static md:translate-x-0 md:flex
                    bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-200 ${
          mobileNavOpen ? 'flex translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-5 pt-6 pb-5 border-b border-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/busuu-logo.png" alt="Busuu" className="h-9 w-auto" />
          <p className="mt-3 text-base font-extrabold text-white tracking-[0.08em] uppercase">B2B Trading</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 text-sm">
          <button
            onClick={handleOverviewClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 ${
              activeArea === 'summary'
                ? 'bg-white/10 text-white font-medium shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon d={ICON_OVERVIEW} className="opacity-80" />
            Overview
          </button>

          <div className="mt-5 mb-2 px-3 text-[10px] font-semibold text-slate-500 tracking-[0.18em] uppercase">
            Areas
          </div>

          <div className="space-y-0.5">
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
                    className={`w-full relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 ${
                      isActive
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full"
                        style={{ backgroundColor: area.accentColor }}
                      />
                    )}
                    <Icon d={AREA_ICON[area.key]} className="opacity-90" />
                    <span className="truncate">{area.label}</span>
                  </button>
                  {isActive && (
                    <div className="mt-1 mb-1.5 ml-[26px] pl-3 border-l border-white/5 animate-fade-in">
                      {tabs.map(t => {
                        const subActive = activeSubTab === t.key;
                        return (
                          <button
                            key={t.key}
                            onClick={() => handleSubTabClick(area.key, t.key)}
                            className={`w-full text-left px-2.5 py-1 rounded text-[12.5px] transition-colors ${
                              subActive ? 'font-semibold' : 'text-slate-400 hover:text-white'
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
          </div>
        </nav>

        <div className="border-t border-white/5 px-4 py-3 text-[11px] space-y-2">
          {dataDownloadedAt && (
            <div>
              <p className="text-slate-500 font-medium tracking-wide">Data downloaded</p>
              <p className="text-slate-300">{dataDownloadedAt.replace(/^downloaded\s+/i, '')}</p>
            </div>
          )}
          <div>
            <p className="text-slate-500 font-medium tracking-wide">Page fetched</p>
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
        <header className="sticky top-0 z-10 bg-white/75 backdrop-blur-xl border-b border-gray-200/70">
          <div className="h-14 flex items-center gap-3 px-4 md:px-8">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 rounded text-slate-600 hover:bg-gray-100"
              aria-label="Open navigation"
            >
              <Icon d={ICON_MENU} className="w-5 h-5" />
            </button>

            <h1 className="text-[13px] font-medium text-slate-700 flex items-center gap-2 min-w-0">
              {activeArea === 'summary' ? (
                <span className="text-slate-800 font-semibold">Overview</span>
              ) : (
                <>
                  {activeAreaConfig && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 shadow-[0_0_0_3px_rgba(255,255,255,0.6)]"
                      style={{ backgroundColor: activeAreaConfig.accentColor }}
                    />
                  )}
                  <span className="text-slate-500 truncate">{activeAreaConfig?.label}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-900 font-semibold truncate">
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
                <div className="flex items-center gap-0.5 bg-gray-100/80 ring-1 ring-inset ring-gray-200/70 rounded-lg px-0.5 py-0.5 relative z-20">
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
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          active
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-gray-200/70'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {active ? active.label : options[0].label}
                        <Icon d={ICON_CHEVRON} className="w-3 h-3 opacity-60" />
                      </button>
                      {openDropdown === key && (
                        <div className="absolute top-full right-0 mt-1.5 bg-white border border-gray-200/80 rounded-xl shadow-card-hover py-1.5 min-w-[180px] z-30 animate-slide-down">
                          {options.map((o, i) => (
                            <button
                              key={o.from}
                              onClick={() => applyRange(o.from, o.to)}
                              className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between gap-3 ${
                                o.from === filterFrom && o.to === filterTo
                                  ? 'text-slate-900 font-semibold bg-slate-50'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                              } ${i === 0 ? 'border-b border-gray-100 mb-1 pb-2' : ''}`}
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
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-slate-900 shadow-sm ring-1 ring-gray-200/70">
                      Custom
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex items-center gap-1.5 bg-white ring-1 ring-gray-200/70 rounded-lg px-2 py-1">
                  <Icon d={ICON_CALENDAR} className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={filterFrom}
                    onChange={e => setFilterFrom(e.target.value)}
                    className="text-xs text-slate-700 bg-transparent focus:outline-none w-[110px]"
                  />
                  <span className="text-slate-300 text-xs">→</span>
                  <input
                    type="date"
                    value={filterTo}
                    onChange={e => setFilterTo(e.target.value)}
                    className="text-xs text-slate-700 bg-transparent focus:outline-none w-[110px]"
                  />
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 min-w-0">
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
